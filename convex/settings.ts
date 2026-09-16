import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import schema, { planningSubjectSortValidator } from "./schema";
import { getAuthUserId } from "@convex-dev/auth/server";
import { initializeUser, requireUser } from "./model";
import type { Doc } from "./_generated/dataModel";

export const getUserSettings = query({
  args: {},
  returns: v.union(schema.doc("userSettings"), v.null()),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
  },
});
export const updateSettings = mutation({
  args: {
    theme: v.optional(v.union(v.literal("light"), v.literal("dark"))),
    locale: v.optional(
      v.union(v.literal("cs"), v.literal("en"), v.literal("pl")),
    ),
    useSchoolYear: v.optional(v.boolean()),
    planningSubjectSort: v.optional(planningSubjectSortValidator),
    writerId: v.optional(v.string()),
  },
  returns: schema.doc("userSettings"),
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    await initializeUser(ctx, userId);
    const existing = (await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique())!;
    const updates: Partial<Doc<"userSettings">> = {
      updatedAt: Math.max(Date.now(), existing.updatedAt + 1),
      lastWriter: args.writerId,
    };
    if (args.theme !== undefined) updates.theme = args.theme;
    if (args.locale !== undefined) updates.locale = args.locale;
    if (args.useSchoolYear !== undefined)
      updates.useSchoolYear = args.useSchoolYear;
    if (args.planningSubjectSort !== undefined)
      updates.planningSubjectSort = args.planningSubjectSort;
    await ctx.db.patch(existing._id, updates);
    return (await ctx.db.get(existing._id))!;
  },
});
