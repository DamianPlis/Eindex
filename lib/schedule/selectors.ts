import { isoDate, parseRangeMinutes } from "@/lib/schedule/defaults";
import type { DeadlineItem, ScheduleState, Slot } from "@/lib/schedule/types";

const deadlineRelativeTimeFormatter = new Intl.RelativeTimeFormat("en", {
  numeric: "auto",
});

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

export function formatDeadlineRelativeLabel(dateISO: string, today: Date = new Date()): string {
  const deadlineDate = parseISODate(dateISO);
  if (!deadlineDate) return "";

  const diffMs = startOfDay(deadlineDate).getTime() - startOfDay(today).getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  const absDays = Math.abs(diffDays);

  if (absDays >= 365) {
    return deadlineRelativeTimeFormatter.format(Math.round(diffDays / 365), "year");
  }
  if (absDays >= 30) {
    return deadlineRelativeTimeFormatter.format(Math.round(diffDays / 30), "month");
  }
  if (absDays >= 7) {
    return deadlineRelativeTimeFormatter.format(Math.round(diffDays / 7), "week");
  }
  return deadlineRelativeTimeFormatter.format(diffDays, "day");
}

export function formatDeadlineDate(dateISO: string, today: Date = new Date()): string {
  const relativeLabel = formatDeadlineRelativeLabel(dateISO, today);
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
