import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { LOCALE_COOKIE } from "@/lib/i18n/config";
import { getLocaleFromPathname } from "@/lib/i18n/routing";

const PUBLIC_FILE_PATTERN = /\.[^/]+$/;

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    PUBLIC_FILE_PATTERN.test(pathname)
  ) {
    return NextResponse.next();
  }

  const locale = getLocaleFromPathname(pathname);
  if (!locale) return NextResponse.next();

  const response = NextResponse.next();
  response.cookies.set(LOCALE_COOKIE, locale, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
  });
  return response;
}

export const config = {
  matcher: "/:path*",
};
