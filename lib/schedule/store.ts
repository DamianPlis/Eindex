import "server-only";
import { cache } from "react";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import type { PaginationResult } from "convex/server";
import { buildDaysForWeek } from "@/lib/schedule/defaults";
import type { ScheduleState } from "@/lib/schedule/types";
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
    status: d.status,
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
      const target = day?.slots[saved.slotIndex];
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

export const getSettingsPageData = cache(async (_uid: string) => {
  const token = await getRequestToken();
  const [settings, subjects, groups] = await Promise.all([
    fetchQuery(api.settings.getUserSettings, {}, { token }),
    fetchQuery(api.subjects.getSubjects, {}, { token }),
    fetchQuery(api.subjects.getSubjectGroups, {}, { token }),
  ]);
  return {
    settings: normalizeSettings(settings),
    subjects: subjects.map(toSubject),
    subjectGroups: groups.map(toSubjectGroup),
  };
});

export const getDeadline = cache(async (_uid: string, deadlineId: string) => {
  const token = await getRequestToken();
  const item = await fetchQuery(
    api.deadlines.getDeadline,
    { deadlineId },
    { token },
  );
  return item ? toDeadline(item) : null;
});

/** Load every saved week so history, statistics and planning sorting stay complete. */
export async function getUserState(_uid?: string): Promise<ScheduleState> {
  const token = await getRequestToken();
  const loadSlots = async () => {
    const slots: Doc<"scheduleSlots">[] = [];
    let cursor: string | null = null;
    for (;;) {
      const result: PaginationResult<Doc<"scheduleSlots">> = await fetchQuery(
        api.schedule.listSlots,
        {
          paginationOpts: { cursor, numItems: 500 },
        },
        { token },
      );
      slots.push(...result.page);
      if (result.isDone) return slots;
      cursor = result.continueCursor;
    }
  };
  const [slots, deadlines, subjects, groups] = await Promise.all([
    loadSlots(),
    fetchQuery(api.deadlines.getDeadlines, {}, { token }),
    fetchQuery(api.subjects.getSubjects, {}, { token }),
    fetchQuery(api.subjects.getSubjectGroups, {}, { token }),
  ]);
  const state: ScheduleState = {
    subjects: subjects.map(toSubject),
    subjectGroups: groups.map(toSubjectGroup),
    deadlines: deadlines.map(toDeadline),
    weeks: {},
    lunches: {},
  };
  for (const slot of slots) {
    const week = (state.weeks[slot.weekStart] ??= {
      weekStart: slot.weekStart,
      days: buildDaysForWeek(slot.weekStart),
    });
    const target = week.days[slot.dayIndex]?.slots[slot.slotIndex];
    if (target) {
      target.subjectId = slot.subjectId ?? null;
      target.topic = slot.topic;
      target.updatedAt = slot.updatedAt;
    }
  }
  return state;
}
export const getCachedUserState = cache(getUserState);
export async function getUserSettings(_uid?: string) {
  const token = await getRequestToken();
  return normalizeSettings(
    await fetchQuery(api.settings.getUserSettings, {}, { token }),
  );
}
