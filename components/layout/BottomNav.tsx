"use client";

import Link from "next/link";
//import { requireSession } from "@/lib/session";
import { usePathname } from "next/navigation";
import Calendar from "@/icons/calendar_month_24dp_000000_FILL0_wght400_GRAD0_opsz24.svg";
import Home from "@/icons/home_24dp_000000_FILL0_wght400_GRAD0_opsz24.svg";
import Checklist from "@/icons/checklist_24dp_000000_FILL0_wght400_GRAD0_opsz24.svg";


function isRouteActive(pathname: string, route: string) {
  if (route === "/") return pathname === "/";
  return pathname === route || pathname.startsWith(`${route}/`);
}

const routes = [
    { to: "/", label: "Home", icon: <Home fill="currentColor" alt="Home" /> },
    { to: "/planning", label: "Planning", icon: <Calendar fill="currentColor" alt="Planning" /> },
    { to: "/deadlines", label: "Deadlines", icon: <Checklist fill="currentColor" alt="Deadlines" /> },
  ];


function BottomNav() {
  const pathname = usePathname() || "/";


  return (
    <nav className="nav-bar">
      <div className="nav-track">
        {routes.map((route) => (
          <Link
            key={route.to}
            href={route.to}
            className={`nav-link 
              ${isRouteActive(pathname, route.to) ? "active" : ""}
              `}
          >
            {route.icon ? <span className="nav-icon">{route.icon}</span> : null}
            {route.label}
          </Link>
        ))}
        </div>
    </nav>
  )
}

export default BottomNav