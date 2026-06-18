"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import LogoutButton from "@/components/auth/LogoutButton";
import { useAppLocale, useMessages } from "@/components/i18n/UserSyncProvider";
import { localizePath, stripLocaleFromPath } from "@/lib/i18n/routing";
import s from "./Topbar.module.css";
import u from "@/components/ui/shared.module.css";

type TopbarProfileMenuProps = {
  uid: string;
  userLabel: string;
  photoUrl?: string;
};

function getInitials(label: string) {
  const parts = label.trim().split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }

  return label.slice(0, 2).toUpperCase();
}

export default function TopbarProfileMenu({
  uid,
  userLabel,
  photoUrl,
}: TopbarProfileMenuProps) {
  const locale = useAppLocale();
  const messages = useMessages();
  const pathname = stripLocaleFromPath(usePathname() || "/");
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const isSettingsActive = pathname === "/settings" || pathname.startsWith("/settings/");
  const initials = getInitials(userLabel);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className={isOpen ? s.topbarProfileMenuOpen : s.topbarProfileMenu}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onClick={() => setIsOpen((current) => !current)}
    >
      <button
        ref={btnRef}
        type="button"
        className={s.topbarProfileTrigger}
        aria-expanded={isOpen}
        aria-label={userLabel}
      >
        {photoUrl ? (
          <Image
            className={s.topbarProfileImage}
            src={photoUrl}
            alt={userLabel}
            referrerPolicy="no-referrer"
            width={40}
            height={40}
          />
        ) : (
          initials
        )}
      </button>

      <div className={s.topbarProfileDropdown}>
        <div className={s.topbarProfileLabel} title={userLabel}>
          {userLabel}
        </div>
        <Link
          className={isSettingsActive ? s.topbarProfileItemActive : s.topbarProfileItem}
          href={localizePath(locale, "/settings")}
          onClick={() => setIsOpen(false)}
        >
          {messages.settings.title}
        </Link>
        <LogoutButton uid={uid} className={`${s.topbarProfileItem} ${u.topbarProfileLogout}`} />
      </div>
    </div>
  );
}
