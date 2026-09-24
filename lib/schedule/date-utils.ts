/**
 * Pure date/time utility functions used across schedule modules.
 * Extracted from defaults.ts to break the circular dependency
 * between defaults.ts and stats.ts.
 */

/**
 * Returns a new Date object normalized to the Monday of the given date's week.
 * The time is reset to midnight (00:00:00.000).
 *
 * @param date - The reference date.
 * @returns The Date object for Monday of that week.
 */
export function getMonday(date: Date = new Date()): Date {
  const d = new Date(date);
  const weekday = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - weekday);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Returns the ISO 8601 string representation (YYYY-MM-DD) of a Date.
 *
 * @param date - The Date object.
 * @returns The ISO date string.
 */
export function isoDate(date: Date = new Date()): string {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Formats an ISO date as D.M.YYYY, or D.M. for dates in the current year.
 * Invalid or non-ISO input is omitted rather than shown in machine format.
 */
export function formatEuropeanDate(
  dateISO: string,
  currentYear: number = new Date().getFullYear(),
): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateISO);
  if (!match) return "";

  const date = new Date(`${dateISO}T00:00:00.000Z`);
  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== dateISO
  ) {
    return "";
  }

  const [, year, month, day] = match;
  const dayAndMonth = `${Number(day)}.${Number(month)}`;
  return Number(year) === currentYear
    ? `${dayAndMonth}.`
    : `${dayAndMonth}.${year}`;
}

/**
 * Normalizes a week input string. If invalid or missing, defaults to Monday of current week.
 *
 * @param input - The optional week start string.
 * @returns The normalized ISO date string for Monday of the resolved week.
 */
export function normalizeWeekKey(input?: string): string {
  if (!input) return isoDate(getMonday());
  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) return isoDate(getMonday());
  return isoDate(getMonday(parsed));
}

/**
 * Parse a "HH:MM-HH:MM" time range string and return the duration in minutes.
 * Returns null if the string is invalid.
 *
 * @param timeStr - The time range string.
 * @returns The duration in minutes, or null.
 */
export function parseRangeMinutes(timeStr: string): number | null {
  const parsed = parseRange(timeStr);
  if (!parsed) return null;
  const [sh, sm, eh, em] = parsed;
  return Math.max(0, eh * 60 + em - (sh * 60 + sm));
}

/**
 * Parse a "HH:MM-HH:MM" time range string and return
 * start/end as total minutes since midnight.
 * Returns null if the string is invalid.
 *
 * @param timeStr - The time range string.
 * @returns An object with start and end minutes, or null.
 */
export function parseTimeRange(
  timeStr: string,
): { start: number; end: number } | null {
  const parsed = parseRange(timeStr);
  if (!parsed) return null;
  const [sh, sm, eh, em] = parsed;
  return { start: sh * 60 + sm, end: eh * 60 + em };
}

/**
 * Internal helper to parse a "HH:MM-HH:MM" string into an array of numbers.
 *
 * @param timeStr - The time range string.
 * @returns An array [startHours, startMinutes, endHours, endMinutes] or null.
 */
function parseRange(timeStr: string): number[] | null {
  if (!timeStr || !timeStr.includes("-")) return null;
  const [startRaw, endRaw] = timeStr.split("-").map((v) => v.trim());
  const [sh, sm] = startRaw.split(":").map(Number);
  const [eh, em] = endRaw.split(":").map(Number);
  if ([sh, sm, eh, em].some(Number.isNaN)) return null;
  return [sh, sm, eh, em];
}
