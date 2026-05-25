import { redirect } from "next/navigation";
import { getPreferredLocale } from "@/lib/i18n/preference";
import { localizePath } from "@/lib/i18n/routing";
import { getSession } from "@/lib/session";

export default async function SettingsLanguagePage() {
  const session = await getSession();
  const locale = await getPreferredLocale(session);

  if (!session) {
    redirect(localizePath(locale, "/login"));
  }

  redirect(localizePath(locale, "/settings/language"));
}
