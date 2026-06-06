import { redirect } from "next/navigation";
import { localizePath } from "@/lib/i18n/routing";
import { getPreferredLocale } from "@/lib/i18n/preference";
import { getSession } from "@/lib/session";

export default async function AboutPageRedirect() {
  const session = await getSession();
  const locale = await getPreferredLocale(session);

  redirect(localizePath(locale, "/about"));
}
