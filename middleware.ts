import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isAppLocale } from "@/lib/i18n/config";
import { getLocaleFromPathname } from "@/lib/i18n/routing";

const isPublicPage = createRouteMatcher([
  "/login",
  "/about",
  "/:locale/login",
  "/:locale/about",
]);

const PUBLIC_FILE_PATTERN = /\.[^/]+$/;

const convexAuthHandler = convexAuthNextjsMiddleware(
  async (request, { convexAuth }) => {
    const { pathname } = request.nextUrl;

    if (
      pathname.startsWith("/api/") ||
      pathname.startsWith("/_next/") ||
      PUBLIC_FILE_PATTERN.test(pathname)
    ) {
      return NextResponse.next();
    }

    const isAuth = await convexAuth.isAuthenticated();
    console.log(`[proxy] pathname=${pathname} isAuth=${isAuth}`);

    if (!isPublicPage(request) && !isAuth) {
      return nextjsMiddlewareRedirect(request, "/login");
    }

    if (isPublicPage(request) && isAuth && pathname.includes("/login")) {
      return nextjsMiddlewareRedirect(request, "/");
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
    const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
    const locale =
      cookieLocale && isAppLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;

    const url = request.nextUrl.clone();
    url.pathname = pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;

    return NextResponse.redirect(url, 307);
  },
  { verbose: true },
);

export function proxy(request: NextRequest, event: any) {
  return convexAuthHandler(request, event);
}

export default proxy;

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
