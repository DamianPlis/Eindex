"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppLocale, useMessages } from "@/components/i18n/UserSyncProvider";
import Calendar from "@/icons/calendar_month_24dp_000000_FILL0_wght400_GRAD0_opsz24.svg";
import Home from "@/icons/home_24dp_000000_FILL0_wght400_GRAD0_opsz24.svg";
import Checklist from "@/icons/checklist_24dp_000000_FILL0_wght400_GRAD0_opsz24.svg";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { localizePath, stripLocaleFromPath } from "@/lib/i18n/routing";
import s from "./BottomNav.module.css";


function isRouteActive(pathname: string, route: string) {
  if (route === "/") return pathname === "/";
  return pathname === route || pathname.startsWith(`${route}/`);
}

function BottomNav() {
  const locale = useAppLocale();
  const messages = useMessages();
  const pathname = stripLocaleFromPath(usePathname() || "/");
  const isNarrowScreen = useMediaQuery("(max-width: 390px)");
  const routes = [
    {
      to: localizePath(locale, "/"),
      route: "/",
      label: messages.nav.home,
      icon: <Home fill="currentColor" alt={messages.nav.home} />,
    },
    {
      to: localizePath(locale, "/planning"),
      route: "/planning",
      label: messages.nav.planning,
      icon: <Calendar fill="currentColor" alt={messages.nav.planning} />,
    },
    {
      to: localizePath(locale, "/deadlines"),
      route: "/deadlines",
      label: messages.nav.deadlines,
      icon: <Checklist fill="currentColor" alt={messages.nav.deadlines} />,
    },
  ];

  return (
    <nav className={s.navBar}>
      <div className={s.navTrack}>
        {routes.map((route) => (
          <Link
            key={route.route}
            href={route.to}
            className={isRouteActive(pathname, route.route) ? s.navLinkActive : s.navLink}
          >
            {route.icon ? <span className={s.navIcon}>{route.icon}</span> : null}
            { !isNarrowScreen && <span>{route.label}</span>}
          </Link>
        ))}
        </div>
    </nav>
  )
}

export default BottomNav
