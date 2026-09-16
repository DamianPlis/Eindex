import { mutation, query } from "./_generated/server";
import {
  paginationOptsValidator,
  paginationResultValidator,
} from "convex/server";
import { v } from "convex/values";
import schema from "./schema";
import { requireUser, touchUser } from "./model";
import { buildDaysForWeek } from "../lib/schedule/defaults";

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
export const listSlots = query({
  args: { paginationOpts: paginationOptsValidator },
  returns: paginationResultValidator(schema.doc("scheduleSlots")),
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    return await ctx.db
      .query("scheduleSlots")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .paginate(args.paginationOpts);
  },
});
export const getWeekSchedule = query({
  args: { weekStart: v.string() },
  returns: v.object({
    slots: v.array(schema.doc("scheduleSlots")),
    subjects: v.array(schema.doc("subjects")),
  }),
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const [slots, subjects] = await Promise.all([
      ctx.db
        .query("scheduleSlots")
        .withIndex("by_user_week", (q) =>
          q.eq("userId", userId).eq("weekStart", args.weekStart),
        )
        .take(100),
      ctx.db
        .query("subjects")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .take(1000),
    ]);
    return { slots, subjects };
  },
});
export const getDaySchedule = query({
  args: { date: v.string() },
  returns: v.array(schema.doc("scheduleSlots")),
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    return await ctx.db
      .query("scheduleSlots")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", userId).eq("date", args.date),
      )
      .take(100);
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
    const patch = { subjectId, updatedAt, lastWriter: args.writerId };
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
    const patch = {
      topic: args.topic,
      updatedAt: Math.max(Date.now(), (existing?.updatedAt ?? 0) + 1),
      lastWriter: args.writerId,
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
    await touchUser(ctx, userId, args.writerId);
    return id;
  },
});
