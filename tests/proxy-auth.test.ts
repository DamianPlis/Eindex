import { NextRequest, NextResponse, type NextFetchEvent } from "next/server";
import { beforeEach, expect, test, vi } from "vitest";
import type {
  convexAuthNextjsMiddleware,
  ConvexAuthNextjsMiddlewareContext,
} from "@convex-dev/auth/nextjs/server";
import proxy from "@/proxy";

const auth = vi.hoisted(() => ({
  isAuthenticated: vi.fn(),
  getToken: vi.fn(),
}));

// Exercise the app's handler with the request Convex Auth passes after refresh.
vi.mock("@convex-dev/auth/nextjs/server", () => ({
  convexAuthNextjsMiddleware:
    (handler: NonNullable<Parameters<typeof convexAuthNextjsMiddleware>[0]>) =>
    (request: NextRequest) =>
      handler(request, {
        convexAuth: auth satisfies ConvexAuthNextjsMiddlewareContext,
        event: {} as NextFetchEvent,
      }),
  nextjsMiddlewareRedirect: (request: NextRequest, path: string) =>
    NextResponse.redirect(new URL(path, request.url)),
}));

beforeEach(() => {
  vi.clearAllMocks();
  auth.isAuthenticated.mockResolvedValue(false);
});

async function request(path: string, cookie?: string) {
  return (await proxy(
    new NextRequest(`https://example.com${path}`, {
      headers: cookie ? { cookie } : undefined,
    }),
    {} as NextFetchEvent,
  )) as NextResponse;
}

test("renders public login without waiting for server auth verification", async () => {
  const response = await request("/cs/login");
  expect(response.headers.get("x-middleware-next")).toBe("1");
  expect(auth.isAuthenticated).not.toHaveBeenCalled();
});

test("still redirects unauthenticated dashboard requests to localized login", async () => {
  const response = await request("/en");
  expect(auth.isAuthenticated).toHaveBeenCalledOnce();
  expect(response.headers.get("location")).toBe("https://example.com/en/login");
});

test("forwards refreshed auth cookies to server rendering", async () => {
  auth.isAuthenticated.mockResolvedValue(true);
  const cookie = "__Host-__convexAuthJWT=refreshed-token";
  const response = await request("/cs", cookie);
  expect(response.headers.get("x-middleware-next")).toBe("1");
  expect(response.headers.get("x-middleware-request-cookie")).toBe(cookie);
  expect(response.headers.get("cookie")).toBeNull();
});

test("preserves locale routing for unprefixed login", async () => {
  const response = await request("/login", "eindx_locale=en");
  expect(response.headers.get("location")).toBe("https://example.com/en/login");
  expect(auth.isAuthenticated).not.toHaveBeenCalled();
});
