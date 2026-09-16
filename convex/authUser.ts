import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { initializeUser } from "./model";

/** Only Google's verified address may link a sign-in to imported legacy data. */
export async function resolveAuthUser(
  ctx: MutationCtx,
  args: {
    existingUserId: Id<"users"> | null;
    profile: Record<string, unknown>;
  },
) {
  const email =
    typeof args.profile.email === "string"
      ? args.profile.email.trim().toLowerCase()
      : undefined;
  if (!email || args.profile.emailVerified !== true)
    throw new Error("A verified Google email is required");
  const profile = {
    email,
    name: typeof args.profile.name === "string" ? args.profile.name : undefined,
    image:
      typeof args.profile.image === "string" ? args.profile.image : undefined,
    emailVerificationTime: Date.now(),
  };
  let userId = args.existingUserId;
  if (!userId) {
    // Never arbitrarily choose between duplicate legacy identities.
    const matches = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .take(2);
    if (matches.length > 1)
      throw new Error("Duplicate accounts require migration review");
    userId = matches[0]?._id ?? null;
  }
  if (userId) {
    await ctx.db.patch(userId, profile);
  } else {
    userId = await ctx.db.insert("users", {
      ...profile,
      createdAt: Date.now(),
    });
  }
  await initializeUser(ctx, userId);
  return userId;
}
