"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppLocale } from "@/components/i18n/UserSyncProvider";
import SettingsIcon from "@/icons/settings_24dp_000000_FILL0_wght400_GRAD0_opsz24.svg";
import { localizePath, stripLocaleFromPath } from "@/lib/i18n/routing";
import s from "./Topbar.module.css";

export default function SettingsLink() {
  const locale = useAppLocale();
  const pathname = stripLocaleFromPath(usePathname() || "/");
  const isActive = pathname === "/settings" || pathname.startsWith("/settings/");

  return (
    <Link
      className={isActive ? s.settingsLinkActive : s.settingsLink}
      href={localizePath(locale, "/settings")}
      aria-current={isActive ? "page" : undefined}
    >
      <SettingsIcon fill="currentColor" width={24} height={24} />
    </Link>
  );
}
