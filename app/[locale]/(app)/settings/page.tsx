import SettingsPageClient from "@/components/pages/SettingsPageClient";
import SettingsPageSkeleton from "@/components/skeletons/SettingsPageSkeleton";
import { assertLocale } from "@/lib/i18n/server";
import { getUserSettings, getUserState } from "@/lib/schedule/store";
import { requireSession } from "@/lib/session";
import { Suspense } from "react";

export default async function LocaleSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  assertLocale((await params).locale);

  return (
    <Suspense fallback={<SettingsPageSkeleton />}>
      <SettingsPageContent />
    </Suspense>
  );
}

async function SettingsPageContent() {
  const session = await requireSession();
  const settings = await getUserSettings(session.uid);
  const state = await getUserState(session.uid);

  return (
    <SettingsPageClient
      initialSettings={settings}
      initialSubjects={state.subjects}
    />
  );
}
