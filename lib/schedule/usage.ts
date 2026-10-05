import { buildDaysForWeek } from "./defaults";
import { getMonday, isoDate, parseRangeMinutes } from "./date-utils";
import type { StatsOptions } from "./types";

/** Shared period boundaries for planning, statistics, and stored totals. */
export function getDateRange(
  period: StatsOptions,
  now: Date = new Date(),
  offset = 0,
  useSchoolYear = false,
) {
  if (period === "year") {
    if (useSchoolYear) {
      const startYear =
        now.getFullYear() - (now.getMonth() < 8 ? 1 : 0) + offset;
      return {
        startISO: `${startYear}-09-01`,
        endISO: `${startYear + 1}-06-30`,
      };
    }
    const year = now.getFullYear() + offset;
    return { startISO: `${year}-01-01`, endISO: `${year}-12-31` };
  }
  if (period === "month") {
    const date = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    return {
      startISO: isoDate(date),
      endISO: isoDate(new Date(date.getFullYear(), date.getMonth() + 1, 0)),
    };
  }
  const start = getMonday(now);
  start.setDate(start.getDate() + offset * 7);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return { startISO: isoDate(start), endISO: isoDate(end) };
}

export function getUsageWeight(time: string) {
  const minutes = parseRangeMinutes(time);
  return minutes ? Math.max(1, Math.round(minutes / 60)) : 1;
}

export type SlotUsageContribution = {
  subjectId: string;
  date: string;
  weightedCount: number;
};

/** Match the existing loaders: saved assignments use their canonical template. */
export function getSlotContribution(slot: {
  weekStart: string;
  dayIndex: number;
  slotIndex: number;
  subjectId?: string | null;
}): SlotUsageContribution | null {
  if (!slot.subjectId || slot.subjectId === "lunch") return null;
  const day = buildDaysForWeek(slot.weekStart)[slot.dayIndex];
  const template = day?.slots[slot.slotIndex];
  if (!template) return null;
  return {
    subjectId: slot.subjectId,
    date: day.date,
    weightedCount: getUsageWeight(template.time),
  };
}
