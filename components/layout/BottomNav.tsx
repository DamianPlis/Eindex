"use client";

import Link from "next/link";
//import { requireSession } from "@/lib/session";
import { usePathname } from "next/navigation";
import Calendar from "@/icons/calendar_month_24dp_000000_FILL0_wght400_GRAD0_opsz24.svg";
import Home from "@/icons/home_24dp_000000_FILL0_wght400_GRAD0_opsz24.svg";
import Checklist from "@/icons/checklist_24dp_000000_FILL0_wght400_GRAD0_opsz24.svg";
import { useMediaQuery } from "@/hooks/useMediaQuery";


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

    const isNarrowScreen = useMediaQuery("(max-width: 390px)");

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
            { !isNarrowScreen && <span className="nav-label">{route.label}</span>}
          </Link>
        ))}
        </div>
    </nav>
  )
}

export default BottomNav