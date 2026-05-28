import type { AppLocale } from "@/lib/i18n/config";
import type {
  DaySchedule,
  ScheduleState,
  SortOption,
  FilterOption,
  StatsOptions,
  Subject,
} from "@/lib/schedule/types";
import { isoDate, parseRangeMinutes } from "@/lib/schedule/date-utils";

/**
 * Resolves the start and end ISO dates for the chosen period configuration.
 * Handles weeks, months, and standard/school years.
 * 
 * @param option - The period option ("week", "month", or "year").
 * @param now - Reference date.
 * @param offset - Offset index (positive for future periods, negative for past).
 * @param useSchoolYear - If true and option is "year", uses school year boundary (Sep 1 - Jun 30).
 * @returns An object containing startISO and endISO.
 */
function getDateRange(
  option: StatsOptions,
  now: Date = new Date(),
  offset: number = 0,
  useSchoolYear: boolean = false,
) {
  if (option === "year") {
    if (useSchoolYear) {
      // School year: Sep 1 – Jun 30
      // If current month is Aug or earlier (0-7), we're in the school year that started last Sep
      // If current month is Sep or later (8-11), we're in the school year that started this Sep
      const baseDate = new Date(now);
      baseDate.setMonth(baseDate.getMonth() + offset * 12);
      const startYear = baseDate.getMonth() >= 8 ? baseDate.getFullYear() : baseDate.getFullYear() - 1;
      const adjustedStartYear = startYear;
      return {
        startISO: isoDate(new Date(adjustedStartYear, 8, 1)),
        endISO: isoDate(new Date(adjustedStartYear + 1, 5, 30)),
      };
    }
    const year = now.getFullYear() + offset;
    return {
      startISO: isoDate(new Date(year, 0, 1)),
      endISO: isoDate(new Date(year, 11, 31)),
    };
  }

  if (option === "month") {
    const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    return {
      startISO: isoDate(d),
      endISO: isoDate(new Date(d.getFullYear(), d.getMonth() + 1, 0)),
    };
  }

  // week
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1 + offset * 7);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  return {
    startISO: isoDate(weekStart),
    endISO: isoDate(weekEnd),
  };
}

/**
 * Returns a human-readable label for the period described by offset and option.
 * 
 * @param option - The period type.
 * @param locale - Locale code for formatting.
 * @param offset - Offset index.
 * @param now - Reference date.
 * @param useSchoolYear - If true, formats school year labels.
 * @returns The formatted period label.
 */
export function getPeriodLabel(
  option: StatsOptions,
  locale: string,
  offset: number,
  now: Date = new Date(),
  useSchoolYear: boolean = false,
): string {
  const range = getDateRange(option, now, offset, useSchoolYear);

  if (option === "week") {
    // Show "DD.MM – DD.MM"
    const s = range.startISO.split("-");
    const e = range.endISO.split("-");
    return `${parseInt(s[2])}.${parseInt(s[1])}. – ${parseInt(e[2])}.${parseInt(e[1])}.`;
  }

  if (option === "month") {
    const d = new Date(range.startISO);
    return d.toLocaleString(locale, { month: "long", year: "numeric" });
  }

  // year
  if (useSchoolYear) {
    const startYear = parseInt(range.startISO.split("-")[0]);
    return `${startYear}/${startYear + 1}`;
  }
  return range.startISO.split("-")[0];
}

/**
 * Compiles stats (subject occurrence counts/weights) for a given date range.
 * 
 * @param state - The schedule state.
 * @param startISO - Range start ISO string.
 * @param endISO - Range end ISO string.
 * @returns A dictionary of subject ID to weighted counts.
 */
function getWeekStats(
  state: ScheduleState,
  startISO: string,
  endISO: string,
) {
  const counts: Record<string, number> = {};

  Object.values(state.weeks || {}).forEach((week) => {
    week.days.forEach((day: DaySchedule) => {
      if (day.date < startISO || day.date > endISO) return;

      day.slots.forEach((slot) => {
        if (!slot.subjectId || slot.subjectId === "lunch") return;
        const mins = parseRangeMinutes(slot.time);
        const weight = mins ? Math.max(1, Math.round(mins / 60)) : 1;
        counts[slot.subjectId] = (counts[slot.subjectId] || 0) + weight;
      });
    });
  });

  return counts;
}

/**
 * Compiles subject duration/usage statistics for the current selected period.
 * 
 * @param option - The period type.
 * @param state - The schedule state.
 * @param now - Reference date.
 * @param offset - Offset index.
 * @param useSchoolYear - If true, respects school year boundary.
 * @returns A mapping of subject ID to weighted count.
 */
export function getCurrentPeriodStats(
  option: StatsOptions,
  state: ScheduleState,
  now: Date = new Date(),
  offset: number = 0,
  useSchoolYear: boolean = false,
) {
  const { startISO, endISO } = getDateRange(option, now, offset, useSchoolYear);
  return getWeekStats(state, startISO, endISO);
}

/**
 * Sorts subject statistics entries based on counts or names.
 * 
 * @param stats - The compiled stats record.
 * @param subjectMap - Subject ID to display name mapping.
 * @param locale - Locale for alphabetical sorting.
 * @param sortBy - Sort criteria option.
 * @returns Sorted array of stats objects.
 */
export function sortStats(
  stats: Record<string, number>,
  subjectMap: Map<string, string>,
  locale: AppLocale,
  sortBy: SortOption,
) {
  return Object.entries(stats)
    .map(([subjectId, count]) => ({ subjectId, count }))
    .sort((a, b) => {
      if (sortBy === "count-desc") return b.count - a.count;
      if (sortBy === "count-asc") return a.count - b.count;

      const nameA = subjectMap.get(a.subjectId) || a.subjectId;
      const nameB = subjectMap.get(b.subjectId) || b.subjectId;

      if (sortBy === "name-asc") return nameA.localeCompare(nameB, locale);
      if (sortBy === "name-desc") return nameB.localeCompare(nameA, locale);

      return 0;
    });
}

/**
 * Automatically sorts subjects list putting most used subjects first.
 * Unused subjects are appended to the end sorted alphabetically.
 * 
 * @param subjects - Array of subject definitions.
 * @param state - Current schedule state.
 * @param locale - Formatting/sorting locale.
 * @param option - Period range configuration for stats (defaults to "year").
 * @returns Sorted array of Subject objects.
 */
export function autoSortSubjectsByUsage(
  subjects: Subject[],
  state: ScheduleState,
  locale: AppLocale = "cs",
  option: StatsOptions = "year",
) {
  const stats = getCurrentPeriodStats(option, state);
  const subjectNameMap = new Map(
    subjects.map((subject) => [subject.id, subject.name]),
  );
  const sortedIds = sortStats(stats, subjectNameMap, locale, "count-desc").map(
    (entry) => entry.subjectId,
  );
  const positionById = new Map(
    subjects.map((subject, index) => [subject.id, index]),
  );
  const subjectById = new Map(subjects.map((subject) => [subject.id, subject]));

  const usedSubjects = sortedIds
    .map((subjectId) => subjectById.get(subjectId))
    .filter((subject): subject is Subject => Boolean(subject));

  const unusedSubjects = subjects
    .filter((subject) => !stats[subject.id])
    .sort((a, b) => {
      const nameOrder = a.name.localeCompare(b.name, locale);
      if (nameOrder !== 0) return nameOrder;
      return (positionById.get(a.id) ?? 0) - (positionById.get(b.id) ?? 0);
    });

  return [...usedSubjects, ...unusedSubjects];
}

/**
 * Filters stats array, keeping only items matching listed filter IDs.
 * 
 * @param stats - Array of stats objects.
 * @param filterIds - Filter configuration option (array of target IDs).
 * @returns Filtered stats array.
 */
export function filterStats(
  stats: { subjectId: string; count: number }[],
  filterIds: FilterOption,
) {
  if (!filterIds || filterIds.length === 0) return stats;
  return stats.filter((s) => filterIds.includes(s.subjectId));
}
