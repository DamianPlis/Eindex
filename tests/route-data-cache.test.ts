// @vitest-environment node
import { beforeEach, expect, test, vi } from "vitest";
import { getFunctionName } from "convex/server";
import { buildDaysForWeek } from "../lib/schedule/defaults";

const runtime = await vi.hoisted(async () => {
  const { createRequire } = await import("node:module");
  const { dirname, join } = await import("node:path");
  const require = createRequire(join(process.cwd(), "package.json"));
  const entry = require.resolve("react");
  const serverEntry = join(dirname(entry), "react.react-server.js");
  const React: typeof import("react") = require(serverEntry);
  // Load Next's actual RSC renderer with the server React export. This selects
  // the react-server condition locally, without mocking cache or its dispatcher.
  const previous = require.cache[entry];
  require.cache[entry] = require.cache[serverEntry];
  let render: (
    model: unknown,
    manifest: object,
    options: { onError: (error: unknown) => void },
  ) => Promise<ReadableStream<Uint8Array>>;
  try {
    render =
      require("next/dist/compiled/react-server-dom-webpack/server.node").renderToReadableStream;
  } finally {
    if (previous) require.cache[entry] = previous;
    else delete require.cache[entry];
  }
  return { React, render, token: vi.fn(), query: vi.fn() };
});
vi.mock("react", () => runtime.React);
vi.mock("server-only", () => ({}));
vi.mock("@convex-dev/auth/nextjs/server", () => ({
  convexAuthNextjsToken: runtime.token,
}));
vi.mock("convex/nextjs", () => ({ fetchQuery: runtime.query }));
import {
  getDashboardData,
  getSettingsPageData,
  getDeadline,
} from "../lib/schedule/store";

async function renderLoads(...loads: Array<() => Promise<unknown>>) {
  const errors: unknown[] = [];
  const { createElement, Fragment, Suspense } = runtime.React;
  const children = loads.map((load, i) =>
    createElement(
      Suspense,
      { key: i, fallback: "Loading" },
      createElement(async function Data() {
        return JSON.stringify(await load());
      }),
    ),
  );
  const stream = await runtime.render(
    createElement(Fragment, null, ...children),
    {},
    {
      onError: (error) => {
        errors.push(error);
      },
    },
  );
  const output = await new Response(stream).text();
  if (errors.length) throw errors[0];
  return output;
}

beforeEach(() => {
  vi.resetAllMocks();
  runtime.token.mockResolvedValue("owner-token");
});

const dashboard = {
  slots: [],
  subjects: [],
  deadlines: [],
  lunchText: "",
  hasSavedWeek: true,
  weekStart: "2026-09-21",
};

test("dashboard siblings share one query per date and a fresh render gets a new token/result", async () => {
  runtime.query.mockResolvedValue(dashboard);
  await renderLoads(
    () => getDashboardData("owner", "2026-09-22"),
    () => getDashboardData("owner", "2026-09-22"),
    () => getDashboardData("owner", "2026-09-23"),
  );
  expect(runtime.query).toHaveBeenCalledTimes(2);
  expect(runtime.token).toHaveBeenCalledTimes(1);
  expect(runtime.query.mock.calls.map(([ref]) => getFunctionName(ref))).toEqual(
    ["dashboard:getDashboardData", "dashboard:getDashboardData"],
  );

  runtime.token.mockResolvedValue("refreshed-token");
  runtime.query.mockResolvedValue({ ...dashboard, hasSavedWeek: false });
  let fresh: Awaited<ReturnType<typeof getDashboardData>> | undefined;
  await renderLoads(
    async () => (fresh = await getDashboardData("owner", "2026-09-22")),
  );
  expect(fresh?.slots).toEqual([]);
  expect(runtime.query).toHaveBeenCalledTimes(3);
  expect(runtime.token).toHaveBeenCalledTimes(2);
  expect(runtime.query.mock.calls.at(-1)?.slice(1)).toEqual([
    { selectedISO: "2026-09-22" },
    { token: "refreshed-token" },
  ]);
});

test("dashboard preserves default templates, saved overrides, empty weeks, and weekends", async () => {
  const slots = [
    {
      weekStart: "2026-09-21",
      dayIndex: 1,
      slotIndex: 1,
      subjectId: "math",
      topic: "Geometry",
      updatedAt: 42,
    },
  ];
  runtime.query.mockResolvedValue({ ...dashboard, slots });
  const expected = buildDaysForWeek("2026-09-21")[1].slots;
  Object.assign(expected[1], {
    subjectId: "math",
    topic: "Geometry",
    updatedAt: 42,
  });
  expect((await getDashboardData("owner", "2026-09-22")).slots).toEqual(
    expected,
  );
  runtime.query.mockResolvedValue({
    ...dashboard,
    slots: [{ ...slots[0], dayIndex: 0 }],
  });
  expect((await getDashboardData("owner", "2026-09-22")).slots).toEqual(
    buildDaysForWeek("2026-09-21")[1].slots,
  );
  runtime.query.mockResolvedValue(dashboard);
  expect((await getDashboardData("owner", "2026-09-22")).slots).toEqual(
    buildDaysForWeek("2026-09-21")[1].slots,
  );
  expect((await getDashboardData("owner", "2026-09-26")).slots).toEqual([]);
  runtime.query.mockResolvedValue({ ...dashboard, hasSavedWeek: false });
  expect((await getDashboardData("owner", "2026-09-22")).slots).toEqual([]);
  runtime.query.mockResolvedValue({ ...dashboard, weekStart: "2025-09-22" });
  expect((await getDashboardData("owner", "2025-09-23")).slots).toEqual(
    buildDaysForWeek("2025-09-22")[1].slots,
  );
});

test("settings renders share just three needed reads and preserve UI mappings", async () => {
  runtime.query.mockImplementation(async (ref) => {
    switch (getFunctionName(ref)) {
      case "settings:getUserSettings":
        return { theme: "dark", locale: "pl", useSchoolYear: true };
      case "subjects:getSubjects":
        return [
          {
            slug: "math",
            name: "Math",
            color: "#123456",
            hiddenFromPlanning: true,
          },
        ];
      case "subjects:getSubjectGroups":
        return [
          {
            slug: "group",
            name: { cs: "Skupina" },
            subjectIds: ["math"],
            namePreferences: { pl: "cs" },
          },
        ];
      default:
        throw new Error("Unexpected full-state read");
    }
  });
  let result: Awaited<ReturnType<typeof getSettingsPageData>> | undefined;
  await renderLoads(
    async () => (result = await getSettingsPageData("owner")),
    () => getSettingsPageData("owner"),
  );
  expect(runtime.query).toHaveBeenCalledTimes(3);
  expect(runtime.token).toHaveBeenCalledTimes(1);
  expect(result).toEqual({
    settings: {
      theme: "dark",
      locale: "pl",
      useSchoolYear: true,
      planningSubjectSort: "count-desc",
    },
    subjects: [
      { id: "math", name: "Math", color: "#123456", hiddenFromPlanning: true },
    ],
    subjectGroups: [
      {
        id: "group",
        name: { cs: "Skupina" },
        subjectIds: ["math"],
        namePreferences: { pl: "cs" },
      },
    ],
  });
});

test("metadata/detail lookups share by ID, including null, and do not persist across requests", async () => {
  runtime.query.mockImplementation(async (_ref, args) =>
    args.deadlineId === "missing"
      ? null
      : {
          deadlineId: args.deadlineId,
          text: "Task",
          description: "Detail",
          date: "2026-09-22",
          status: "done",
        },
  );
  await renderLoads(
    () => getDeadline("owner", "task"),
    () => getDeadline("owner", "task"),
    () => getDeadline("owner", "missing"),
    () => getDeadline("owner", "missing"),
  );
  expect(runtime.query).toHaveBeenCalledTimes(2);
  expect(runtime.query.mock.calls.map(([ref]) => getFunctionName(ref))).toEqual(
    ["deadlines:getDeadline", "deadlines:getDeadline"],
  );
  runtime.token.mockResolvedValue("other-token");
  runtime.query.mockResolvedValue(null);
  let result: Awaited<ReturnType<typeof getDeadline>> | undefined;
  await renderLoads(async () => (result = await getDeadline("other", "task")));
  expect(result).toBeNull();
  expect(runtime.query).toHaveBeenCalledTimes(3);
  expect(runtime.query.mock.calls.at(-1)?.[2]).toEqual({
    token: "other-token",
  });
});

test("all narrow loaders reject absent authentication before querying Convex", async () => {
  runtime.token.mockResolvedValue(undefined);
  await expect(getDashboardData("owner", "2026-09-22")).rejects.toThrow(
    "Unauthorized",
  );
  await expect(getSettingsPageData("owner")).rejects.toThrow("Unauthorized");
  await expect(getDeadline("owner", "task")).rejects.toThrow("Unauthorized");
  expect(runtime.query).not.toHaveBeenCalled();
});
