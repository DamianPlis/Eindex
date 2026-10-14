/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";
import { selectDashboardDeadlines } from "../lib/schedule/selectors";
import type { DeadlineItem } from "../lib/schedule/types";

const modules = import.meta.glob("./**/*.ts");
const selectedISO = "2026-09-22";
async function setup() {
  const t = convexTest(schema, modules);
  const [ownerId, otherId] = await t.run(async (ctx) => [
    await ctx.db.insert("users", { name: "Owner" }),
    await ctx.db.insert("users", { name: "Other" }),
  ]);
  return {
    t,
    ownerId,
    otherId,
    owner: t.withIdentity({ subject: `${ownerId}|session` }),
    other: t.withIdentity({ subject: `${otherId}|session` }),
  };
}

for (const attentionCount of [0, 1, 2, 3, 5]) {
  test(`dashboard matches full-list selection with ${attentionCount} due/overdue items`, async () => {
    const { t, owner, ownerId, otherId } = await setup();
    await t.run(async (ctx) => {
      for (let i = 0; i < attentionCount; i++) {
        await ctx.db.insert("deadlines", {
          userId: ownerId,
          deadlineId: `due-${i}`,
          text: `Due ${i}`,
          description: "",
          date: i % 2 ? selectedISO : "2026-09-20",
          status: "upcoming",
          order: 10 - i,
          createdAt: i,
          updatedAt: i,
        });
      }
      // More than three on one future date; custom/undo order differs from creation.
      for (let i = 0; i < 6; i++) {
        await ctx.db.insert("deadlines", {
          userId: ownerId,
          deadlineId: `future-${i}`,
          text: `Future ${i}`,
          description: "",
          date: "2026-09-23",
          status: "expired",
          order: 20 - i,
          createdAt: i,
          updatedAt: i,
        });
      }
      for (const [id, date, status] of [
        ["done-past", "2026-09-01", "done"],
        ["done-future", "2026-09-23", "done"],
        ["later", "2099-01-01", "upcoming"],
      ] as const) {
        await ctx.db.insert("deadlines", {
          userId: ownerId,
          deadlineId: id,
          text: id,
          description: "",
          date,
          status,
          createdAt: 1,
          updatedAt: 1,
        });
      }
      await ctx.db.insert("deadlines", {
        userId: otherId,
        deadlineId: "private",
        text: "Private",
        description: "",
        date: selectedISO,
        status: "today",
        createdAt: 1,
        updatedAt: 1,
      });
    });
    const full = await owner.query(api.deadlines.getDeadlines, {});
    const narrow = await owner.query(api.dashboard.getDashboardData, {
      selectedISO,
    });
    const map = (items: typeof full): DeadlineItem[] =>
      items.map((d) => ({ ...d, id: d.deadlineId }));
    expect(
      selectDashboardDeadlines(map(narrow.deadlines), selectedISO),
    ).toEqual(selectDashboardDeadlines(map(full), selectedISO));
    expect(
      narrow.deadlines.every(
        (d) => d.userId === ownerId && d.status !== "done",
      ),
    ).toBe(true);
    expect(narrow.deadlines.some((d) => d.deadlineId === "later")).toBe(false);
    if (attentionCount >= 3)
      expect(narrow.deadlines).toHaveLength(attentionCount);
  });
}

test("dashboard indexes isolate the selected date but detect a saved week on another day", async () => {
  const { t, owner, other, ownerId, otherId } = await setup();
  await t.run(async (ctx) => {
    for (const [userId, weekStart, date, dayIndex] of [
      [ownerId, "2026-09-21", "2026-09-21", 0],
      [ownerId, "2025-09-22", "2025-09-22", 0],
      [otherId, "2026-09-21", selectedISO, 1],
    ] as const) {
      await ctx.db.insert("scheduleSlots", {
        userId,
        weekStart,
        date,
        dayIndex,
        slotIndex: 1,
        time: "08:20-10:20",
        fixed: false,
        allowTopic: false,
        topic: "Saved",
        updatedAt: 1,
      });
    }
    await ctx.db.insert("subjects", {
      userId: otherId,
      slug: "private",
      name: "Private",
      color: "#000000",
      createdAt: 1,
      updatedAt: 1,
    });
  });
  const data = await owner.query(api.dashboard.getDashboardData, {
    selectedISO,
  });
  expect(data).toMatchObject({
    slots: [],
    hasSavedWeek: true,
    weekStart: "2026-09-21",
    subjects: [],
  });
  expect(
    (
      await owner.query(api.dashboard.getDashboardData, {
        selectedISO: "2026-10-06",
      })
    ).hasSavedWeek,
  ).toBe(false);
  expect(
    (
      await owner.query(api.dashboard.getDashboardData, {
        selectedISO: "2026-02-30",
      })
    ).weekStart,
  ).toBeNull();
  expect(
    (await other.query(api.dashboard.getDashboardData, { selectedISO })).slots,
  ).toHaveLength(1);
});

test("deadline detail is indexed by authenticated owner and application ID", async () => {
  const { t, owner, other, ownerId, otherId } = await setup();
  await t.run(async (ctx) => {
    for (const [userId, text] of [
      [ownerId, "Owner task"],
      [otherId, "Other task"],
    ] as const) {
      await ctx.db.insert("deadlines", {
        userId,
        deadlineId: "same-app-id",
        text,
        description: "Full detail",
        date: selectedISO,
        status: "upcoming",
        createdAt: 1,
        updatedAt: 1,
      });
    }
    await ctx.db.insert("deadlines", {
      userId: otherId,
      deadlineId: "foreign-only",
      text: "Private",
      description: "",
      date: selectedISO,
      status: "done",
      createdAt: 1,
      updatedAt: 1,
    });
  });
  expect(
    await owner.query(api.deadlines.getDeadline, { deadlineId: "same-app-id" }),
  ).toMatchObject({ text: "Owner task" });
  expect(
    await other.query(api.deadlines.getDeadline, { deadlineId: "same-app-id" }),
  ).toMatchObject({ text: "Other task" });
  expect(
    await owner.query(api.deadlines.getDeadline, {
      deadlineId: "foreign-only",
    }),
  ).toBeNull();
  expect(
    await owner.query(api.deadlines.getDeadline, { deadlineId: "missing" }),
  ).toBeNull();
  await expect(
    t.query(api.deadlines.getDeadline, { deadlineId: "same-app-id" }),
  ).rejects.toThrow("Unauthorized");
  await expect(
    t.query(api.dashboard.getDashboardData, { selectedISO }),
  ).rejects.toThrow("Unauthorized");
});

test("dashboard finds imported slots by coordinates despite legacy dates", async () => {
  const { t, owner, ownerId, otherId } = await setup();
  const weekStart = "2026-09-21";
  await t.run(async (ctx) => {
    await ctx.db.patch(ownerId, { firebaseUid: "owner-firebase" });
    await ctx.db.patch(otherId, { firebaseUid: "other-firebase" });
  });
  const slot = {
    weekStart,
    date: weekStart, // Legacy importer fallback for a day without a date.
    dayIndex: 1,
    slotIndex: 1,
    time: "08:20-10:20",
    fixed: false,
    allowTopic: false,
    subjectId: "math",
    topic: "Imported Tuesday",
  };
  await t.mutation(internal.sync.syncSlotsBatch, {
    firebaseUid: "owner-firebase",
    slots: [
      slot,
      { ...slot, dayIndex: 0, topic: "Monday" },
      {
        ...slot,
        weekStart: "2026-09-28",
        date: selectedISO,
        topic: "Other week",
      },
    ],
  });
  await t.mutation(internal.sync.syncSlotsBatch, {
    firebaseUid: "other-firebase",
    slots: [{ ...slot, date: selectedISO, topic: "Foreign user" }],
  });
  const data = await owner.query(api.dashboard.getDashboardData, {
    selectedISO,
  });
  expect(data.slots).toEqual([expect.objectContaining(slot)]);
  const monday = await owner.query(api.dashboard.getDashboardData, {
    selectedISO: weekStart,
  });
  expect(monday.slots.map((saved) => saved.topic)).toEqual(["Monday"]);
});
