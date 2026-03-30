import type { AppSettings, AppTheme } from "@/lib/settings/types";

export const DEFAULT_SETTINGS: AppSettings = {
  theme: "light",
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
  };
}

export function mergeSettings(...candidates: unknown[]): AppSettings {
  const next = { ...DEFAULT_SETTINGS };

  for (const candidate of candidates) {
    if (!isRecord(candidate)) continue;
    if ("theme" in candidate) {
      next.theme = normalizeTheme(candidate.theme);
    }
  }

  return next;
}
