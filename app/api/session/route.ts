import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { sessionCookieKeys } from "@/lib/session";

type SessionBody = {
  idToken?: string;
};

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 14;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as SessionBody;
  const idToken = String(body.idToken || "").trim();

  if (!idToken) {
    return NextResponse.json({ ok: false, error: "missing_id_token" }, { status: 400 });
  }

  try {
    const expiresIn = SESSION_MAX_AGE_SECONDS * 1000;
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
    const response = NextResponse.json({ ok: true });

    response.cookies.set(sessionCookieKeys.session, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "session_create_failed";
    return NextResponse.json({ ok: false, error: message }, { status: 401 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(sessionCookieKeys.session, "", {
    path: "/",
    maxAge: 0,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
  return response;
}
