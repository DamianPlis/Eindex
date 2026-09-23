import {
  convexAuthNextjsMiddleware,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";
import { NextResponse } from "next/server";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isAppLocale } from "@/lib/i18n/config";
import {
  getLocaleFromPathname,
  stripLocaleFromPath,
  localizePath,
} from "@/lib/i18n/routing";

export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  const { pathname } = request.nextUrl;
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    /\.[^/]+$/.test(pathname)
  )
    return NextResponse.next({ request: { headers: request.headers } });
  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  const locale =
    getLocaleFromPathname(pathname) ??
    (cookieLocale && isAppLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE);
  const path = stripLocaleFromPath(pathname);
  // Public pages can render immediately; LoginPanel handles restored sessions.
  if (path !== "/login" && path !== "/about") {
    const authenticated = await convexAuth.isAuthenticated();
    if (!authenticated)
      return nextjsMiddlewareRedirect(request, localizePath(locale, "/login"));
  }
  if (!getLocaleFromPathname(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = localizePath(locale, pathname);
    return NextResponse.redirect(url, 307);
  }
  // Convex Auth may have refreshed the request cookies. Forward them so SSR
  // sees the same session as the middleware, rather than the expired token.
  const response = NextResponse.next({ request: { headers: request.headers } });
  response.cookies.set(LOCALE_COOKIE, locale, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
  });
  return response;
});
export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
