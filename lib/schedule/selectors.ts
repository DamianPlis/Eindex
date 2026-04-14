import type { AppLocale } from "@/lib/i18n/config";
import { isoDate, parseRangeMinutes } from "@/lib/schedule/defaults";
import type { DeadlineItem, ScheduleState, Slot, SortOption, StatsOptions } from "@/lib/schedule/types";

const deadlineFormatters = new Map<string, Intl.RelativeTimeFormat>();

function getRelativeTimeFormatter(locale: AppLocale) {
  const cached = deadlineFormatters.get(locale);
  if (cached) return cached;

  const formatter = new Intl.RelativeTimeFormat(locale, {
    numeric: "auto",
  });
  deadlineFormatters.set(locale, formatter);
  return formatter;
}

function startOfDay(date: Date): Date {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

function parseISODate(dateISO: string): Date | null {
  const [year, month, day] = dateISO.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

export function formatDeadlineRelativeLabel(
  dateISO: string,
  locale: AppLocale,
  today: Date = new Date(),
): string {
  const deadlineDate = parseISODate(dateISO);
  if (!deadlineDate) return "";

  const diffMs = startOfDay(deadlineDate).getTime() - startOfDay(today).getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  const absDays = Math.abs(diffDays);
  const formatter = getRelativeTimeFormatter(locale);

  if (absDays >= 365) {
    return formatter.format(Math.round(diffDays / 365), "year");
  }
  if (absDays >= 30) {
    return formatter.format(Math.round(diffDays / 30), "month");
  }
  if (absDays >= 7) {
    return formatter.format(Math.round(diffDays / 7), "week");
  }
  return formatter.format(diffDays, "day");
}

export function formatDeadlineDate(
  dateISO: string,
  locale: AppLocale,
  today: Date = new Date(),
): string {
  const relativeLabel = formatDeadlineRelativeLabel(dateISO, locale, today);
  return relativeLabel ? `${dateISO} (${relativeLabel})` : dateISO;
}

export function getCurrentWeekKey(offset = 0): string {
  const now = new Date();
  const shifted = new Date(now);
  shifted.setDate(now.getDate() + offset * 7);
  const weekday = (shifted.getDay() + 6) % 7;
  shifted.setDate(shifted.getDate() - weekday);
  shifted.setHours(0, 0, 0, 0);
  return isoDate(shifted);
}

export function getTodayISO(): string {
  return isoDate(new Date());
}

export function getWeekStats(state: ScheduleState, startISO: string, endISO: string) {
  const counts: Record<string, number> = {};
  Object.values(state.weeks || {}).forEach((week) => {
    week.days.forEach((day) => {
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

export function getCurrentWeekStats(statsOption:StatsOptions, state: ScheduleState) {
  const now = new Date();

  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const yearStart = new Date(now.getFullYear(), 0, 1);
  const yearEnd = new Date(now.getFullYear(), 11, 31);

  const weekStats = getWeekStats(state, isoDate(weekStart), isoDate(weekEnd));
  const monthStats = getWeekStats(state, isoDate(monthStart), isoDate(monthEnd));
  const yearStats = getWeekStats(state, isoDate(yearStart), isoDate(yearEnd));

  if (statsOption === "week") return weekStats;
  if (statsOption === "month") return monthStats;
  if (statsOption === "year") return yearStats;

  return weekStats;
}

export function sortStats(stats: Record<string, number>, subjectMap: Map<string, string>, locale: AppLocale, sortBy: SortOption) {
  
  const sortedStats = Object.entries(stats)
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

    return sortedStats;
}

export function pickTodaySchedule(state: ScheduleState, todayISO: string): Slot[] {
  for (const week of Object.values(state.weeks)) {
    const day = week.days.find((d) => d.date === todayISO);
    if (day) return day.slots;
  }
  return [];
}

export function splitDeadlines(deadlines: DeadlineItem[]) {
  const today = deadlines.filter((deadline) => deadline.status === "today");
  const expired = deadlines
    .filter((deadline) => deadline.status === "expired")
    .sort((a, b) => a.date.localeCompare(b.date));
  return [...today, ...expired];
}
