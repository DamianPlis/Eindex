/// <reference types="vite/client" />
// @vitest-environment node
import { beforeEach, expect, test, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { convexTest } from "convex-test";
import { api } from "../convex/_generated/api";
import schema from "../convex/schema";
import type { Slot } from "../lib/schedule/types";
import { buildDaysForWeek } from "../lib/schedule/defaults";
import { getSlotContribution } from "../lib/schedule/usage";
import { getDashboardData, getPlanningPageState } from "../lib/schedule/store";
import PlanningPageClient from "../components/pages/PlanningPageClient";

const modules = import.meta.glob("../convex/**/*.ts");
const weekStart = "2026-10-05";
const mocks = vi.hoisted(() => ({
  query: vi.fn(),
  cards: [] as Array<{ slot: Slot; slotIndex: number }>,
}));

vi.mock("server-only", () => ({}));
vi.mock("@convex-dev/auth/nextjs/server", () => ({
  convexAuthNextjsToken: async () => "owner-token",
}));
vi.mock("convex/nextjs", () => ({ fetchQuery: mocks.query }));
vi.mock("../app/(app)/actions", () => ({
  setSlotSubjectAction: vi.fn(),
  setSlotTopicAction: vi.fn(),
}));
vi.mock("../components/i18n/UserSyncProvider", async () => {
  const { getMessages } = await import("../lib/i18n/messages");
  return { useAppLocale: () => "en", useMessages: () => getMessages("en") };
});
vi.mock("../components/pages/PlanningSlotCard", () => ({
  PlanningSlotCard: (props: { slot: Slot; slotIndex: number }) => {
    mocks.cards.push(props);
    return null;
  },
}));
vi.mock("../icons/chevron-left.svg", () => ({ default: () => null }));
vi.mock("../icons/chevron-right.svg", () => ({ default: () => null }));
vi.mock("../icons/chevrons-left.svg", () => ({ default: () => null }));
vi.mock("../icons/chevrons-right.svg", () => ({ default: () => null }));
vi.mock("../lib/schedule/defaults", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("../lib/schedule/defaults")>();
  return {
    ...original,
    buildDaysForWeek: (start: string) => {
      const days = original.buildDaysForWeek(start);
      // Reorder display slots while retaining their persisted coordinates.
      days[0].slots.reverse();
      const slots = days[2].slots;
      days[2].slots = [0, 1, 2, 4, 3, 5].map((coordinate) =>
        slots.find((slot) => slot.id === `${start}:2:${coordinate}`)!,
      );
      return days;
    },
  };
});

beforeEach(() => {
  mocks.query.mockReset();
  mocks.cards.length = 0;
});

test("dashboard and planning hydrate topics by stored ID after display reordering", async () => {
  mocks.query.mockResolvedValue({
    weekStart,
    weekStarts: [weekStart],
    hasSavedWeek: true,
    subjects: [],
    deadlines: [],
    slots: [
      {
        weekStart,
        dayIndex: 2,
        slotIndex: 4,
        subjectId: null,
        topic: "Aktuality topic",
        updatedAt: 1,
      },
      {
        weekStart,
        dayIndex: 2,
        slotIndex: 3,
        subjectId: "lunch",
        topic: "",
        updatedAt: 1,
      },
    ],
  });
  const dashboard = await getDashboardData("owner", "2026-10-07");
  const planning = await getPlanningPageState("owner", weekStart);
  for (const slots of [
    dashboard.slots,
    planning.weeks[weekStart].days[2].slots,
  ]) {
    expect(slots.find((slot) => slot.id === `${weekStart}:2:4`)?.topic).toBe(
      "Aktuality topic",
    );
    expect(
      slots.find((slot) => slot.id === `${weekStart}:2:3`)?.subjectId,
    ).toBe("lunch");
    expect(slots.find((slot) => slot.id === `${weekStart}:2:3`)?.topic).toBe(
      "",
    );
  }
});

test("usage weighting follows the stored coordinate rather than display position", () => {
  expect(
    getSlotContribution({
      weekStart,
      dayIndex: 0,
      slotIndex: 1,
      subjectId: "math",
    }),
  ).toEqual({
    subjectId: "math",
    date: weekStart,
    weightedCount: 2,
  });
});

test("Convex topic writes use the correct fixed template and still refuse lunch edits", async () => {
  const t = convexTest(schema, modules);
  const userId = await t.run(async (ctx) => {
    const id = await ctx.db.insert("users", { email: "owner@example.com" });
    await ctx.db.insert("userSettings", {
      userId: id,
      theme: "light",
      locale: "en",
      useSchoolYear: false,
      updatedAt: 1,
    });
    return id;
  });
  const owner = t.withIdentity({ subject: `${userId}|session` });
  expect(
    await owner.mutation(api.schedule.setSlotTopic, {
      weekStart,
      dayIndex: 2,
      slotIndex: 3,
      topic: "Must not save to lunch",
    }),
  ).toBeNull();
  const id = await owner.mutation(api.schedule.setSlotTopic, {
    weekStart,
    dayIndex: 2,
    slotIndex: 4,
    topic: "Aktuality topic",
  });
  expect(await t.run((ctx) => ctx.db.get(id!))).toMatchObject({
    slotIndex: 4,
    fixedKey: "currentEvents",
    allowTopic: true,
    topic: "Aktuality topic",
  });
});

test("planning cards pass persisted slot coordinates to edit callbacks", () => {
  renderToStaticMarkup(
    createElement(PlanningPageClient, {
      weekStart,
      currentWeekStart: weekStart,
      currentYear: 2026,
      prevWeek: "2026-09-28",
      nextWeek: "2026-10-12",
      days: buildDaysForWeek(weekStart),
      subjects: [],
    }),
  );
  expect(mocks.cards.length).toBeGreaterThan(0);
  for (const { slot, slotIndex } of mocks.cards) {
    expect(slotIndex).toBe(Number(slot.id.split(":")[2]));
  }
});
