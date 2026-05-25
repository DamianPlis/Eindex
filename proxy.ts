import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isAppLocale } from "@/lib/i18n/config";
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

  const localeFromPath = getLocaleFromPathname(pathname);

  // URL already has a locale prefix — set the cookie and continue
  if (localeFromPath) {
    const response = NextResponse.next();
    response.cookies.set(LOCALE_COOKIE, localeFromPath, {
      httpOnly: false,
      sameSite: "lax",
      path: "/",
    });
    return response;
  }

  // No locale prefix — redirect to locale-prefixed URL.
  // This avoids a route-tree transition between app/(app) and app/[locale]/(app)
  // which causes "Rendered more hooks than during the previous render" in the Router.
  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  const locale =
    cookieLocale && isAppLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;

  const url = request.nextUrl.clone();
  url.pathname = pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;

  return NextResponse.redirect(url, 307);
}

export const config = {
  matcher: "/:path*",
};
