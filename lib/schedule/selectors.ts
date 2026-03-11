import { isoDate, parseRangeMinutes } from "@/lib/schedule/defaults";
import type { DeadlineItem, ScheduleState, Slot } from "@/lib/schedule/types";

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

export function splitDeadlines(deadlines: DeadlineItem[], todayISO: string) {
  const today = deadlines.filter((d) => d.date === todayISO);
  const expired = deadlines.filter((d) => d.date < todayISO).sort((a, b) => a.date.localeCompare(b.date));
  const expiredWithStatus = expired.map((d) => ({ ...d, status: "expired" as const }));
  const todayWithStatus = today.map((d) => ({ ...d, status: "today" as const }));
  const final = [...todayWithStatus, ...expiredWithStatus];
  return  final ;
}
