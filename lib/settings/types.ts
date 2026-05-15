import type { AppLocale } from "@/lib/i18n/config";

export type AppTheme = "light" | "dark";

export type AppSettings = {
  theme: AppTheme;
  locale: AppLocale;
  useSchoolYear: boolean;
};
