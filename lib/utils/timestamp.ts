/**
 * Convert a Firestore Timestamp-like value to milliseconds.
 * Handles raw numbers, Firestore Timestamp objects (with toMillis()),
 * and falsy values.
 * 
 * @param value - The value to convert.
 * @returns The timestamp in milliseconds, or 0 if invalid.
 */
export function toMillis(value: unknown): number {
  if (!value) return 0;
  if (typeof value === "number") return value;
  if (
    typeof value === "object" &&
    value !== null &&
    "toMillis" in value &&
    typeof (value as { toMillis?: unknown }).toMillis === "function"
  ) {
    return (value as { toMillis: () => number }).toMillis() || 0;
  }
  return 0;
}
