import SettingsPageClient from "@/components/pages/SettingsPageClient";
import { getUserSettings } from "@/lib/schedule/store";
import { requireSession } from "@/lib/session";

export default async function SettingsPage() {
  const session = await requireSession();
  const settings = await getUserSettings(session.uid);

  return <SettingsPageClient initialSettings={settings} />;
}
