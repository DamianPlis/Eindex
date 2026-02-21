import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type UserSession = {
  uid: string;
  name: string;
  email: string;
};

const UID_COOKIE = "eindx_uid";
const NAME_COOKIE = "eindx_name";
const EMAIL_COOKIE = "eindx_email";

export async function getSession(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const uid = cookieStore.get(UID_COOKIE)?.value || "";
  if (!uid) return null;
  return {
    uid,
    name: cookieStore.get(NAME_COOKIE)?.value || "User",
    email: cookieStore.get(EMAIL_COOKIE)?.value || "",
  };
}

export async function requireSession(): Promise<UserSession> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export const sessionCookieKeys = {
  uid: UID_COOKIE,
  name: NAME_COOKIE,
  email: EMAIL_COOKIE,
} as const;
