import { internalMutation, query } from "./_generated/server";
import { v } from "convex/values";
import schema from "./schema";

export const getLunchForDate = query({
  returns: v.union(schema.doc("schoolLunches"), v.null()),
  args: {
    canteenId: v.string(),
    date: v.string(), // YYYY-MM-DD
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("schoolLunches")
      .withIndex("by_canteen_date", (q) =>
        q.eq("canteenId", args.canteenId).eq("date", args.date),
      )
      .first();
  },
});

export const getLunchesForWeek = query({
  returns: v.record(v.string(), v.string()),
  args: {
    canteenId: v.string(),
    dates: v.array(v.string()), // array of YYYY-MM-DD strings
  },
  handler: async (ctx, args) => {
    const results: Record<string, string> = {};

    for (const date of args.dates) {
      const entry = await ctx.db
        .query("schoolLunches")
        .withIndex("by_canteen_date", (q) =>
          q.eq("canteenId", args.canteenId).eq("date", date),
        )
        .first();

      if (entry) {
        results[date] = entry.menuText;
      }
    }

    return results;
  },
});

export const upsertLunch = internalMutation({
  returns: v.id("schoolLunches"),
  args: {
    canteenId: v.string(),
    date: v.string(), // YYYY-MM-DD
    menuText: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("schoolLunches")
      .withIndex("by_canteen_date", (q) =>
        q.eq("canteenId", args.canteenId).eq("date", args.date),
      )
      .first();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        menuText: args.menuText,
        fetchedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("schoolLunches", {
      canteenId: args.canteenId,
      date: args.date,
      menuText: args.menuText,
      fetchedAt: now,
    });
  },
});
