import { Children, isValidElement, type ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

const loaders = vi.hoisted(() => ({
  getUserSettings: vi.fn(),
  getPlanningPageState: vi.fn(),
  getPeriodUsage: vi.fn(),
  getSubjectCatalog: vi.fn(),
  getDeadlines: vi.fn(),
  getUserState: vi.fn(),
  getCachedUserState: vi.fn(),
}));

vi.mock("@/lib/schedule/store", () => loaders);
vi.mock("@/lib/session", () => ({
  requireSession: async () => ({ uid: "user" }),
}));
vi.mock("@/lib/i18n/server", () => ({ assertLocale: () => "en" }));
vi.mock("@/lib/metadata", () => ({ generatePageMetadata: vi.fn() }));
vi.mock("@/components/pages/PlanningPageClient", () => ({
  default: "planning",
}));
vi.mock("@/components/deadlines/AddDeadline", () => ({
  default: "add-deadline",
}));
vi.mock("@/components/deadlines/DeadlinesList", () => ({
  default: "deadlines",
}));
vi.mock("@/components/deadlines/StatsCard", () => ({ default: "stats" }));
vi.mock("@/components/skeletons/StatsCardSkeleton", () => ({
  default: "skeleton",
}));
vi.mock("@/components/skeletons/DeadlinesListSkeleton", () => ({
  default: "skeleton",
}));
vi.mock("@/components/deadlines/DeadlinesRefreshContext", () => ({
  DeadlinesRefreshProvider: "refresh-provider",
}));
vi.mock("@/components/deadlines/DeadlineToastProvider", () => ({
  DeadlineToastProvider: "toast-provider",
}));

import PlanningPage from "@/app/[locale]/(app)/planning/page";
import DeadlinesPage from "@/app/[locale]/(app)/deadlines/page";

async function resolveServerChildren(node: ReactNode): Promise<void> {
  if (!isValidElement<{ children?: ReactNode }>(node)) return;
  if (typeof node.type === "function") {
    const render = node.type as (
      props: object,
    ) => ReactNode | Promise<ReactNode>;
    await resolveServerChildren(await render(node.props));
    return;
  }
  for (const child of Children.toArray(node.props.children)) {
    await resolveServerChildren(child);
  }
}

afterEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe("page period summaries", () => {
  it.each([
    [false, "2026-01-01", "2026-12-31"],
    [true, "2026-09-01", "2027-06-30"],
  ])(
    "ranks an old planning week using today's year (school year: %s)",
    async (useSchoolYear, startISO, endISO) => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-10-01T12:00:00"));
      loaders.getUserSettings.mockResolvedValue({
        useSchoolYear,
        planningSubjectSort: "count-desc",
      });
      loaders.getPlanningPageState.mockResolvedValue({
        subjects: [
          { id: "maths", name: "Maths", color: "#000000" },
          { id: "physics", name: "Physics", color: "#ffffff" },
        ],
        weeks: {},
        subjectGroups: [],
        deadlines: [],
        lunches: {},
      });
      loaders.getPeriodUsage.mockResolvedValue([
        { subjectId: "maths", weightedCount: 1 },
        { subjectId: "physics", weightedCount: 20 },
      ]);

      const page = await PlanningPage({
        params: Promise.resolve({ locale: "en" }),
        searchParams: Promise.resolve({ week: "2024-01-08" }),
      });

      expect(loaders.getPlanningPageState).toHaveBeenCalledWith(
        "user",
        "2024-01-08",
      );
      expect(loaders.getPeriodUsage).toHaveBeenCalledWith(
        "user",
        "year",
        startISO,
        endISO,
      );
      expect(
        page.props.subjects.map((subject: { id: string }) => subject.id),
      ).toEqual(["physics", "maths"]);
      expect(loaders.getUserState).not.toHaveBeenCalled();
      expect(loaders.getCachedUserState).not.toHaveBeenCalled();
    },
  );

  it("alphabetical planning sorts skip usage reads", async () => {
    loaders.getUserSettings.mockResolvedValue({
      useSchoolYear: false,
      planningSubjectSort: "name-asc",
    });
    loaders.getPlanningPageState.mockResolvedValue({
      subjects: [
        { id: "physics", name: "Physics", color: "#ffffff" },
        { id: "maths", name: "Maths", color: "#000000" },
      ],
      weeks: {},
    });
    const page = await PlanningPage({
      params: Promise.resolve({ locale: "en" }),
      searchParams: Promise.resolve({ week: "2024-01-08" }),
    });
    expect(loaders.getPeriodUsage).not.toHaveBeenCalled();
    expect(
      page.props.subjects.map((subject: { id: string }) => subject.id),
    ).toEqual(["maths", "physics"]);
  });

  it("loads deadlines, catalog, and three summaries without schedule history", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-01T12:00:00"));
    loaders.getUserSettings.mockResolvedValue({ useSchoolYear: true });
    loaders.getSubjectCatalog.mockResolvedValue({
      subjects: [],
      subjectGroups: [],
    });
    loaders.getDeadlines.mockResolvedValue([]);
    loaders.getPeriodUsage.mockResolvedValue([]);

    await resolveServerChildren(
      await DeadlinesPage({ params: Promise.resolve({ locale: "en" }) }),
    );

    expect(loaders.getDeadlines).toHaveBeenCalledWith();
    expect(loaders.getSubjectCatalog).toHaveBeenCalledWith();
    expect(loaders.getPeriodUsage).toHaveBeenCalledTimes(3);
    expect(loaders.getPeriodUsage).toHaveBeenCalledWith(
      "user",
      "year",
      "2026-09-01",
      "2027-06-30",
    );
    expect(loaders.getUserState).not.toHaveBeenCalled();
    expect(loaders.getCachedUserState).not.toHaveBeenCalled();
  });
});
