import { mutation } from "../convex/_generated/server";

/**
 * Reconciles legacy users with newly created Convex Auth users:
 * 1. Backfills emailVerificationTime for legacy users.
 * 2. Remaps authAccounts and authSessions from any empty duplicate user to the legacy user.
 * 3. Safely deletes the empty duplicate user document.
 */
export const reconcileLegacyUsers = mutation({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();

    // Separate legacy users (synced from Firebase) and newer users
    const legacyUsers = users.filter((u) => u.firebaseUid !== undefined);
    const nonLegacyUsers = users.filter((u) => u.firebaseUid === undefined);

    let backfilledVerificationCount = 0;
    const remappedAccounts: string[] = [];
    const remappedSessions: string[] = [];
    const deletedDuplicateUsers: string[] = [];

    // 1. Backfill emailVerificationTime on all legacy users if missing
    for (const legacyUser of legacyUsers) {
      if (legacyUser.email && !legacyUser.emailVerificationTime) {
        await ctx.db.patch(legacyUser._id, {
          emailVerificationTime: Date.now(),
        });
        backfilledVerificationCount++;
      }
    }

    // 2. Reconcile non-legacy (duplicate) users matching by email
    for (const duplicateUser of nonLegacyUsers) {
      if (!duplicateUser.email) continue;

      const matchingLegacyUser = legacyUsers.find(
        (lu) => lu.email?.toLowerCase() === duplicateUser.email?.toLowerCase(),
      );

      if (!matchingLegacyUser) {
        continue;
      }

      // Safety check: ensure duplicate user doesn't own real data before deletion
      const [subjects, slots, settings, deadlines] = await Promise.all([
        ctx.db
          .query("subjects")
          .withIndex("by_user", (q) => q.eq("userId", duplicateUser._id))
          .take(1),
        ctx.db
          .query("scheduleSlots")
          .withIndex("by_user", (q) => q.eq("userId", duplicateUser._id))
          .take(1),
        ctx.db
          .query("userSettings")
          .withIndex("by_user", (q) => q.eq("userId", duplicateUser._id))
          .take(1),
        ctx.db
          .query("deadlines")
          .withIndex("by_user", (q) => q.eq("userId", duplicateUser._id))
          .take(1),
      ]);

      if (
        subjects.length > 0 ||
        slots.length > 0 ||
        settings.length > 0 ||
        deadlines.length > 0
      ) {
        throw new Error(
          `Safety check failed: User ${duplicateUser._id} (${duplicateUser.email}) has existing data. Cannot auto-delete.`,
        );
      }

      // Remap all authAccounts pointing to duplicateUser -> matchingLegacyUser
      const accounts = await ctx.db
        .query("authAccounts")
        .filter((q) => q.eq(q.field("userId"), duplicateUser._id))
        .collect();

      for (const account of accounts) {
        await ctx.db.patch(account._id, { userId: matchingLegacyUser._id });
        remappedAccounts.push(account._id);
      }

      // Remap all authSessions pointing to duplicateUser -> matchingLegacyUser
      const sessions = await ctx.db
        .query("authSessions")
        .filter((q) => q.eq(q.field("userId"), duplicateUser._id))
        .collect();

      for (const session of sessions) {
        await ctx.db.patch(session._id, { userId: matchingLegacyUser._id });
        remappedSessions.push(session._id);
      }

      // Delete the empty duplicate user document
      await ctx.db.delete(duplicateUser._id);
      deletedDuplicateUsers.push(duplicateUser._id);
    }

    return {
      backfilledVerificationCount,
      remappedAccountsCount: remappedAccounts.length,
      remappedSessionsCount: remappedSessions.length,
      deletedDuplicateUsers,
    };
  },
});
