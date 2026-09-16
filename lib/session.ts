import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

export type UserSession = {
  uid: string;
  name: string;
  email: string;
  photoUrl?: string;
};

/**
 * Retrieves the current user session from the Convex Auth JWT token.
 *
 * @returns The verified UserSession object, or null if no session is active or valid.
 */
export const getSession = cache(async (): Promise<UserSession | null> => {
  const token = await convexAuthNextjsToken();
  if (!token) return null;

  const user = await fetchQuery(api.users.viewer, {}, { token });
  if (!user) return null;
  await fetchMutation(api.users.ensureInitialized, {}, { token });

  return {
    uid: user._id,
    name: user.name || user.email || "User",
    email: user.email || "",
    photoUrl: user.image || "",
  };
});

/**
 * Requires a valid user session. If no session is active, redirects the user to the login page.
 *
 * @returns The active UserSession.
 */
export async function requireSession(): Promise<UserSession> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}
