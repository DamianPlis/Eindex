// @vitest-environment happy-dom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import LoginPanel from "@/components/auth/LoginPanel";
import { csMessages } from "@/lib/i18n/messages/cs";

const auth = vi.hoisted(() => ({ isLoading: true, isAuthenticated: false }));
const router = vi.hoisted(() => ({ replace: vi.fn() }));
const signIn = vi.hoisted(() => vi.fn());

vi.mock("convex/react", () => ({ useConvexAuth: () => auth }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("@convex-dev/auth/react", () => ({
  useAuthActions: () => ({ signIn }),
}));
vi.mock("@/components/i18n/UserSyncProvider", () => ({
  useAppLocale: () => "cs",
  useMessages: () => csMessages,
}));
vi.mock("@/components/auth/LoginLocaleSwitcher", () => ({
  default: () => null,
}));
vi.mock("next/link", () => ({ default: "a" }));

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.clearAllMocks();
  auth.isLoading = true;
  auth.isAuthenticated = false;
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

async function render() {
  await act(() => root.render(createElement(LoginPanel)));
  return container.querySelector("button")!;
}

test("renders the login screen while checking, then opens a restored session without a click", async () => {
  const button = await render();
  expect(container.querySelector("h1")?.textContent).toBe("Eindex");
  expect(button.textContent).toBe(csMessages.auth.checking);
  expect(button.disabled).toBe(true);
  expect(router.replace).not.toHaveBeenCalled();

  auth.isLoading = false;
  auth.isAuthenticated = true;
  await render();

  expect(router.replace).toHaveBeenCalledWith("/cs");
  expect(signIn).not.toHaveBeenCalled();
  expect(button.disabled).toBe(true);
  expect(button.textContent).toBe(csMessages.auth.checking);
});

test("allows manual Google login when no session exists and shows failures", async () => {
  await render();
  auth.isLoading = false;
  const button = await render();
  expect(button.disabled).toBe(false);
  expect(button.textContent).toBe(csMessages.auth.signInWithGoogle);
  expect(router.replace).not.toHaveBeenCalled();
  expect(signIn).not.toHaveBeenCalled();

  signIn.mockRejectedValueOnce(new Error("Login unavailable"));
  await act(() => button.click());

  expect(signIn).toHaveBeenCalledWith("google", { redirectTo: "/" });
  expect(container.textContent).toContain("Login unavailable");
  expect(button.disabled).toBe(false);
});

test("also leaves an already rendered signed-out screen when auth arrives later", async () => {
  auth.isLoading = false;
  await render();
  expect(router.replace).not.toHaveBeenCalled();

  auth.isAuthenticated = true;
  await render();
  expect(router.replace).toHaveBeenCalledWith("/cs");
  expect(signIn).not.toHaveBeenCalled();
});
