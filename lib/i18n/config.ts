export const APP_LOCALES = ["en", "cs", "pl"] as const;

export type AppLocale = (typeof APP_LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = "cs";
export const LOCALE_COOKIE = "eindx_locale";

/**
 * Type guard function to verify if a string is a supported application locale.
 * 
 * @param value - The string to check.
 * @returns True if the string is a valid AppLocale, false otherwise.
 */
export function isAppLocale(value: string): value is AppLocale {
  return APP_LOCALES.includes(value as AppLocale);
}

/**
 * Normalizes an unknown value to a valid AppLocale, falling back to the default locale.
 * 
 * @param value - The input value to normalize.
 * @returns A verified AppLocale.
 */
export function normalizeAppLocale(value: unknown): AppLocale {
  if (typeof value !== "string") return DEFAULT_LOCALE;
  const normalized = value.toLowerCase();
  return isAppLocale(normalized) ? normalized : DEFAULT_LOCALE;
}
