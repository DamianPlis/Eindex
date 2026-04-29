export const APP_LOCALES = ["en", "cs"] as const;

export type AppLocale = (typeof APP_LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = "cs";
export const LOCALE_COOKIE = "eindx_locale";

export function isAppLocale(value: string): value is AppLocale {
  return APP_LOCALES.includes(value as AppLocale);
}

export function normalizeAppLocale(value: unknown): AppLocale {
  if (typeof value !== "string") return DEFAULT_LOCALE;
  const normalized = value.toLowerCase();
  return isAppLocale(normalized) ? normalized : DEFAULT_LOCALE;
}
