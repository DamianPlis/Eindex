// @vitest-environment happy-dom

import { act, createElement } from "react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, expect, test, vi } from "vitest";
import StatsCard from "@/components/deadlines/StatsCard";
import { getMessages } from "@/lib/i18n/messages";
import { getDateRange } from "@/lib/schedule/stats";
import type { StatsOptions } from "@/lib/schedule/types";

const useQuery = vi.hoisted(() => vi.fn());
vi.mock("convex/react", () => ({
  useConvexAuth: () => ({ isAuthenticated: true }),
  useQuery,
}));
vi.mock("@/components/i18n/UserSyncProvider", () => ({
  useAppLocale: () => "en",
  useMessages: () => getMessages("en"),
}));
vi.mock("@/components/deadlines/SubjectsCombobox", () => ({
  default: () => null,
}));
vi.mock("@/components/deadlines/useStatsPeriodSwipe", () => ({
  useStatsPeriodSwipe: () => ({
    cardRef: { current: null },
    contentRef: { current: null },
  }),
}));
vi.mock("@/icons/sort.svg", () => ({ default: () => null }));

let root: Root | undefined;
let container: HTMLDivElement | undefined;

afterEach(async () => {
  if (root) await act(() => root!.unmount());
  container?.remove();
  root = undefined;
  container = undefined;
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

test.each([
  {
    period: "week",
    serverISO: "2026-10-04",
    localISO: "2026-10-05",
    startISO: "2026-10-05",
    endISO: "2026-10-11",
    useSchoolYear: false,
  },
  {
    period: "month",
    serverISO: "2026-10-31",
    localISO: "2026-11-01",
    startISO: "2026-11-01",
    endISO: "2026-11-30",
    useSchoolYear: false,
  },
  {
    period: "year",
    serverISO: "2026-12-31",
    localISO: "2027-01-01",
    startISO: "2027-01-01",
    endISO: "2027-12-31",
    useSchoolYear: false,
  },
  {
    period: "year",
    serverISO: "2026-08-31",
    localISO: "2026-09-01",
    startISO: "2026-09-01",
    endISO: "2027-06-30",
    useSchoolYear: true,
  },
])(
  "hydrates the server date, then uses the local $period boundary (school year: $useSchoolYear)",
  async ({ period, serverISO, localISO, startISO, endISO, useSchoolYear }) => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(`${localISO}T00:30:00`));
    useQuery.mockReturnValue(undefined);
    const initialRange = getDateRange(
      period as StatsOptions,
      new Date(`${serverISO}T12:00:00`),
      0,
      useSchoolYear,
    );
    const card = createElement(StatsCard, {
      period: period as StatsOptions,
      subjects: [],
      subjectGroups: [],
      referenceISO: serverISO,
      initialRange,
      initialUsage: [{ subjectId: "old-period", weightedCount: 7 }],
      useSchoolYear,
    });
    container = document.createElement("div");
    container.innerHTML = renderToString(card);
    document.body.append(container);
    expect(useQuery).toHaveBeenLastCalledWith(expect.anything(), {
      period,
      ...initialRange,
    });
    expect(container.textContent).toContain("old-period: 7");

    useQuery.mockClear();
    const onRecoverableError = vi.fn();
    await act(() => {
      root = hydrateRoot(container!, card, { onRecoverableError });
    });
    expect(onRecoverableError).not.toHaveBeenCalled();
    expect(useQuery.mock.calls[0]?.[1]).toEqual({ period, ...initialRange });
    expect(useQuery).toHaveBeenLastCalledWith(expect.anything(), {
      period,
      startISO,
      endISO,
    });
    expect(container.textContent).not.toContain("old-period: 7");
    expect(container.querySelector('[role="status"]')?.textContent).toBe(
      getMessages("en").common.loading,
    );

    await act(() => {
      container!
        .querySelector<HTMLButtonElement>(
          `button[aria-label="${getMessages("en").deadlines.statistics.previous}"]`,
        )!
        .click();
    });
    expect(useQuery).toHaveBeenLastCalledWith(expect.anything(), {
      period,
      ...getDateRange(
        period as StatsOptions,
        new Date(`${localISO}T12:00:00`),
        -1,
        useSchoolYear,
      ),
    });
  },
);
