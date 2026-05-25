/**
 * Pure date/time utility functions used across schedule modules.
 * Extracted from defaults.ts to break the circular dependency
 * between defaults.ts and stats.ts.
 */

export function getMonday(date: Date = new Date()): Date {
  const d = new Date(date);
  const weekday = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - weekday);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function isoDate(date: Date = new Date()): string {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function normalizeWeekKey(input?: string): string {
  if (!input) return isoDate(getMonday());
  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) return isoDate(getMonday());
  return isoDate(getMonday(parsed));
}

/**
 * Parse a "HH:MM-HH:MM" time range string and return the duration in minutes.
 * Returns null if the string is invalid.
 */
export function parseRangeMinutes(timeStr: string): number | null {
  if (!timeStr || !timeStr.includes("-")) return null;
  const [startRaw, endRaw] = timeStr.split("-").map((t) => t.trim());
  const [sh, sm] = startRaw.split(":").map(Number);
  const [eh, em] = endRaw.split(":").map(Number);
  if ([sh, sm, eh, em].some(Number.isNaN)) return null;
  return Math.max(0, eh * 60 + em - (sh * 60 + sm));
}

/**
 * Parse a "HH:MM-HH:MM" time range string and return
 * start/end as total minutes since midnight.
 * Returns null if the string is invalid.
 */
export function parseTimeRange(
  timeStr: string,
): { start: number; end: number } | null {
  if (!timeStr || !timeStr.includes("-")) return null;
  const [startRaw, endRaw] = timeStr.split("-").map((v) => v.trim());
  const [sh, sm] = startRaw.split(":").map(Number);
  const [eh, em] = endRaw.split(":").map(Number);
  if ([sh, sm, eh, em].some(Number.isNaN)) return null;
  return { start: sh * 60 + sm, end: eh * 60 + em };
}
