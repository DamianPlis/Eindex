"use client";

import React from 'react'
import Link from "next/link";
//import { requireSession } from "@/lib/session";
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


function BottomNav({ routes }: AppBottomNavProps) {
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
            {route.label}
          </Link>
        ))}
        </div>
    </nav>
  )
}

export default BottomNav