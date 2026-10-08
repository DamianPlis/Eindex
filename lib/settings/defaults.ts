import { DEFAULT_LOCALE, normalizeAppLocale } from "@/lib/i18n/config";
import type { AppSettings, AppTheme } from "@/lib/settings/types";

export const DEFAULT_SETTINGS: AppSettings = {
  theme: "light",
  locale: DEFAULT_LOCALE,
  useSchoolYear: false,
  planningSubjectSort: "name-asc",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

export function normalizeTheme(value: unknown): AppTheme {
  return value === "dark" ? "dark" : "light";
}

export function normalizePlanningSubjectSort(
  value: unknown,
): AppSettings["planningSubjectSort"] {
  // Keep the historical default for saved settings that predate this preference.
  return value === "count-asc" || value === "name-asc" || value === "name-desc"
    ? value
    : "count-desc";
}

export function normalizeSettings(raw: unknown): AppSettings {
  if (!isRecord(raw)) return { ...DEFAULT_SETTINGS };

  return {
    theme: normalizeTheme(raw.theme),
    locale: normalizeAppLocale(raw.locale),
    useSchoolYear: raw.useSchoolYear === true,
    planningSubjectSort: normalizePlanningSubjectSort(raw.planningSubjectSort),
  };
}
