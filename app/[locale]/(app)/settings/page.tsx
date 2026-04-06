import SettingsPageClient from "@/components/pages/SettingsPageClient";
import { assertLocale } from "@/lib/i18n/server";
import { getUserSettings } from "@/lib/schedule/store";
import { requireSession } from "@/lib/session";

export default async function LocaleSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  assertLocale((await params).locale);
  const session = await requireSession();
  const settings = await getUserSettings(session.uid);

  return <SettingsPageClient initialSettings={settings} />;
}
