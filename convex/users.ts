import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import schema from "./schema";
import { initializeUser, requireUser } from "./model";

export const viewer = query({
  args: {},
  returns: v.union(schema.doc("users"), v.null()),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    return userId ? await ctx.db.get(userId) : null;
  },
});
export const ensureInitialized = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    await initializeUser(ctx, await requireUser(ctx));
    return null;
  },
});
