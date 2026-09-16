import type { AppLocale } from "@/lib/i18n/config";
import { isoDate } from "@/lib/schedule/date-utils";
import type {
  DeadlineItem,
  DaySchedule,
  ScheduleState,
  Slot,
} from "@/lib/schedule/types";

const deadlineFormatters = new Map<string, Intl.RelativeTimeFormat>();

/**
 * Retrieves or initializes an Intl.RelativeTimeFormat instance for the given locale.
 * Caches formatters in a local Map.
 *
 * @param locale - The current app locale.
 * @returns The cached or new relative time formatter.
 */
function getRelativeTimeFormatter(locale: AppLocale) {
  const cached = deadlineFormatters.get(locale);
  if (cached) return cached;

  const formatter = new Intl.RelativeTimeFormat(locale, {
    numeric: "auto",
  });
  deadlineFormatters.set(locale, formatter);
  return formatter;
}

/**
 * Returns a new Date object representing the start of the day (00:00:00) for the given date.
 *
 * @param date - The source Date object.
 * @returns The normalized Date object.
 */
function startOfDay(date: Date): Date {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

/**
 * Parses an ISO date string (YYYY-MM-DD) into a local Date object.
 *
 * @param dateISO - The ISO date string.
 * @returns The parsed Date object or null if invalid.
 */
function parseISODate(dateISO: string): Date | null {
  const [year, month, day] = dateISO.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

/**
 * Formats an ISO date as a relative deadline string (e.g. "in 3 days", "yesterday").
 *
 * @param dateISO - The target ISO date string.
 * @param locale - The locale to format the output.
 * @param today - The reference today date (defaults to current system time).
 * @returns The formatted relative time string, or empty string if invalid.
 */
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

/**
 * Returns today's date in YYYY-MM-DD format.
 *
 * @returns Today's ISO date string.
 */
export function getTodayISO(): string {
  return isoDate(new Date());
}

/**
 * Returns tomorrow's date in YYYY-MM-DD format.
 *
 * @returns Tomorrow's ISO date string.
 */
export function getTomorrowISO(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return isoDate(tomorrow);
}

/**
 * Extracts and returns the slots for today's schedule from the overall schedule state.
 *
 * @param state - The current schedule state.
 * @param todayISO - Today's date as an ISO string.
 * @returns An array of slots for today, or an empty array if not found.
 */
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

/**
 * Splits and filters deadlines, organizing today's and expired deadlines.
 * If referenceDate is provided, returns active unfinished deadlines on or before the date.
 *
 * @param deadlines - The list of deadline items.
 * @param referenceDate - Optional reference ISO date.
 * @returns A sorted array of relevant deadlines.
 */
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
    return [...expired, ...today];
  }
  const today = deadlines.filter((deadline) => deadline.status === "today");
  const expired = deadlines
    .filter((deadline) => deadline.status === "expired")
    .sort((a, b) => a.date.localeCompare(b.date));
  return [...today, ...expired];
}

export type DashboardDeadlineSelection = {
  items: DeadlineItem[];
  mode: "attention" | "upcoming" | "empty";
};

/**
 * Selects the most useful deadlines for the dashboard.
 * Due and overdue work is always shown first. When there is nothing requiring
 * attention, the nearest unfinished future deadlines keep the panel useful.
 */
export function selectDashboardDeadlines(
  deadlines: DeadlineItem[],
  referenceDate: string,
  deadlinesLimit = 3,
): DashboardDeadlineSelection {
  const attentionItems = splitDeadlines(deadlines, referenceDate);
  const isAttentionMode = attentionItems.length > 0;

  const upcomingItemsAmount = deadlinesLimit - attentionItems.length;

  if (isAttentionMode && attentionItems.length >= deadlinesLimit) {
    return { items: attentionItems, mode: "attention" };
  }

  const upcomingItems = deadlines
    .filter(
      (deadline) => deadline.status !== "done" && deadline.date > referenceDate,
    )
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, upcomingItemsAmount);

  return {
    items: [...attentionItems, ...upcomingItems],
    mode: isAttentionMode
      ? "attention"
      : upcomingItems.length > 0
        ? "upcoming"
        : "empty",
  };
}
