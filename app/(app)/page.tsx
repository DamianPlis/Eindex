import { redirect } from "next/navigation";
import { localizePath } from "@/lib/i18n/routing";
import { getPreferredLocale } from "@/lib/i18n/preference";
import { getSession } from "@/lib/session";

export default async function MainPage() {
  const session = await getSession();
  const locale = await getPreferredLocale(session);

  if (!session) {
    redirect(localizePath(locale, "/login"));
  }

  redirect(localizePath(locale, "/"));
}
