import { requireSession } from "@/lib/session";
import LogoutButton from "@/components/auth/LogoutButton";
import AppBottomNav from "@/components/layout/AppBottomNav";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();

  const routes = [
    { to: "/", label: "Main" },
    { to: "/planning", label: "Planning" },
    { to: "/deadlines", label: "Deadlines" },
  ];

  return (
    <div className="app-shell">
      <header className="app-topbar">
        <div className="app-topbar-inner">
          <strong className="app-brand">Eindx</strong>
          <div className="app-user-row">
            <span className="app-user-pill">{session.name || session.email || session.uid}</span>
            <LogoutButton uid={session.uid} />
          </div>
        </div>
      </header>

      <main className="app-main">{children}</main>

      <AppBottomNav routes={routes} />
    </div>
  );
}
