import type { Metadata } from "next";
import { SettingsRefreshProvider } from "@/components/settings/SettingsRefreshContext";
import SettingsProvider from "@/components/settings/SettingsProvider";
import SettingsNav from "@/components/settings/SettingsNav";
import SettingsPageSkeleton from "@/components/skeletons/settings/SettingsPageSkeleton";
import { assertLocale } from "@/lib/i18n/server";
import { getUserSettings, getUserState } from "@/lib/schedule/store";
import { requireSession } from "@/lib/session";
import { Suspense } from "react";
import s from "@/components/settings/settings.module.css";
import { generatePageMetadata } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  assertLocale(locale);
  return generatePageMetadata({ page: "settings", locale, path: "/settings" });
}

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
      initialSubjectGroups={state.subjectGroups}
    >
      <div className={s.layout}>
        <SettingsNav />
        <div className={s.main}>{children}</div>
      </div>
    </SettingsProvider>
  );
}
