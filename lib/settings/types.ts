import type { AppLocale } from "@/lib/i18n/config";
import type { SortOption } from "@/lib/schedule/types";

export type AppTheme = "light" | "dark";

export type AppSettings = {
  theme: AppTheme;
  locale: AppLocale;
  useSchoolYear: boolean;
  planningSubjectSort: SortOption;
};
