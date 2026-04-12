import { requireSession } from "@/lib/session";
import LogoutButton from "@/components/auth/LogoutButton";
import BottomNav from "@/components/layout/BottomNav";
import OnlineStatusBanner from "@/components/layout/OnlineStatusBanner";
import SettingsLink from "@/components/layout/SettingsLink";
import TopbarProfileMenu from "@/components/layout/TopbarProfileMenu";
import { getUserSettings } from "@/lib/schedule/store";
import ThemeRootSync from "@/components/settings/ThemeRootSync";
import { assertLocale } from "@/lib/i18n/server";

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
    <div className="app-shell" data-theme={settings.theme}>
      <ThemeRootSync theme={settings.theme} />
      <header className="app-topbar">
        <strong>Eindx</strong>
        <div className="topbar-actions">
          <OnlineStatusBanner />
          <div className="topbar-account-desktop">
            <SettingsLink />
            <span className="topbar-user-label" title={userLabel}>
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


      <main style={{ flex: 1 }}>{children}</main>

      <BottomNav />
    </div>
  );
}
