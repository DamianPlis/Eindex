import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getDeadlines = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("deadlines")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const getDeadlinesForDate = query({
  args: {
    date: v.string(), // YYYY-MM-DD
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("deadlines")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", userId).eq("date", args.date)
      )
      .collect();
  },
});

export const addDeadline = mutation({
  args: {
    text: v.string(),
    description: v.optional(v.string()),
    date: v.string(), // YYYY-MM-DD
    status: v.optional(
      v.union(
        v.literal("upcoming"),
        v.literal("today"),
        v.literal("expired"),
        v.literal("done")
      )
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const cleanText = args.text.trim();
    if (!cleanText || !args.date) throw new Error("Text and date are required");

    const now = Date.now();
    const deadlineId = crypto.randomUUID();

    const id = await ctx.db.insert("deadlines", {
      userId,
      deadlineId,
      text: cleanText,
      description: (args.description || "").trim(),
      date: args.date,
      status: args.status || "upcoming",
      createdAt: now,
      updatedAt: now,
    });

    return { _id: id, deadlineId };
  },
});

export const removeDeadline = mutation({
  args: {
    deadlineId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const deadline = await ctx.db
      .query("deadlines")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("deadlineId"), args.deadlineId))
      .first();

    if (deadline) {
      await ctx.db.delete(deadline._id);
    }

    return { success: true };
  },
});

export const markAsDone = mutation({
  args: {
    deadlineId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const deadline = await ctx.db
      .query("deadlines")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("deadlineId"), args.deadlineId))
      .first();

    if (deadline) {
      await ctx.db.patch(deadline._id, {
        status: "done",
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});
