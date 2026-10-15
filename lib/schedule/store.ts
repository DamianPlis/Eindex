import "server-only";
import { cache } from "react";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import {
  buildDaysForWeek,
  resolveDeadlineStatus,
} from "@/lib/schedule/defaults";
import type { ScheduleState, StatsOptions } from "@/lib/schedule/types";
import { normalizeSettings } from "@/lib/settings/defaults";
import { selectDashboardDeadlines } from "@/lib/schedule/selectors";

const getRequestToken = cache(async () => {
  const token = await convexAuthNextjsToken();
  if (!token) throw new Error("Unauthorized");
  return token;
});

function toSubject(s: Doc<"subjects">) {
  return {
    id: s.slug,
    name: s.name,
    color: s.color,
    hiddenFromPlanning: s.hiddenFromPlanning ?? false,
  };
}
function toSubjectGroup(g: Doc<"subjectGroups">) {
  return {
    id: g.slug,
    name: g.name,
    subjectIds: g.subjectIds,
    namePreferences: g.namePreferences,
  };
}
function toDeadline(d: Doc<"deadlines">) {
  return {
    id: d.deadlineId,
    text: d.text,
    description: d.description,
    date: d.date,
    status: resolveDeadlineStatus(d),
  };
}

// React cache shares these results only within one server render/request.
// Primitive user/date/id keys are shared by sibling components and metadata.
// Authorization always comes from the request token, never the supplied UID.
export const getDashboardData = cache(
  async (_uid: string, selectedISO: string) => {
    const token = await getRequestToken();
    const data = await fetchQuery(
      api.dashboard.getDashboardData,
      { selectedISO },
      { token },
    );
    const days =
      data.hasSavedWeek && data.weekStart
        ? buildDaysForWeek(data.weekStart)
        : [];
    const dayIndex = days.findIndex((day) => day.date === selectedISO);
    const day = days[dayIndex];
    for (const saved of data.slots) {
      const target = day?.slots.find(
        (slot) =>
          slot.id === `${saved.weekStart}:${saved.dayIndex}:${saved.slotIndex}`,
      );
      if (
        target &&
        saved.weekStart === data.weekStart &&
        saved.dayIndex === dayIndex
      ) {
        target.subjectId = saved.subjectId ?? null;
        target.topic = saved.topic;
        target.updatedAt = saved.updatedAt;
      }
    }
    return {
      slots: day?.slots ?? [],
      subjects: data.subjects.map(toSubject),
      deadlineSelection: selectDashboardDeadlines(
        data.deadlines.map(toDeadline),
        selectedISO,
      ),
    };
  },
);

export const getSubjectCatalog = cache(async () => {
  const token = await getRequestToken();
  const [subjects, groups] = await Promise.all([
    fetchQuery(api.subjects.getSubjects, {}, { token }),
    fetchQuery(api.subjects.getSubjectGroups, {}, { token }),
  ]);
  return {
    subjects: subjects.map(toSubject),
    subjectGroups: groups.map(toSubjectGroup),
  };
});

export const getSettingsPageData = cache(async () => {
  const [settings, catalog] = await Promise.all([
    getUserSettings(),
    getSubjectCatalog(),
  ]);
  return { settings, ...catalog };
});

export const getDeadlines = cache(async () => {
  const token = await getRequestToken();
  return (await fetchQuery(api.deadlines.getDeadlines, {}, { token })).map(
    toDeadline,
  );
});

export const getPeriodUsage = cache(
  async (
    _uid: string,
    period: StatsOptions,
    startISO: string,
    endISO: string,
  ) => {
    const token = await getRequestToken();
    return fetchQuery(
      api.subjectUsage.getPeriodUsage,
      { period, startISO, endISO },
      { token },
    );
  },
);

export const getDeadline = cache(async (_uid: string, deadlineId: string) => {
  const token = await getRequestToken();
  const item = await fetchQuery(
    api.deadlines.getDeadline,
    { deadlineId },
    { token },
  );
  return item ? toDeadline(item) : null;
});

// Planning keeps its slot reads bounded; yearly ranking uses getPeriodUsage.
export const getPlanningPageState = cache(
  async (_uid: string, weekStart: string): Promise<ScheduleState> => {
    const token = await getRequestToken();
    const data = await fetchQuery(
      api.schedule.getPlanningData,
      { weekStart },
      { token },
    );
    const weeks = Object.fromEntries(
      data.weekStarts.map((start) => [
        start,
        {
          weekStart: start,
          days: buildDaysForWeek(start),
        },
      ]),
    );
    const state: ScheduleState = {
      subjects: data.subjects.map(toSubject),
      subjectGroups: [],
      deadlines: [],
      weeks,
      lunches: {},
    };
    for (const slot of data.slots) {
      const target = state.weeks[slot.weekStart]?.days[
        slot.dayIndex
      ]?.slots.find(
        (candidate) =>
          candidate.id ===
          `${slot.weekStart}:${slot.dayIndex}:${slot.slotIndex}`,
      );
      if (target) {
        target.subjectId = slot.subjectId ?? null;
        target.topic = slot.topic;
        target.updatedAt = slot.updatedAt;
      }
    }
    return state;
  },
);

export const getUserSettings = cache(async () => {
  const token = await getRequestToken();
  return normalizeSettings(
    await fetchQuery(api.settings.getUserSettings, {}, { token }),
  );
});
