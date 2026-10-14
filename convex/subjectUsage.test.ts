/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";
import { buildDaysForWeek } from "../lib/schedule/defaults";
import { parseRangeMinutes } from "../lib/schedule/date-utils";
import { getDateRange } from "../lib/schedule/usage";

const modules = import.meta.glob("./**/*.ts");
const year2026 = {
  period: "year" as const,
  startISO: "2026-01-01",
  endISO: "2026-12-31",
};
const school2026 = {
  period: "year" as const,
  startISO: "2026-09-01",
  endISO: "2027-06-30",
};
const coord = { weekStart: "2026-09-14", dayIndex: 0, slotIndex: 1 };

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

async function setup(finishBackfill = true) {
  const t = convexTest(schema, modules);
  const [ownerId, otherId] = await t.run(async (ctx) => [
    await ctx.db.insert("users", {
      email: "owner@example.com",
      firebaseUid: "legacy-owner",
    }),
    await ctx.db.insert("users", { email: "other@example.com" }),
  ]);
  const owner = t.withIdentity({ subject: ownerId + "|session-owner" });
  const other = t.withIdentity({ subject: otherId + "|session-other" });
  if (finishBackfill) {
    await owner.mutation(api.users.ensureInitialized, {});
    await other.mutation(api.users.ensureInitialized, {});
    await t.finishAllScheduledFunctions(() => vi.runAllTimers());
  }
  return { t, owner, other, ownerId, otherId };
}

function slot(coordinates: typeof coord, subjectId: string | null = "math") {
  const day = buildDaysForWeek(coordinates.weekStart)[coordinates.dayIndex];
  const template = day.slots[coordinates.slotIndex];
  return {
    ...coordinates,
    date: day.date,
    time: template.time,
    fixed: template.fixed,
    fixedKey: template.fixedKey ?? undefined,
    fixedLabel: template.fixedLabel,
    allowTopic: template.allowTopic,
    subjectId,
    topic: "",
    updatedAt: 1,
  };
}

function counts(rows: { subjectId: string; weightedCount: number }[]) {
  return Object.fromEntries(
    rows.map(({ subjectId, weightedCount }) => [subjectId, weightedCount]),
  );
}

function legacySlots(count: number) {
  const fixtures: ReturnType<typeof slot>[] = [];
  const monday = new Date("2026-09-07T12:00:00Z");
  while (fixtures.length < count) {
    const weekStart = monday.toISOString().slice(0, 10);
    for (const [dayIndex, day] of buildDaysForWeek(weekStart).entries())
      for (const [slotIndex, template] of day.slots.entries())
        if (!template.fixed && fixtures.length < count)
          fixtures.push(slot({ weekStart, dayIndex, slotIndex }));
    monday.setUTCDate(monday.getUTCDate() + 7);
  }
  return fixtures;
}

function weight(fixture: ReturnType<typeof slot>) {
  return Math.max(1, Math.round((parseRangeMinutes(fixture.time) ?? 0) / 60));
}

test("assignment changes update both yearly totals once; topics, blanks and lunch do not count", async () => {
  const { owner } = await setup();
  const usage = async () =>
    counts(await owner.query(api.subjectUsage.getPeriodUsage, year2026));
  const assign = (subjectId: string | null) =>
    owner.mutation(api.schedule.setSlotSubject, { ...coord, subjectId });

  await assign("math");
  expect(await usage()).toEqual({ math: 2 });
  expect(
    counts(await owner.query(api.subjectUsage.getPeriodUsage, school2026)),
  ).toEqual({ math: 2 });
  await assign("math");
  await owner.mutation(api.schedule.setSlotTopic, {
    ...coord,
    topic: "Algebra",
  });
  expect(await usage()).toEqual({ math: 2 });

  await assign("czech");
  expect(await usage()).toEqual({ czech: 2 });
  await assign(null);
  await assign(null);
  await owner.mutation(api.schedule.setSlotTopic, {
    ...coord,
    slotIndex: 2,
    topic: "Unassigned topic",
  });
  await owner.mutation(api.schedule.setSlotSubject, {
    ...coord,
    slotIndex: 4,
    subjectId: "math",
  });
  expect(await usage()).toEqual({});
  expect(
    await owner.query(api.subjectUsage.getPeriodUsage, school2026),
  ).toEqual([]);
});

test("school years include June 30 and September 1, exclude July/August, and retain earlier calendar years", async () => {
  const { owner } = await setup();
  for (const coordinates of [
    { weekStart: "2026-06-29", dayIndex: 1, slotIndex: 1 },
    { weekStart: "2026-06-29", dayIndex: 2, slotIndex: 1 },
    { weekStart: "2026-08-31", dayIndex: 0, slotIndex: 1 },
    { weekStart: "2026-08-31", dayIndex: 1, slotIndex: 1 },
    { weekStart: "2024-01-08", dayIndex: 0, slotIndex: 1 },
  ])
    await owner.mutation(api.schedule.setSlotSubject, {
      ...coordinates,
      subjectId: "math",
    });

  expect(
    counts(await owner.query(api.subjectUsage.getPeriodUsage, year2026)),
  ).toEqual({ math: 8 });
  for (const range of [
    { startISO: "2025-09-01", endISO: "2026-06-30" },
    { startISO: "2026-09-01", endISO: "2027-06-30" },
    { startISO: "2024-01-01", endISO: "2024-12-31" },
  ])
    expect(
      counts(
        await owner.query(api.subjectUsage.getPeriodUsage, {
          period: "year",
          ...range,
        }),
      ),
    ).toEqual({ math: 2 });

  expect(
    counts(
      await owner.query(api.subjectUsage.getPeriodUsage, {
        period: "week",
        startISO: "2026-08-31",
        endISO: "2026-09-06",
      }),
    ),
  ).toEqual({ math: 4 });
  expect(
    counts(
      await owner.query(api.subjectUsage.getPeriodUsage, {
        period: "month",
        startISO: "2026-09-01",
        endISO: "2026-09-30",
      }),
    ),
  ).toEqual({ math: 2 });
});

test("a week across New Year splits calendar counters while keeping one school-year counter and duration weights", async () => {
  const { owner } = await setup();
  for (const [dayIndex, slotIndex] of [
    [0, 1],
    [3, 1],
    [4, 0],
  ])
    await owner.mutation(api.schedule.setSlotSubject, {
      weekStart: "2025-12-29",
      dayIndex,
      slotIndex,
      subjectId: "math",
    });
  expect(
    counts(
      await owner.query(api.subjectUsage.getPeriodUsage, {
        period: "year",
        startISO: "2025-01-01",
        endISO: "2025-12-31",
      }),
    ),
  ).toEqual({ math: 2 });
  expect(
    counts(await owner.query(api.subjectUsage.getPeriodUsage, year2026)),
  ).toEqual({ math: 8 });
  expect(
    counts(
      await owner.query(api.subjectUsage.getPeriodUsage, {
        period: "year",
        startISO: "2025-09-01",
        endISO: "2026-06-30",
      }),
    ),
  ).toEqual({ math: 10 });
});

test("imports use canonical template dates and weights and remain idempotent when repeated or replaced", async () => {
  const { t, owner } = await setup();
  const imported = {
    ...slot(coord),
    date: "1999-01-01",
    time: "08:00-15:00",
  };
  const sync = (subjectId: string | null) =>
    t.mutation(internal.sync.syncSlotsBatch, {
      firebaseUid: "legacy-owner",
      slots: [{ ...imported, subjectId }],
    });

  await sync("math");
  await sync("math");
  expect(
    counts(await owner.query(api.subjectUsage.getPeriodUsage, year2026)),
  ).toEqual({ math: 2 });
  expect(
    counts(
      await owner.query(api.subjectUsage.getPeriodUsage, {
        period: "week",
        startISO: "2026-09-14",
        endISO: "2026-09-20",
      }),
    ),
  ).toEqual({ math: 2 });
  await sync("czech");
  expect(
    counts(await owner.query(api.subjectUsage.getPeriodUsage, school2026)),
  ).toEqual({ czech: 2 });
  await sync(null);
  expect(await owner.query(api.subjectUsage.getPeriodUsage, year2026)).toEqual(
    [],
  );
});

test("legacy backfill agrees with fallback queries and survives edits before, between and after batches", async () => {
  const { t, owner, ownerId } = await setup(false);
  const fixtures = legacySlots(101);
  const total = fixtures.reduce((sum, fixture) => sum + weight(fixture), 0);
  await t.run(async (ctx) => {
    for (const fixture of fixtures)
      await ctx.db.insert("scheduleSlots", { userId: ownerId, ...fixture });
  });
  await owner.mutation(api.users.ensureInitialized, {});
  expect(
    counts(await owner.query(api.subjectUsage.getPeriodUsage, year2026)),
  ).toEqual({ math: total });

  // An unprocessed assignment must be cleared without subtracting a nonexistent counter.
  const cleared = fixtures[2];
  await owner.mutation(api.schedule.setSlotSubject, {
    weekStart: cleared.weekStart,
    dayIndex: cleared.dayIndex,
    slotIndex: cleared.slotIndex,
    subjectId: null,
  });
  await t.mutation(internal.subjectUsage.backfill, { userId: ownerId });
  expect(
    await t.run((ctx) =>
      ctx.db
        .query("subjectUsageBackfills")
        .withIndex("by_userId", (q) => q.eq("userId", ownerId))
        .unique(),
    ),
  ).toMatchObject({ complete: false });

  const changed = [fixtures[0], fixtures[100]];
  for (const fixture of changed)
    await owner.mutation(api.schedule.setSlotSubject, {
      weekStart: fixture.weekStart,
      dayIndex: fixture.dayIndex,
      slotIndex: fixture.slotIndex,
      subjectId: "czech",
    });
  await owner.mutation(api.schedule.setSlotSubject, {
    ...coord,
    weekStart: "2026-11-02",
    subjectId: "math",
  });
  const czech = changed.reduce((sum, fixture) => sum + weight(fixture), 0);
  const expected = { math: total - weight(cleared) - czech + 2, czech };
  const beforeComplete = counts(
    await owner.query(api.subjectUsage.getPeriodUsage, year2026),
  );
  expect(beforeComplete).toEqual(expected);

  await t.finishAllScheduledFunctions(() => vi.runAllTimers());
  await t.mutation(internal.subjectUsage.backfill, { userId: ownerId });
  await owner.mutation(api.users.ensureInitialized, {});
  await t.finishAllScheduledFunctions(() => vi.runAllTimers());
  expect(
    counts(await owner.query(api.subjectUsage.getPeriodUsage, year2026)),
  ).toEqual(beforeComplete);
  expect(
    counts(await owner.query(api.subjectUsage.getPeriodUsage, school2026)),
  ).toEqual(expected);
  const savedSlots = await t.run((ctx) =>
    ctx.db
      .query("scheduleSlots")
      .withIndex("by_user", (q) => q.eq("userId", ownerId))
      .take(200),
  );
  expect(
    savedSlots.every((saved) => saved.usageContribution !== undefined),
  ).toBe(true);
  const savedTotals = await t.run((ctx) =>
    ctx.db.query("subjectUsage").take(20),
  );
  expect(savedTotals).toHaveLength(4);
  expect(savedTotals.every((summary) => summary.weightedCount > 0)).toBe(true);
});

test("initialization resumes a canceled backfill from its saved cursor without double counting", async () => {
  const { t, owner, ownerId } = await setup(false);
  const fixtures = legacySlots(101);
  const total = fixtures.reduce((sum, fixture) => sum + weight(fixture), 0);
  await t.run(async (ctx) => {
    for (const fixture of fixtures)
      await ctx.db.insert("scheduleSlots", { userId: ownerId, ...fixture });
  });
  await owner.mutation(api.users.ensureInitialized, {});
  vi.runOnlyPendingTimers();
  await t.finishInProgressScheduledFunctions();
  const state = () =>
    t.run((ctx) =>
      ctx.db
        .query("subjectUsageBackfills")
        .withIndex("by_userId", (q) => q.eq("userId", ownerId))
        .unique(),
    );
  const interrupted = await state();
  expect(interrupted?.complete).toBe(false);
  expect(interrupted?.cursor).not.toBeNull();
  expect(interrupted?.jobId).toBeDefined();
  await t.run(async (ctx) => {
    await ctx.scheduler.cancel(interrupted!.jobId!);
  });

  await owner.mutation(api.users.ensureInitialized, {});
  const resumed = await state();
  expect(resumed?.cursor).toBe(interrupted?.cursor);
  expect(resumed?.jobId).toBeDefined();
  expect(resumed?.jobId).not.toBe(interrupted?.jobId);
  await owner.mutation(api.users.ensureInitialized, {});
  expect((await state())?.jobId).toBe(resumed?.jobId);
  await t.finishAllScheduledFunctions(() => vi.runAllTimers());
  expect(await state()).toMatchObject({ complete: true });
  expect((await state())?.jobId).toBeUndefined();
  expect(
    counts(await owner.query(api.subjectUsage.getPeriodUsage, year2026)),
  ).toEqual({ math: total });
});

test("deleting a subject removes its totals across years while preserving another user's assignments", async () => {
  const { owner, other } = await setup();
  for (const weekStart of [coord.weekStart, "2025-01-06"])
    await owner.mutation(api.schedule.setSlotSubject, {
      ...coord,
      weekStart,
      subjectId: "math",
    });
  await other.mutation(api.schedule.setSlotSubject, {
    ...coord,
    subjectId: "math",
  });
  await owner.mutation(api.subjects.deleteSubject, { slug: "math" });
  for (const range of [
    year2026,
    school2026,
    { period: "year" as const, startISO: "2025-01-01", endISO: "2025-12-31" },
  ])
    expect(await owner.query(api.subjectUsage.getPeriodUsage, range)).toEqual(
      [],
    );
  expect(
    counts(await other.query(api.subjectUsage.getPeriodUsage, year2026)),
  ).toEqual({ math: 2 });
});

test("usage queries are authenticated, isolated by user, and reject invalid or mismatched periods", async () => {
  const { t, owner, other } = await setup();
  await owner.mutation(api.schedule.setSlotSubject, {
    ...coord,
    subjectId: "math",
  });
  expect(await other.query(api.subjectUsage.getPeriodUsage, year2026)).toEqual(
    [],
  );
  await expect(
    t.query(api.subjectUsage.getPeriodUsage, year2026),
  ).rejects.toThrow("Unauthorized");
  for (const invalid of [
    { ...year2026, startISO: "2026-02-30" },
    { ...year2026, endISO: "2025-12-31" },
    { ...year2026, startISO: "2026-02-01" },
    { period: "week" as const, startISO: "2026-09-14", endISO: "2026-12-31" },
    { period: "month" as const, startISO: "2026-09-01", endISO: "2026-10-31" },
  ])
    await expect(
      owner.query(api.subjectUsage.getPeriodUsage, invalid),
    ).rejects.toThrow();
});

test("shared period boundaries handle Sunday, leap February and school-year offsets", () => {
  expect(getDateRange("week", new Date("2026-10-04T12:00:00"))).toEqual({
    startISO: "2026-09-28",
    endISO: "2026-10-04",
  });
  expect(getDateRange("month", new Date("2024-02-15T12:00:00"))).toEqual({
    startISO: "2024-02-01",
    endISO: "2024-02-29",
  });
  expect(
    getDateRange("year", new Date("2026-08-31T12:00:00"), 0, true),
  ).toEqual({ startISO: "2025-09-01", endISO: "2026-06-30" });
  expect(
    getDateRange("year", new Date("2026-09-01T12:00:00"), -1, true),
  ).toEqual({ startISO: "2025-09-01", endISO: "2026-06-30" });
});
