import Link from "next/link";
import { requireSession } from "@/lib/session";
import LogoutButton from "@/components/auth/LogoutButton";
import BottomNav from "@/components/layout/BottomNav";
import { getUserSettings } from "@/lib/schedule/store";
import ThemeRootSync from "@/components/settings/ThemeRootSync";
import SettingsIcon from "@/icons/settings_24dp_000000_FILL0_wght400_GRAD0_opsz24.svg"



export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();
  const settings = await getUserSettings(session.uid);
  const userLabel = session.name || session.email || session.uid;

  return (
    <div className="app-shell" data-theme={settings.theme}>
      <ThemeRootSync theme={settings.theme} />
      <header className="app-topbar">
        <strong>Eindx</strong>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link className="" href="/settings" style={{display: "flex", alignItems: "center"}}>
            <SettingsIcon fill="currentColor" width={24} height={24} />
          </Link>
          <span style={{ fontSize: 13 }} title={userLabel}>{userLabel}</span>
          <LogoutButton uid={session.uid} />
        </div>
      </header>

      <main style={{ flex: 1 }}>{children}</main>

      <BottomNav />
    </div>
  );
}
