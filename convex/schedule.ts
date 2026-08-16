import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getWeekSchedule = query({
  args: {
    weekStart: v.string(), // YYYY-MM-DD (Monday)
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { slots: [], subjects: [] };

    const [slots, subjects] = await Promise.all([
      ctx.db
        .query("scheduleSlots")
        .withIndex("by_user_week", (q) =>
          q.eq("userId", userId).eq("weekStart", args.weekStart)
        )
        .collect(),
      ctx.db
        .query("subjects")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect(),
    ]);

    return { slots, subjects };
  },
});

export const getDaySchedule = query({
  args: {
    date: v.string(), // YYYY-MM-DD
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("scheduleSlots")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", userId).eq("date", args.date)
      )
      .collect();
  },
});

export const setSlotSubject = mutation({
  args: {
    weekStart: v.string(),
    date: v.string(),
    dayIndex: v.number(),
    slotIndex: v.number(),
    time: v.string(),
    fixed: v.boolean(),
    fixedKey: v.optional(
      v.union(
        v.literal("morningCircle"),
        v.literal("currentEvents"),
        v.literal("lunch"),
        v.literal("tutor"),
        v.literal("pe"),
        v.literal("assembly")
      )
    ),
    fixedLabel: v.optional(v.string()),
    allowTopic: v.boolean(),
    subjectId: v.optional(v.union(v.string(), v.null())),
    writerId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const existingSlot = await ctx.db
      .query("scheduleSlots")
      .withIndex("by_user_slot_coord", (q) =>
        q
          .eq("userId", userId)
          .eq("weekStart", args.weekStart)
          .eq("dayIndex", args.dayIndex)
          .eq("slotIndex", args.slotIndex)
      )
      .first();

    const now = Date.now();

    let resolvedSubjectId = args.subjectId || null;
    if (args.fixed && args.fixedLabel && args.fixedLabel.toLowerCase().includes("obed")) {
      resolvedSubjectId = "lunch";
    } else if (args.fixed) {
      resolvedSubjectId = null;
    }

    if (existingSlot) {
      await ctx.db.patch(existingSlot._id, {
        subjectId: resolvedSubjectId,
        updatedAt: now,
        lastWriter: args.writerId,
      });
      return existingSlot._id;
    }

    return await ctx.db.insert("scheduleSlots", {
      userId,
      weekStart: args.weekStart,
      date: args.date,
      dayIndex: args.dayIndex,
      slotIndex: args.slotIndex,
      time: args.time,
      fixed: args.fixed,
      fixedKey: args.fixedKey,
      fixedLabel: args.fixedLabel,
      allowTopic: args.allowTopic,
      subjectId: resolvedSubjectId,
      topic: "",
      updatedAt: now,
      lastWriter: args.writerId,
    });
  },
});

export const setSlotTopic = mutation({
  args: {
    weekStart: v.string(),
    date: v.string(),
    dayIndex: v.number(),
    slotIndex: v.number(),
    time: v.string(),
    fixed: v.boolean(),
    fixedKey: v.optional(
      v.union(
        v.literal("morningCircle"),
        v.literal("currentEvents"),
        v.literal("lunch"),
        v.literal("tutor"),
        v.literal("pe"),
        v.literal("assembly")
      )
    ),
    fixedLabel: v.optional(v.string()),
    allowTopic: v.boolean(),
    topic: v.string(),
    writerId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const existingSlot = await ctx.db
      .query("scheduleSlots")
      .withIndex("by_user_slot_coord", (q) =>
        q
          .eq("userId", userId)
          .eq("weekStart", args.weekStart)
          .eq("dayIndex", args.dayIndex)
          .eq("slotIndex", args.slotIndex)
      )
      .first();

    const now = Date.now();

    if (existingSlot) {
      if (!existingSlot.allowTopic && existingSlot.fixed) return existingSlot._id;
      await ctx.db.patch(existingSlot._id, {
        topic: args.topic || "",
        updatedAt: now,
        lastWriter: args.writerId,
      });
      return existingSlot._id;
    }

    if (!args.allowTopic && args.fixed) return null;

    return await ctx.db.insert("scheduleSlots", {
      userId,
      weekStart: args.weekStart,
      date: args.date,
      dayIndex: args.dayIndex,
      slotIndex: args.slotIndex,
      time: args.time,
      fixed: args.fixed,
      fixedKey: args.fixedKey,
      fixedLabel: args.fixedLabel,
      allowTopic: args.allowTopic,
      subjectId: null,
      topic: args.topic || "",
      updatedAt: now,
      lastWriter: args.writerId,
    });
  },
});

export const getStatsData = query({
  args: {
    startISO: v.string(), // YYYY-MM-DD
    endISO: v.string(), // YYYY-MM-DD
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { counts: {}, subjects: [] };

    // Fetch all slots for this user with subject assigned
    const userSlots = await ctx.db
      .query("scheduleSlots")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const subjects = await ctx.db
      .query("subjects")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const counts: Record<string, number> = {};

    for (const slot of userSlots) {
      if (slot.date < args.startISO || slot.date > args.endISO) continue;
      if (!slot.subjectId || slot.subjectId === "lunch") continue;

      // Extract duration in minutes from slot.time "HH:MM-HH:MM"
      let weight = 1;
      const match = slot.time.match(/(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})/);
      if (match) {
        const startMins = Number(match[1]) * 60 + Number(match[2]);
        const endMins = Number(match[3]) * 60 + Number(match[4]);
        const diff = endMins - startMins;
        if (diff > 0) weight = Math.max(1, Math.round(diff / 60));
      }

      counts[slot.subjectId] = (counts[slot.subjectId] || 0) + weight;
    }

    return { counts, subjects };
  },
});
