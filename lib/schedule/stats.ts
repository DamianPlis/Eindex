import type { AppLocale } from "@/lib/i18n/config";
import type {
  DaySchedule,
  ScheduleState,
  SortOption,
  FilterOption,
  StatsOptions,
  Subject,
} from "@/lib/schedule/types";
import { isoDate, parseRangeMinutes } from "@/lib/schedule/defaults";

function getDateRange(option: StatsOptions, now: Date = new Date()) {
  if (option === "year") {
    return {
      startISO: isoDate(new Date(now.getFullYear(), 0, 1)),
      endISO: isoDate(new Date(now.getFullYear(), 11, 31)),
    };
  }

  if (option === "month") {
    return {
      startISO: isoDate(new Date(now.getFullYear(), now.getMonth(), 1)),
      endISO: isoDate(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
    };
  }

  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  return {
    startISO: isoDate(weekStart),
    endISO: isoDate(weekEnd),
  };
}

export function getWeekStats(
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

export function getCurrentPeriodStats(
  option: StatsOptions,
  state: ScheduleState,
  now: Date = new Date(),
) {
  const { startISO, endISO } = getDateRange(option, now);
  return getWeekStats(state, startISO, endISO);
}

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

export function filterStats(
  stats: { subjectId: string; count: number }[],
  filterIds: FilterOption,
) {
  if (!filterIds || filterIds.length === 0) return stats;
  return stats.filter((s) => filterIds.includes(s.subjectId));
}
