import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getUserSettings = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const settings = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    return settings;
  },
});

export const updateSettings = mutation({
  args: {
    theme: v.optional(v.union(v.literal("light"), v.literal("dark"))),
    locale: v.optional(
      v.union(v.literal("cs"), v.literal("en"), v.literal("pl"))
    ),
    useSchoolYear: v.optional(v.boolean()),
    writerId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const existing = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const now = Date.now();

    if (existing) {
      const updates: Record<string, unknown> = { updatedAt: now };
      if (args.theme !== undefined) updates.theme = args.theme;
      if (args.locale !== undefined) updates.locale = args.locale;
      if (args.useSchoolYear !== undefined)
        updates.useSchoolYear = args.useSchoolYear;
      if (args.writerId !== undefined) updates.lastWriter = args.writerId;

      await ctx.db.patch(existing._id, updates);
      return { ...existing, ...updates };
    }

    const defaultSettings = {
      userId,
      theme: args.theme ?? ("light" as const),
      locale: args.locale ?? ("cs" as const),
      useSchoolYear: args.useSchoolYear ?? false,
      updatedAt: now,
      lastWriter: args.writerId,
    };

    const id = await ctx.db.insert("userSettings", defaultSettings);
    return { _id: id, ...defaultSettings };
  },
});
