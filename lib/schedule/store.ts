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

/** Load every saved week so history, statistics and planning sorting stay complete. */
export async function getUserState(_uid?: string): Promise<ScheduleState> {
  const token = await convexAuthNextjsToken();
  if (!token) throw new Error("Unauthorized");
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
    subjects: subjects.map((s) => ({
      id: s.slug,
      name: s.name,
      color: s.color,
      hiddenFromPlanning: s.hiddenFromPlanning ?? false,
    })),
    subjectGroups: groups.map((g) => ({
      id: g.slug,
      name: g.name,
      subjectIds: g.subjectIds,
      namePreferences: g.namePreferences,
    })),
    deadlines: deadlines.map((d) => ({
      id: d.deadlineId,
      text: d.text,
      description: d.description,
      date: d.date,
      status: d.status,
    })),
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
  const token = await convexAuthNextjsToken();
  if (!token) throw new Error("Unauthorized");
  return normalizeSettings(
    await fetchQuery(api.settings.getUserSettings, {}, { token }),
  );
}
