import { redirect } from "next/navigation";
import LoginPanel from "@/components/auth/LoginPanel";
import { localizePath } from "@/lib/i18n/routing";
import { assertLocale } from "@/lib/i18n/server";
import { getUserSettings } from "@/lib/schedule/store";
import { getSession } from "@/lib/session";

export default async function LocaleLoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  assertLocale((await params).locale);
  const session = await getSession();

  if (session) {
    const settings = await getUserSettings(session.uid);
    redirect(localizePath(settings.locale, "/"));
  }

  return <LoginPanel />;
}
