"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppLocale } from "@/components/i18n/LocaleProvider";
import SettingsIcon from "@/icons/settings_24dp_000000_FILL0_wght400_GRAD0_opsz24.svg";
import { localizePath, stripLocaleFromPath } from "@/lib/i18n/routing";
import styles from "@/css/Topbar.module.css";

export default function SettingsLink() {
  const locale = useAppLocale();
  const pathname = stripLocaleFromPath(usePathname() || "/");
  const isActive =
    pathname === "/settings" || pathname.startsWith("/settings/");

  return (
    <Link
      className={`${styles.settingsLink} ${isActive ? styles.active : ""}`}
      href={localizePath(locale, "/settings")}
      aria-current={isActive ? "page" : undefined}
    >
      <SettingsIcon fill="currentColor" width={24} height={24} />
    </Link>
  );
}
