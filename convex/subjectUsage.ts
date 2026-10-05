import { internalMutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { requireUser } from "./model";
import {
  getDateRange,
  getSlotContribution,
  type SlotUsageContribution,
} from "../lib/schedule/usage";
import { normalizeWeekKey } from "../lib/schedule/date-utils";

type PeriodKind = Doc<"subjectUsage">["periodKind"];
export type UsageChange = {
  before?: SlotUsageContribution | null;
  after: SlotUsageContribution | null;
};

function yearPeriods(date: string): {
  periodKind: PeriodKind;
  periodStart: string;
}[] {
  const year = Number(date.slice(0, 4));
  const month = Number(date.slice(5, 7));
  const periods: ReturnType<typeof yearPeriods> = [
    { periodKind: "calendar-year", periodStart: `${year}-01-01` },
  ];
  // The existing school-year definition excludes July and August.
  if (month <= 6 || month >= 9) {
    periods.push({
      periodKind: "school-year",
      periodStart: `${month >= 9 ? year : year - 1}-09-01`,
    });
  }
  return periods;
}

/** Apply each period/subject delta once, including for bulk imports/deletions. */
export async function applyUsageChanges(
  ctx: MutationCtx,
  userId: Id<"users">,
  changes: UsageChange[],
): Promise<void> {
  const deltas = new Map<
    string,
    {
      periodKind: PeriodKind;
      periodStart: string;
      subjectId: string;
      weightedCount: number;
    }
  >();
  for (const change of changes) {
    for (const [contribution, sign] of [
      [change.before, -1],
      [change.after, 1],
    ] as const) {
      if (!contribution) continue;
      for (const period of yearPeriods(contribution.date)) {
        const key = JSON.stringify([
          period.periodKind,
          period.periodStart,
          contribution.subjectId,
        ]);
        const delta = deltas.get(key) ?? {
          ...period,
          subjectId: contribution.subjectId,
          weightedCount: 0,
        };
        delta.weightedCount += contribution.weightedCount * sign;
        deltas.set(key, delta);
      }
    }
  }
  for (const delta of deltas.values()) {
    if (delta.weightedCount === 0) continue;
    const existing = await ctx.db
      .query("subjectUsage")
      .withIndex(
        "by_userId_and_periodKind_and_periodStart_and_subjectId",
        (q) =>
          q
            .eq("userId", userId)
            .eq("periodKind", delta.periodKind)
            .eq("periodStart", delta.periodStart)
            .eq("subjectId", delta.subjectId),
      )
      .unique();
    const weightedCount = (existing?.weightedCount ?? 0) + delta.weightedCount;
    if (weightedCount < 0)
      throw new Error("Subject usage totals are inconsistent");
    if (existing) {
      if (weightedCount === 0) await ctx.db.delete(existing._id);
      else await ctx.db.patch(existing._id, { weightedCount });
    } else if (weightedCount > 0) {
      await ctx.db.insert("subjectUsage", { userId, ...delta, weightedCount });
    }
  }
}

/** Start once per account; ordinary writes already count their changed slots. */
export async function ensureSubjectUsage(
  ctx: MutationCtx,
  userId: Id<"users">,
): Promise<void> {
  const state = await ctx.db
    .query("subjectUsageBackfills")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .unique();
  if (state) {
    if (state.complete) return;
    const job = state.jobId ? await ctx.db.system.get(state.jobId) : null;
    if (job?.state.kind === "pending" || job?.state.kind === "inProgress")
      return;
    const jobId = await ctx.scheduler.runAfter(
      0,
      internal.subjectUsage.backfill,
      {
        userId,
      },
    );
    await ctx.db.patch(state._id, { jobId });
    return;
  }
  const slot = await ctx.db
    .query("scheduleSlots")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .first();
  const stateId = await ctx.db.insert("subjectUsageBackfills", {
    userId,
    cursor: null,
    complete: slot === null,
  });
  if (slot) {
    const jobId = await ctx.scheduler.runAfter(
      0,
      internal.subjectUsage.backfill,
      {
        userId,
      },
    );
    await ctx.db.patch(stateId, { jobId });
  }
}

/** Count legacy slots exactly once, even if assignments change between batches. */
export const backfill = internalMutation({
  args: { userId: v.id("users") },
  returns: v.null(),
  handler: async (ctx, { userId }): Promise<null> => {
    const state = await ctx.db
      .query("subjectUsageBackfills")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!state || state.complete) return null;
    const page = await ctx.db
      .query("scheduleSlots")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .paginate({
        cursor: state.cursor,
        numItems: 100,
        maximumRowsRead: 100,
        maximumBytesRead: 1024 * 1024,
      });
    const uncounted = page.page
      .filter((slot) => slot.usageContribution === undefined)
      .map((slot) => ({ slot, contribution: getSlotContribution(slot) }));
    await applyUsageChanges(
      ctx,
      userId,
      uncounted.map(({ contribution }) => ({ after: contribution })),
    );
    for (const { slot, contribution } of uncounted) {
      await ctx.db.patch(slot._id, { usageContribution: contribution });
    }
    const jobId = page.isDone
      ? undefined
      : await ctx.scheduler.runAfter(0, internal.subjectUsage.backfill, {
          userId,
        });
    await ctx.db.patch(state._id, {
      cursor: page.continueCursor,
      complete: page.isDone,
      jobId,
    });
    return null;
  },
});

type PeriodRequest = {
  period: "week" | "month" | "year";
  startISO: string;
  endISO: string;
};

function validatePeriod(args: PeriodRequest) {
  for (const date of [args.startISO, args.endISO]) {
    const parsed = new Date(`${date}T12:00:00Z`);
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      Number.isNaN(parsed.getTime()) ||
      parsed.toISOString().slice(0, 10) !== date
    ) {
      throw new Error("Invalid statistics date");
    }
  }
  const schoolYear = args.period === "year" && args.startISO.endsWith("-09-01");
  const expected = getDateRange(
    args.period,
    new Date(`${args.startISO}T12:00:00Z`),
    0,
    schoolYear,
  );
  if (expected.startISO !== args.startISO || expected.endISO !== args.endISO) {
    throw new Error("Invalid statistics period");
  }
  return schoolYear ? "school-year" : "calendar-year";
}

/** Week/month reads stay bounded. Years use this only during the first backfill. */
async function readSlotsUsage(
  ctx: QueryCtx,
  userId: Id<"users">,
  args: PeriodRequest,
) {
  const slots = await ctx.db
    .query("scheduleSlots")
    .withIndex("by_user_week", (q) =>
      q
        .eq("userId", userId)
        .gte("weekStart", normalizeWeekKey(args.startISO))
        .lte("weekStart", normalizeWeekKey(args.endISO)),
    )
    .take(4001);
  if (slots.length > 4000)
    throw new Error("Too many slots in statistics period");
  const totals = new Map<string, number>();
  for (const slot of slots) {
    const contribution = getSlotContribution(slot);
    if (
      contribution &&
      contribution.date >= args.startISO &&
      contribution.date <= args.endISO
    ) {
      totals.set(
        contribution.subjectId,
        (totals.get(contribution.subjectId) ?? 0) + contribution.weightedCount,
      );
    }
  }
  return Array.from(totals, ([subjectId, weightedCount]) => ({
    subjectId,
    weightedCount,
  }));
}

export const getPeriodUsage = query({
  args: {
    period: v.union(v.literal("week"), v.literal("month"), v.literal("year")),
    startISO: v.string(),
    endISO: v.string(),
  },
  returns: v.array(
    v.object({ subjectId: v.string(), weightedCount: v.number() }),
  ),
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const periodKind = validatePeriod(args);
    if (args.period === "year") {
      const state = await ctx.db
        .query("subjectUsageBackfills")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .unique();
      if (state?.complete) {
        const totals = await ctx.db
          .query("subjectUsage")
          .withIndex(
            "by_userId_and_periodKind_and_periodStart_and_subjectId",
            (q) =>
              q
                .eq("userId", userId)
                .eq("periodKind", periodKind)
                .eq("periodStart", args.startISO),
          )
          .take(4001);
        if (totals.length > 4000)
          throw new Error("Too many subjects in statistics period");
        return totals.map(({ subjectId, weightedCount }) => ({
          subjectId,
          weightedCount,
        }));
      }
    }
    return await readSlotsUsage(ctx, userId, args);
  },
});
