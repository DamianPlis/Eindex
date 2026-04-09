"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import SettingsIcon from "@/icons/settings_24dp_000000_FILL0_wght400_GRAD0_opsz24.svg";
import { localizePath, stripLocaleFromPath } from "@/lib/i18n/routing";
import type { AppLocale } from "@/lib/i18n/config";

type SettingsLinkProps = {
  locale: AppLocale;
};

export default function SettingsLink({ locale }: SettingsLinkProps) {
  const pathname = stripLocaleFromPath(usePathname() || "/");
  const isActive = pathname === "/settings" || pathname.startsWith("/settings/");

  return (
    <Link
      className={`settings-link ${isActive ? "active" : ""}`}
      href={localizePath(locale, "/settings")}
      aria-current={isActive ? "page" : undefined}
    >
      <SettingsIcon fill="currentColor" width={24} height={24} />
    </Link>
  );
}
