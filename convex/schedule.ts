import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import schema from "./schema";
import { requireUser, touchUser } from "./model";
import { buildDaysForWeek } from "../lib/schedule/defaults";
import { getSlotContribution } from "../lib/schedule/usage";
import { applyUsageChanges } from "./subjectUsage";

const coordinates = {
  weekStart: v.string(),
  dayIndex: v.number(),
  slotIndex: v.number(),
};
function template(args: {
  weekStart: string;
  dayIndex: number;
  slotIndex: number;
}) {
  const date = new Date(args.weekStart + "T12:00:00Z");
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(args.weekStart) ||
    Number.isNaN(date.getTime()) ||
    date.getUTCDay() !== 1 ||
    date.toISOString().slice(0, 10) !== args.weekStart ||
    !Number.isInteger(args.dayIndex) ||
    !Number.isInteger(args.slotIndex)
  )
    throw new Error("Invalid schedule coordinates");
  const day = buildDaysForWeek(args.weekStart)[args.dayIndex];
  const slot = day?.slots[args.slotIndex];
  if (!slot) throw new Error("Invalid schedule coordinates");
  return {
    date: day.date,
    time: slot.time,
    fixed: slot.fixed,
    fixedKey: slot.fixedKey ?? undefined,
    fixedLabel: slot.fixedLabel,
    allowTopic: slot.allowTopic,
  };
}
function getPlanningWeekStarts(weekStart: string) {
  const selected = new Date(`${weekStart}T12:00:00Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(weekStart) ||
    Number.isNaN(selected.getTime()) ||
    selected.getUTCDay() !== 1 ||
    selected.toISOString().slice(0, 10) !== weekStart
  ) {
    throw new Error("Invalid planning week start");
  }
  const previous = new Date(selected);
  previous.setUTCDate(previous.getUTCDate() - 7);
  const next = new Date(selected);
  next.setUTCDate(next.getUTCDate() + 7);
  return [
    previous.toISOString().slice(0, 10),
    weekStart,
    next.toISOString().slice(0, 10),
  ];
}
export const getPlanningData = query({
  args: { weekStart: v.string() },
  returns: v.object({
    slots: v.array(schema.doc("scheduleSlots")),
    subjects: v.array(schema.doc("subjects")),
    weekStarts: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const weekStarts = getPlanningWeekStarts(args.weekStart);
    const getWeekSlots = (weekStart: string) =>
      ctx.db
        .query("scheduleSlots")
        .withIndex("by_user_week", (q) =>
          q.eq("userId", userId).eq("weekStart", weekStart),
        )
        .take(100);
    const [weekSlots, subjects] = await Promise.all([
      Promise.all(weekStarts.map(getWeekSlots)),
      ctx.db
        .query("subjects")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .take(4001),
    ]);
    return {
      slots: weekSlots.flat(),
      subjects,
      weekStarts,
    };
  },
});
export const setSlotSubject = mutation({
  args: {
    ...coordinates,
    subjectId: v.union(v.string(), v.null()),
    writerId: v.optional(v.string()),
  },
  returns: v.id("scheduleSlots"),
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const defaults = template(args);
    const subjectId = defaults.fixed
      ? defaults.fixedKey === "lunch"
        ? "lunch"
        : null
      : args.subjectId;
    if (subjectId && subjectId !== "lunch") {
      const subject = await ctx.db
        .query("subjects")
        .withIndex("by_user_slug", (q) =>
          q.eq("userId", userId).eq("slug", subjectId),
        )
        .unique();
      if (!subject) throw new Error("Subject not found");
    }
    const existing = await ctx.db
      .query("scheduleSlots")
      .withIndex("by_user_slot_coord", (q) =>
        q
          .eq("userId", userId)
          .eq("weekStart", args.weekStart)
          .eq("dayIndex", args.dayIndex)
          .eq("slotIndex", args.slotIndex),
      )
      .unique();
    const updatedAt = Math.max(Date.now(), (existing?.updatedAt ?? 0) + 1);
    const usageContribution = getSlotContribution({ ...args, subjectId });
    const patch = {
      subjectId,
      updatedAt,
      lastWriter: args.writerId,
      usageContribution,
    };
    const id =
      existing?._id ??
      (await ctx.db.insert("scheduleSlots", {
        userId,
        weekStart: args.weekStart,
        dayIndex: args.dayIndex,
        slotIndex: args.slotIndex,
        ...defaults,
        topic: "",
        ...patch,
      }));
    if (existing) await ctx.db.patch(id, patch);
    await applyUsageChanges(ctx, userId, [
      { before: existing?.usageContribution, after: usageContribution },
    ]);
    await touchUser(ctx, userId, args.writerId);
    return id;
  },
});
export const setSlotTopic = mutation({
  args: { ...coordinates, topic: v.string(), writerId: v.optional(v.string()) },
  returns: v.union(v.id("scheduleSlots"), v.null()),
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const defaults = template(args);
    if (defaults.fixed && !defaults.allowTopic) return null;
    const existing = await ctx.db
      .query("scheduleSlots")
      .withIndex("by_user_slot_coord", (q) =>
        q
          .eq("userId", userId)
          .eq("weekStart", args.weekStart)
          .eq("dayIndex", args.dayIndex)
          .eq("slotIndex", args.slotIndex),
      )
      .unique();
    const usageContribution = getSlotContribution(
      existing ?? {
        ...args,
        subjectId: defaults.fixedKey === "lunch" ? "lunch" : null,
      },
    );
    const patch = {
      topic: args.topic,
      updatedAt: Math.max(Date.now(), (existing?.updatedAt ?? 0) + 1),
      lastWriter: args.writerId,
      usageContribution,
    };
    const id =
      existing?._id ??
      (await ctx.db.insert("scheduleSlots", {
        userId,
        weekStart: args.weekStart,
        dayIndex: args.dayIndex,
        slotIndex: args.slotIndex,
        ...defaults,
        subjectId: defaults.fixedKey === "lunch" ? "lunch" : null,
        ...patch,
      }));
    if (existing) await ctx.db.patch(id, patch);
    await applyUsageChanges(ctx, userId, [
      { before: existing?.usageContribution, after: usageContribution },
    ]);
    await touchUser(ctx, userId, args.writerId);
    return id;
  },
});
