import { query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getDashboardData = query({
  args: {
    selectedISO: v.string(), // YYYY-MM-DD
    canteenId: v.optional(v.string()), // e.g. "2069"
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const [slots, deadlines, subjects, lunch] = await Promise.all([
      ctx.db
        .query("scheduleSlots")
        .withIndex("by_user_date", (q) =>
          q.eq("userId", userId).eq("date", args.selectedISO)
        )
        .collect(),

      ctx.db
        .query("deadlines")
        .withIndex("by_user_date", (q) =>
          q.eq("userId", userId).eq("date", args.selectedISO)
        )
        .collect(),

      ctx.db
        .query("subjects")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect(),

      args.canteenId
        ? ctx.db
            .query("schoolLunches")
            .withIndex("by_canteen_date", (q) =>
              q.eq("canteenId", args.canteenId!).eq("date", args.selectedISO)
            )
            .first()
        : null,
    ]);

    return {
      slots,
      deadlines,
      subjects,
      lunchText: lunch?.menuText || "",
    };
  },
});
