import type { AppLocale } from "@/lib/i18n/config";
import { isoDate } from "@/lib/schedule/defaults";
import type {
  DeadlineItem,
  DaySchedule,
  ScheduleState,
  Slot,
  StatsOptions,
} from "@/lib/schedule/types";
import {
  getCurrentPeriodStats,
  getWeekStats,
  sortStats,
  filterStats,
} from "@/lib/schedule/stats";

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

  const diffMs =
    startOfDay(deadlineDate).getTime() - startOfDay(today).getTime();
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

export function getTomorrowISO(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return isoDate(tomorrow);
}

export { getWeekStats, sortStats, filterStats };

export function getCurrentWeekStats(
  statsOption: StatsOptions,
  state: ScheduleState,
) {
  return getCurrentPeriodStats(statsOption, state);
}

export function pickTodaySchedule(
  state: ScheduleState,
  todayISO: string,
): Slot[] {
  for (const week of Object.values(state.weeks)) {
    const day = week.days.find((d: DaySchedule) => d.date === todayISO);
    if (day) return day.slots;
  }
  return [];
}

export function splitDeadlines(
  deadlines: DeadlineItem[],
  referenceDate?: string,
) {
  if (referenceDate) {
    const today = deadlines.filter(
      (deadline) =>
        deadline.date === referenceDate && deadline.status !== "done",
    );
    const expired = deadlines
      .filter(
        (deadline) =>
          deadline.date < referenceDate && deadline.status !== "done",
      )
      .sort((a, b) => a.date.localeCompare(b.date));
    return [...today, ...expired];
  }
  const today = deadlines.filter((deadline) => deadline.status === "today");
  const expired = deadlines
    .filter((deadline) => deadline.status === "expired")
    .sort((a, b) => a.date.localeCompare(b.date));
  return [...today, ...expired];
}
