import { internalQuery } from "./_generated/server";
import { v } from "convex/values";
import schema from "./schema";

/** Read-only audit used by the offline cutover verifier, never exposed to browsers. */
export const legacySnapshot = internalQuery({
  args: { firebaseUid: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      user: schema.doc("users"),
      settings: v.union(v.null(), schema.doc("userSettings")),
      subjects: v.array(schema.doc("subjects")),
      groups: v.array(schema.doc("subjectGroups")),
      deadlines: v.array(schema.doc("deadlines")),
      slots: v.array(schema.doc("scheduleSlots")),
    }),
  ),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_firebase_uid", (q) =>
        q.eq("firebaseUid", args.firebaseUid),
      )
      .unique();
    if (!user) return null;
    const [settings, subjects, groups, deadlines, slots] = await Promise.all([
      ctx.db
        .query("userSettings")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .unique(),
      ctx.db
        .query("subjects")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .take(4001),
      ctx.db
        .query("subjectGroups")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .take(4001),
      ctx.db
        .query("deadlines")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .take(4001),
      ctx.db
        .query("scheduleSlots")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .take(10001),
    ]);
    if (
      subjects.length > 4000 ||
      groups.length > 4000 ||
      deadlines.length > 4000 ||
      slots.length > 10000
    )
      throw new Error("Snapshot exceeds audit limit; use a paginated export");
    return { user, settings, subjects, groups, deadlines, slots };
  },
});
