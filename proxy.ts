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
    return NextResponse.next();
  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  const locale =
    getLocaleFromPathname(pathname) ??
    (cookieLocale && isAppLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE);
  const path = stripLocaleFromPath(pathname);
  const authenticated = await convexAuth.isAuthenticated();
  if (!authenticated && path !== "/login" && path !== "/about")
    return nextjsMiddlewareRedirect(request, localizePath(locale, "/login"));
  if (authenticated && path === "/login")
    return nextjsMiddlewareRedirect(request, localizePath(locale, "/"));
  if (!getLocaleFromPathname(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = localizePath(locale, pathname);
    return NextResponse.redirect(url, 307);
  }
  const response = NextResponse.next();
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
