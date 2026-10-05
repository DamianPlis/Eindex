import type { AppLocale } from "@/lib/i18n/config";
import type { AppMessages } from "@/lib/i18n/messages";
import { getSubjectDisplayName } from "@/lib/schedule/labels";
import type {
  SortOption,
  FilterOption,
  StatsOptions,
  Subject,
} from "@/lib/schedule/types";
import { getDateRange } from "./usage";

export { getDateRange } from "./usage";

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
 * @param locale - Formatting/sorting locale.
 * @param usage - Precomputed subject counts for the selected year.
 * @returns Sorted array of Subject objects.
 */

export function sortPlanningSubjects(
  subjects: Subject[],
  locale: AppLocale,
  sortBy: SortOption,
  messages: AppMessages,
  usage: Record<string, number>,
) {
  const counts = Object.fromEntries(
    subjects.map((subject) => [subject.id, usage[subject.id] ?? 0]),
  );
  const names = new Map(
    subjects.map((subject) => [
      subject.id,
      getSubjectDisplayName(subject, messages),
    ]),
  );
  const byId = new Map(subjects.map((subject) => [subject.id, subject]));
  return sortStats(counts, names, locale, sortBy).map((entry) =>
    byId.get(entry.subjectId)!,
  );
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
