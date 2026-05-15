import { DEFAULT_LOCALE, normalizeAppLocale } from "@/lib/i18n/config";
import type { AppSettings, AppTheme } from "@/lib/settings/types";

export const DEFAULT_SETTINGS: AppSettings = {
  theme: "light",
  locale: DEFAULT_LOCALE,
  useSchoolYear: false,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

export function normalizeTheme(value: unknown): AppTheme {
  return value === "dark" ? "dark" : "light";
}

export function normalizeSettings(raw: unknown): AppSettings {
  if (!isRecord(raw)) return { ...DEFAULT_SETTINGS };

  return {
    theme: normalizeTheme(raw.theme),
    locale: normalizeAppLocale(raw.locale),
    useSchoolYear: raw.useSchoolYear === true,
  };
}

export function mergeSettings(...candidates: unknown[]): AppSettings {
  const next = { ...DEFAULT_SETTINGS };

  for (const candidate of candidates) {
    if (!isRecord(candidate)) continue;
    if ("theme" in candidate) {
      next.theme = normalizeTheme(candidate.theme);
    }
    if ("locale" in candidate) {
      next.locale = normalizeAppLocale(candidate.locale);
    }
    if ("useSchoolYear" in candidate) {
      next.useSchoolYear = candidate.useSchoolYear === true;
    }
  }

  return next;
}
