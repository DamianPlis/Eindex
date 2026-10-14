import type { AppLocale } from "@/lib/i18n/config";
import { getUserSettings } from "@/lib/schedule/store";
import type { UserSession } from "@/lib/session";
import { getRequestLocale } from "@/lib/i18n/server";

export async function getPreferredLocale(
  session: UserSession | null,
): Promise<AppLocale> {
  const requestLocale = await getRequestLocale();
  if (!session) return requestLocale;

  try {
    const settings = await getUserSettings();
    return settings.locale;
  } catch {
    return requestLocale;
  }
}
