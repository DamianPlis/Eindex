import { redirect } from "next/navigation";
import { localizePath } from "@/lib/i18n/routing";
import { getPreferredLocale } from "@/lib/i18n/preference";
import { getUserSettings } from "@/lib/schedule/store";
import { getSession } from "@/lib/session";

export default async function LoginPage() {
  const session = await getSession();
  const locale = await getPreferredLocale(session);

  if (session) {
    const settings = await getUserSettings();
    redirect(localizePath(settings.locale, "/"));
  }

  redirect(localizePath(locale, "/login"));
}
