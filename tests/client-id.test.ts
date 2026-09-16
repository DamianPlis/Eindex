import { afterEach, expect, test, vi } from "vitest";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});
test("writer identity is stable within one tab and distinct across tabs", async () => {
  let counter = 0;
  vi.stubGlobal("window", { crypto: { randomUUID: () => "tab-" + ++counter } });
  vi.resetModules();
  const firstTab = await import("../lib/sync/client-id");
  expect(firstTab.getClientId()).toBe("tab-1");
  expect(firstTab.getClientId()).toBe("tab-1");
  vi.resetModules();
  const secondTab = await import("../lib/sync/client-id");
  expect(secondTab.getClientId()).toBe("tab-2");
});
