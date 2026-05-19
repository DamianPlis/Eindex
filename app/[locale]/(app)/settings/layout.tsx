import { SettingsRefreshProvider } from "@/components/settings/SettingsRefreshContext";
import SettingsProvider from "@/components/settings/SettingsProvider";
import SettingsNav from "@/components/settings/SettingsNav";
import SettingsPageSkeleton from "@/components/skeletons/SettingsPageSkeleton";
import { assertLocale } from "@/lib/i18n/server";
import { getUserSettings, getUserState } from "@/lib/schedule/store";
import { requireSession } from "@/lib/session";
import { Suspense } from "react";
import s from "@/components/settings/settings.module.css";

export default async function SettingsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  assertLocale((await params).locale);

  return (
    <SettingsRefreshProvider>
      <Suspense fallback={<SettingsPageSkeleton />}>
        <SettingsLayoutContent>{children}</SettingsLayoutContent>
      </Suspense>
    </SettingsRefreshProvider>
  );
}

async function SettingsLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();
  const settings = await getUserSettings(session.uid);
  const state = await getUserState(session.uid);

  return (
    <SettingsProvider
      initialSettings={settings}
      initialSubjects={state.subjects}
    >
      <div className={s.layout}>
        <SettingsNav />
        <div className={s.main}>{children}</div>
      </div>
    </SettingsProvider>
  );
}
