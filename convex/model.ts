import { getAuthUserId } from "@convex-dev/auth/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { migrateState } from "../lib/schedule/defaults";
import { DEFAULT_SETTINGS } from "../lib/settings/defaults";

export async function requireUser(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId || !(await ctx.db.get(userId))) throw new Error("Unauthorized");
  return userId;
}

/** Existing settings identify migrated/initialized accounts, including empty lists. */
export async function initializeUser(ctx: MutationCtx, userId: Id<"users">) {
  const settings = await ctx.db
    .query("userSettings")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .unique();
  if (settings) return;
  const now = Date.now();
  const defaults = migrateState(null);
  const existingSubject = await ctx.db
    .query("subjects")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .first();
  const existingGroup = await ctx.db
    .query("subjectGroups")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .first();
  if (!existingSubject) {
    for (const [order, subject] of defaults.subjects.entries()) {
      await ctx.db.insert("subjects", {
        userId,
        slug: subject.id,
        name: subject.name,
        color: subject.color,
        order,
        createdAt: now,
        updatedAt: now,
      });
    }
  }
  if (!existingGroup) {
    for (const [order, group] of defaults.subjectGroups.entries()) {
      await ctx.db.insert("subjectGroups", {
        userId,
        slug: group.id,
        name: group.name,
        subjectIds: group.subjectIds,
        order,
        updatedAt: now,
      });
    }
  }
  await ctx.db.insert("userSettings", {
    userId,
    ...DEFAULT_SETTINGS,
    updatedAt: now,
  });
}

/** A reactive revision updates server-rendered pages after any committed write. */
export async function touchUser(
  ctx: MutationCtx,
  userId: Id<"users">,
  writerId?: string,
) {
  await initializeUser(ctx, userId);
  const settings = await ctx.db
    .query("userSettings")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .unique();
  await ctx.db.patch(settings!._id, {
    updatedAt: Math.max(Date.now(), settings!.updatedAt + 1),
    lastWriter: writerId,
  });
}
