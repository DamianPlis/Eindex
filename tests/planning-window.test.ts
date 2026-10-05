import { beforeEach, expect, test, vi } from "vitest";
import { getFunctionName } from "convex/server";
import { getMessages } from "../lib/i18n/messages";
import { sortPlanningSubjects } from "../lib/schedule/stats";

const mocks = vi.hoisted(() => ({
  token: vi.fn(),
  query: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@convex-dev/auth/nextjs/server", () => ({
  convexAuthNextjsToken: mocks.token,
}));
vi.mock("convex/nextjs", () => ({ fetchQuery: mocks.query }));

import { getPlanningPageState } from "../lib/schedule/store";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.token.mockResolvedValue("auth-token");
});

test("planning state hydrates only the selected week and its adjacent defaults", async () => {
  const previousWeekStart = "2024-12-30";
  const weekStart = "2025-01-06";
  const nextWeekStart = "2025-01-13";
  mocks.query.mockResolvedValue({
    weekStarts: [previousWeekStart, weekStart, nextWeekStart],
    subjects: [
      {
        slug: "math",
        name: "Math",
        color: "#123456",
        hiddenFromPlanning: true,
      },
      { slug: "english", name: "English", color: "#654321" },
    ],
    slots: [
      {
        weekStart: previousWeekStart,
        dayIndex: 0,
        slotIndex: 1,
        subjectId: "math",
        topic: "Past topic",
        updatedAt: 1,
      },
      {
        weekStart: nextWeekStart,
        dayIndex: 0,
        slotIndex: 2,
        subjectId: "english",
        topic: "Next topic",
        updatedAt: 2,
      },
      {
        weekStart: "2025-01-20",
        dayIndex: 0,
        slotIndex: 1,
        subjectId: "math",
        topic: "Outside window",
        updatedAt: 3,
      },
    ],
  });

  const state = await getPlanningPageState("user-a", weekStart);

  expect(Object.keys(state.weeks)).toEqual([
    previousWeekStart,
    weekStart,
    nextWeekStart,
  ]);
  expect(state.weeks[previousWeekStart].days[0].date).toBe("2024-12-30");
  expect(state.weeks[weekStart].days[4].date).toBe("2025-01-10");
  expect(state.weeks[nextWeekStart].days[4].date).toBe("2025-01-17");
  expect(state.weeks[previousWeekStart].days[0].slots[1].topic).toBe(
    "Past topic",
  );
  expect(state.weeks[nextWeekStart].days[0].slots[2].topic).toBe("Next topic");
  expect(state.weeks[weekStart].days[0].slots[1].topic).toBe("");
  expect(state.subjects).toEqual([
    {
      id: "math",
      name: "Math",
      color: "#123456",
      hiddenFromPlanning: true,
    },
    {
      id: "english",
      name: "English",
      color: "#654321",
      hiddenFromPlanning: false,
    },
  ]);

  const usage = { math: 2, english: 1 };
  expect(
    sortPlanningSubjects(
      state.subjects,
      "en",
      "count-desc",
      getMessages("en"),
      usage,
    ).map((subject) => subject.id),
  ).toEqual(["math", "english"]);

  const [ref, args, options] = mocks.query.mock.calls[0];
  expect(getFunctionName(ref)).toBe("schedule:getPlanningData");
  expect(args).toEqual({ weekStart });
  expect(options).toEqual({ token: "auth-token" });
});
