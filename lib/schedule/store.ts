import "server-only";

import { unstable_noStore as noStore } from "next/cache";
import { cache } from "react";
import { buildDaysForWeek, migrateState, normalizeWeekKey } from "@/lib/schedule/defaults";
import { autoSortSubjectsByUsage } from "@/lib/schedule/stats";
import type { ScheduleState } from "@/lib/schedule/types";
import { DEFAULT_SETTINGS } from "@/lib/settings/defaults";
import type { AppSettings } from "@/lib/settings/types";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchQuery, fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

/**
 * Fetches the complete schedule state for the authenticated user from Convex.
 *
 * @param _uid - Legacy parameter kept for API compatibility.
 * @returns The resolved ScheduleState.
 */
export async function getUserState(_uid?: string): Promise<ScheduleState> {
  noStore();
  const token = await convexAuthNextjsToken();
  if (!token) {
    return migrateState(null);
  }

  const currentMonday = normalizeWeekKey();
  const [weekData, deadlines, subjects, subjectGroups] = await Promise.all([
    fetchQuery(api.schedule.getWeekSchedule, { weekStart: currentMonday }, { token }),
    fetchQuery(api.deadlines.getDeadlines, {}, { token }),
    fetchQuery(api.subjects.getSubjects, {}, { token }),
    fetchQuery(api.subjects.getSubjectGroups, {}, { token }),
  ]);

  const base = migrateState(null);

  if (subjects && subjects.length > 0) {
    base.subjects = subjects.map((s) => ({
      id: s.slug,
      name: s.name,
      color: s.color,
    }));
  }

  if (subjectGroups && subjectGroups.length > 0) {
    base.subjectGroups = subjectGroups.map((g) => ({
      id: g.slug,
      name: g.name,
      subjectIds: g.subjectIds,
      namePreferences: g.namePreferences,
    }));
  }

  if (deadlines && deadlines.length > 0) {
    base.deadlines = deadlines.map((d) => ({
      id: d.deadlineId,
      text: d.text,
      description: d.description,
      date: d.date,
      status: d.status,
    }));
  }

  if (weekData && weekData.slots) {
    const builtDays = buildDaysForWeek(currentMonday);
    for (const slot of weekData.slots) {
      if (builtDays[slot.dayIndex]?.slots?.[slot.slotIndex]) {
        const target = builtDays[slot.dayIndex].slots[slot.slotIndex];
        target.subjectId = slot.subjectId || null;
        target.topic = slot.topic || "";
        target.updatedAt = slot.updatedAt || 0;
      }
    }
    base.weeks[currentMonday] = {
      weekStart: currentMonday,
      days: builtDays,
    };
  }

  base.subjects = autoSortSubjectsByUsage(base.subjects, base);
  return base;
}

export const getCachedUserState = cache(async (uid?: string) => {
  return await getUserState(uid);
});

/**
 * Retrieves the settings object for the authenticated user from Convex.
 *
 * @param _uid - Legacy parameter kept for API compatibility.
 * @returns The user's AppSettings.
 */
export async function getUserSettings(_uid?: string): Promise<AppSettings> {
  noStore();
  const token = await convexAuthNextjsToken();
  if (!token) return { ...DEFAULT_SETTINGS };

  const settings = await fetchQuery(api.settings.getUserSettings, {}, { token });
  if (!settings) return { ...DEFAULT_SETTINGS };

  return {
    theme: settings.theme,
    locale: settings.locale,
    useSchoolYear: settings.useSchoolYear,
  };
}

/**
 * Updates the user's settings in Convex.
 *
 * @param _uid - Legacy parameter kept for API compatibility.
 * @param mutate - Callback function that edits the draft settings.
 * @param options - Additional options like writerId.
 * @returns The updated AppSettings.
 */
export async function updateUserSettings(
  _uid: string,
  mutate: (draft: AppSettings) => void | AppSettings,
  options?: { writerId?: string },
): Promise<AppSettings> {
  const current = await getUserSettings();
  const draft = structuredClone(current);
  const result = mutate(draft);
  const next = (result || draft) as AppSettings;

  const token = await convexAuthNextjsToken();
  if (token) {
    await fetchMutation(
      api.settings.updateSettings,
      {
        theme: next.theme,
        locale: next.locale,
        useSchoolYear: next.useSchoolYear,
        writerId: options?.writerId,
      },
      { token },
    );
  }

  return next;
}

/**
 * Ensures that a week schedule object exists for the given week date key.
 * If not present, initializes it with defaults.
 *
 * @param state - The schedule state to mutate.
 * @param weekInput - The optional target week date.
 * @returns The normalized week date key.
 */
export function ensureWeekExists(state: ScheduleState, weekInput?: string) {
  const weekStart = normalizeWeekKey(weekInput);
  if (!state.weeks[weekStart]) {
    state.weeks[weekStart] = {
      weekStart,
      days: buildDaysForWeek(weekStart),
    };
  }
  return weekStart;
}
