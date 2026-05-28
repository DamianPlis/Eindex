import { requireSession } from "@/lib/session";
import LogoutButton from "@/components/auth/LogoutButton";
import BottomNav from "@/components/layout/BottomNav";
import OnlineStatusBanner from "@/components/layout/OnlineStatusBanner";
import SettingsLink from "@/components/layout/SettingsLink";
import TopbarProfileMenu from "@/components/layout/TopbarProfileMenu";
import { getUserSettings } from "@/lib/schedule/store";
import ThemeRootSync from "@/components/settings/ThemeRootSync";
import { assertLocale } from "@/lib/i18n/server";
import s from "@/components/layout/AppShell.module.css";
import t from "@/components/layout/Topbar.module.css";

export default async function ProtectedLocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  assertLocale((await params).locale);
  const session = await requireSession();
  const settings = await getUserSettings(session.uid);
  const userLabel = session.name || session.email || session.uid;

  return (
    <div className={s.appShell} data-theme={settings.theme}>
      <ThemeRootSync theme={settings.theme} />
      <header className={t.appTopbar}>
        <strong>Eindex</strong>
        <div className={t.topbarActions}>
          <OnlineStatusBanner />
          <div className={t.topbarAccountDesktop}>
            <SettingsLink />
            <span className={t.topbarUserLabel} title={userLabel}>
              {userLabel}
            </span>
            <LogoutButton uid={session.uid} />
          </div>
          <TopbarProfileMenu
            uid={session.uid}
            userLabel={userLabel}
            photoUrl={session.photoUrl}
          />
        </div>
      </header>

      <main className={s.mainFlex}>{children}</main>

      <BottomNav />
    </div>
  );
}
