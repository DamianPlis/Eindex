//import Link from "next/link";
import { requireSession } from "@/lib/session";
import LogoutButton from "@/components/auth/LogoutButton";
// import { useRouter } from "next/router";
import BottomNav from "@/components/layout/BottomNav";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();

  // const currentRoute = useRouter();
  const routes = [
    { to: "/", label: "Main" },
    { to: "/planning", label: "Planning" },
    { to: "/deadlines", label: "Deadlines" },
  ];

  return (
    <div className="app-shell">
      <header className="app-topbar">
        <strong>Eindx</strong>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 13 }}>{session.name || session.email || session.uid}</span>
          <LogoutButton uid={session.uid} />
        </div>
      </header>

      <main style={{ flex: 1 }}>{children}</main>

      <BottomNav routes={routes} />
    </div>
  );
}
