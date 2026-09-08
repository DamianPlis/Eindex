import Google from "@auth/core/providers/google";
import { convexAuth } from "@convex-dev/auth/server";
import { type MutationCtx } from "./_generated/server";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Google],
  callbacks: {
    async createOrUpdateUser(rawCtx, args) {
      const ctx = rawCtx as unknown as MutationCtx;
      if (args.existingUserId) {
        return args.existingUserId;
      }

      const email =
        typeof args.profile.email === "string"
          ? args.profile.email.trim().toLowerCase()
          : undefined;
      const name =
        typeof args.profile.name === "string" ? args.profile.name : undefined;
      const image =
        typeof args.profile.image === "string" ? args.profile.image : undefined;

      if (email) {
        const existingUser = await ctx.db
          .query("users")
          .withIndex("email", (q) => q.eq("email", email))
          .first();

        if (existingUser) {
          await ctx.db.patch(existingUser._id, {
            emailVerificationTime: Date.now(),
            ...(name ? { name } : {}),
            ...(image ? { image } : {}),
          });
          return existingUser._id;
        }
      }

      return await ctx.db.insert("users", {
        email,
        name,
        image,
        emailVerificationTime: Date.now(),
        createdAt: Date.now(),
      });
    },
  },
});
