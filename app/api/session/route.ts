import { NextResponse } from "next/server";
import { sessionCookieKeys } from "@/lib/session";

type SessionBody = {
  uid?: string;
  name?: string;
  email?: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as SessionBody;
  const uid = String(body.uid || "").trim();
  const name = String(body.name || "User").trim();
  const email = String(body.email || "").trim();

  if (!uid) {
    return NextResponse.json({ ok: false, error: "missing_uid" }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true });
  const shared = {
    httpOnly: true as const,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  };

  response.cookies.set(sessionCookieKeys.uid, uid, shared);
  response.cookies.set(sessionCookieKeys.name, name || "User", shared);
  response.cookies.set(sessionCookieKeys.email, email, shared);
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(sessionCookieKeys.uid, "", {
    path: "/",
    maxAge: 0,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
  response.cookies.set(sessionCookieKeys.name, "", {
    path: "/",
    maxAge: 0,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
  response.cookies.set(sessionCookieKeys.email, "", {
    path: "/",
    maxAge: 0,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
  return response;
}
