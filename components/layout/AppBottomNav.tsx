"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Route = {
  to: string;
  label: string;
};

type AppBottomNavProps = {
  routes: Route[];
};

function isRouteActive(pathname: string, route: string) {
  if (route === "/") return pathname === "/";
  return pathname === route || pathname.startsWith(`${route}/`);
}

export default function AppBottomNav({ routes }: AppBottomNavProps) {
  const pathname = usePathname() || "/";

  return (
    <nav className="nav-bar" aria-label="Primary">
      <div className="nav-track">
        {routes.map((route) => (
          <Link
            key={route.to}
            href={route.to}
            className={`nav-link ${isRouteActive(pathname, route.to) ? "is-active" : ""}`}
          >
            {route.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
