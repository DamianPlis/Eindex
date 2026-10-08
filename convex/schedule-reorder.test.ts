/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { getFunctionName } from "convex/server";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { buildDaysForWeek, migrateState } from "../lib/schedule/defaults";
import { buildLegacySlots } from "../scripts/legacy-slots";
import { getUserState } from "../lib/schedule/store";

const mocks = vi.hoisted(() => ({ token: vi.fn(), query: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@convex-dev/auth/nextjs/server", () => ({
  convexAuthNextjsToken: mocks.token,
}));
vi.mock("convex/nextjs", () => ({ fetchQuery: mocks.query }));

const modules = import.meta.glob("./**/*.ts");
const weekStart = "2026-10-05";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.token.mockResolvedValue("auth-token");
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-08T12:00:00Z"));
});
afterEach(() => vi.useRealTimers());

function savedBeforeReorder(withIds = true) {
  const dates = buildDaysForWeek(weekStart);
  const days = buildDaysForWeek("2026-09-28").map((day, dayIndex) => ({
    date: dates[dayIndex].date,
    slots: day.slots.map((slot, slotIndex) => ({
      ...slot,
      id: withIds ? `${weekStart}:${dayIndex}:${slotIndex}` : undefined,
    })),
  }));
  days[2].slots[1] = {
    ...days[2].slots[1],
    subjectId: "math",
    topic: "Algebra",
    updatedAt: 100,
  };
  days[2].slots[4] = {
    ...days[2].slots[4],
    topic: "Saved Aktualita topic",
    updatedAt: 200,
  };
  days[2].slots[5] = {
    ...days[2].slots[5],
    topic: "Saved PE topic",
    updatedAt: 300,
  };
  return { weekStart, days };
}

test("Wednesday moves Aktualita before lunch from 5 October and preserves older templates", () => {
  const previous = buildDaysForWeek("2026-09-28");
  expect(
    previous[2].slots.slice(3).map((slot) => [slot.fixedKey, slot.time]),
  ).toEqual([
    ["lunch", "11:30-12:05"],
    ["currentEvents", "12:05-13:05"],
    ["pe", "13:10-15:00"],
  ]);
  expect(buildDaysForWeek("2026-09-14")[2].slots[3]).toMatchObject({
    fixedKey: "lunch",
    time: "12:15-13:15",
  });
  for (const monday of [weekStart, "2026-10-12"]) {
    const days = buildDaysForWeek(monday);
    expect(
      days[2].slots.slice(3).map((slot) => [slot.id, slot.fixedKey, slot.time]),
    ).toEqual([
      [`${monday}:2:4`, "currentEvents", "11:30-12:30"],
      [`${monday}:2:3`, "lunch", "12:30-13:05"],
      [`${monday}:2:5`, "pe", "13:10-15:00"],
    ]);
    expect(
      days[2].slots.slice(0, 3).map((slot) => ({ ...slot, id: "" })),
    ).toEqual(
      previous[2].slots.slice(0, 3).map((slot) => ({ ...slot, id: "" })),
    );
    for (const dayIndex of [0, 1, 3, 4]) {
      expect(days[dayIndex].slots.map((slot) => ({ ...slot, id: "" }))).toEqual(
        previous[dayIndex].slots.map((slot) => ({ ...slot, id: "" })),
      );
    }
  }
});

test.each([true, false])(
  "saved topics survive reordering with saved IDs: %s",
  (withIds) => {
    const historicalWeekStart = "2026-09-28";
    const historical = {
      weekStart: historicalWeekStart,
      days: buildDaysForWeek(historicalWeekStart),
    };
    historical.days[2].slots[4].topic = "Historical Aktualita";
    historical.days[2].slots[4].updatedAt = 50;
    const saved = savedBeforeReorder(withIds);
    const rawSlots: unknown[] = saved.days[2].slots;
    rawSlots[0] = null;
    delete rawSlots[2];
    const state = migrateState({
      weeks: {
        [weekStart]: saved,
        [historicalWeekStart]: historical,
      },
    });
    const slots = state.weeks[weekStart].days[2].slots;
    expect(slots[0]).toMatchObject({ fixedKey: "morningCircle", updatedAt: 0 });
    expect(slots[2]).toMatchObject({
      subjectId: null,
      topic: "",
      updatedAt: 0,
    });
    expect(slots[1]).toMatchObject({
      subjectId: "math",
      topic: "Algebra",
      updatedAt: 100,
    });
    expect(slots[3]).toMatchObject({
      id: `${weekStart}:2:4`,
      fixedKey: "currentEvents",
      time: "11:30-12:30",
      topic: "Saved Aktualita topic",
      updatedAt: 200,
    });
    expect(slots[4]).toMatchObject({
      id: `${weekStart}:2:3`,
      fixedKey: "lunch",
      time: "12:30-13:05",
      subjectId: "lunch",
      topic: "",
    });
    expect(slots[5]).toMatchObject({ topic: "Saved PE topic", updatedAt: 300 });
    expect(state.weeks[historicalWeekStart]).toEqual(historical);
    expect(migrateState(state)).toEqual(state);
  },
);

test("legacy import keeps original coordinates after migrating a reordered week", () => {
  const state = migrateState({ weeks: { [weekStart]: savedBeforeReorder() } });
  const imported = buildLegacySlots(
    { [weekStart]: state.weeks[weekStart] },
    999,
  );
  const wednesday = imported.filter((slot) => slot.dayIndex === 2);
  expect(
    wednesday.find((slot) => slot.fixedKey === "currentEvents"),
  ).toMatchObject({
    slotIndex: 4,
    time: "11:30-12:30",
    topic: "Saved Aktualita topic",
    updatedAt: 200,
  });
  expect(wednesday.find((slot) => slot.fixedKey === "lunch")).toMatchObject({
    slotIndex: 3,
    time: "12:30-13:05",
    subjectId: "lunch",
  });
  expect(new Set(wednesday.map((slot) => slot.slotIndex)).size).toBe(
    wednesday.length,
  );
});

test("backend writes update existing Aktualita coordinate 4 and keep lunch coordinate 3 locked", async () => {
  const t = convexTest(schema, modules);
  const userId = await t.run((ctx) =>
    ctx.db.insert("users", { email: "schedule@example.com" }),
  );
  const owner = t.withIdentity({ subject: `${userId}|session` });
  const legacyRows = buildLegacySlots(
    { [weekStart]: savedBeforeReorder() },
    999,
  );
  await t.run(async (ctx) => {
    for (const row of legacyRows)
      await ctx.db.insert("scheduleSlots", {
        userId,
        ...row,
        updatedAt: row.updatedAt ?? 999,
      });
  });
  const before = await owner.query(api.schedule.getWeekSchedule, { weekStart });
  const currentEvents = before.slots.find(
    (slot) => slot.dayIndex === 2 && slot.slotIndex === 4,
  )!;
  const lunch = before.slots.find(
    (slot) => slot.dayIndex === 2 && slot.slotIndex === 3,
  )!;
  expect(
    await owner.mutation(api.schedule.setSlotTopic, {
      weekStart,
      dayIndex: 2,
      slotIndex: 4,
      topic: "Updated Aktualita topic",
    }),
  ).toBe(currentEvents._id);
  expect(
    await owner.mutation(api.schedule.setSlotTopic, {
      weekStart,
      dayIndex: 2,
      slotIndex: 3,
      topic: "Must stay locked",
    }),
  ).toBeNull();
  expect(
    await owner.mutation(api.schedule.setSlotSubject, {
      weekStart,
      dayIndex: 2,
      slotIndex: 3,
      subjectId: "math",
    }),
  ).toBe(lunch._id);
  const after = await owner.query(api.schedule.getWeekSchedule, { weekStart });
  expect(after.slots).toHaveLength(before.slots.length);
  expect(
    after.slots.find((slot) => slot._id === currentEvents._id),
  ).toMatchObject({
    fixedKey: "currentEvents",
    time: "11:30-12:30",
    topic: "Updated Aktualita topic",
  });
  expect(after.slots.find((slot) => slot._id === lunch._id)).toMatchObject({
    fixedKey: "lunch",
    time: "12:30-13:05",
    subjectId: "lunch",
    topic: "",
  });
  for (const slot of before.slots.filter(
    (row) => row._id !== currentEvents._id && row._id !== lunch._id,
  )) {
    expect(after.slots.find((row) => row._id === slot._id)).toEqual(slot);
  }
  const nextWeek = "2026-10-12";
  await owner.mutation(api.schedule.setSlotTopic, {
    weekStart: nextWeek,
    dayIndex: 2,
    slotIndex: 4,
    topic: "Next Aktualita",
  });
  await owner.mutation(api.schedule.setSlotSubject, {
    weekStart: nextWeek,
    dayIndex: 2,
    slotIndex: 3,
    subjectId: "math",
  });
  const next = await owner.query(api.schedule.getWeekSchedule, {
    weekStart: nextWeek,
  });
  expect(next.slots.find((slot) => slot.slotIndex === 4)).toMatchObject({
    fixedKey: "currentEvents",
    time: "11:30-12:30",
    topic: "Next Aktualita",
  });
  expect(next.slots.find((slot) => slot.slotIndex === 3)).toMatchObject({
    fixedKey: "lunch",
    time: "12:30-13:05",
    subjectId: "lunch",
  });
});

test("state hydration attaches saved coordinate 4 to Aktualita before lunch", async () => {
  const rows = buildLegacySlots({ [weekStart]: savedBeforeReorder() }, 999);
  mocks.query.mockImplementation(async (ref) =>
    getFunctionName(ref) === "schedule:listSlots"
      ? { page: rows, isDone: true, continueCursor: "" }
      : [],
  );
  const state = await getUserState();
  const slots = state.weeks[weekStart].days[2].slots;
  expect(slots[3]).toMatchObject({
    id: `${weekStart}:2:4`,
    fixedKey: "currentEvents",
    time: "11:30-12:30",
    topic: "Saved Aktualita topic",
    updatedAt: 200,
  });
  expect(slots[4]).toMatchObject({
    id: `${weekStart}:2:3`,
    fixedKey: "lunch",
    time: "12:30-13:05",
    subjectId: "lunch",
    topic: "",
  });
  expect(slots[1]).toMatchObject({ subjectId: "math", topic: "Algebra" });
  expect(slots[5]).toMatchObject({ topic: "Saved PE topic" });
  for (const call of mocks.query.mock.calls)
    expect(call[2]).toEqual({ token: "auth-token" });
});
