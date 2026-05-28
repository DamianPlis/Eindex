import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminAuth } from "@/lib/firebase/admin";

export type UserSession = {
  uid: string;
  name: string;
  email: string;
  photoUrl?: string;
};

const SESSION_COOKIE = "eindx_session";

/**
 * Retrieves the current user session from the signed session cookie.
 * Verifies the cookie using Firebase Admin Auth.
 * 
 * @returns The verified UserSession object, or null if no session is active or valid.
 */
export async function getSession(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE)?.value || "";
  if (!sessionCookie) return null;

  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    return {
      uid: decoded.uid,
      name: (decoded.name as string) || (decoded.email as string) || "User",
      email: (decoded.email as string) || "",
      photoUrl: (decoded.picture as string) || "",
    };
  } catch {
    return null;
  }
}

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

export const sessionCookieKeys = {
  session: SESSION_COOKIE,
} as const;
