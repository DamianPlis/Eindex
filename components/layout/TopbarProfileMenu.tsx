"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import LogoutButton from "@/components/auth/LogoutButton";
import { useMessages } from "@/components/i18n/LocaleProvider";
import { localizePath, stripLocaleFromPath } from "@/lib/i18n/routing";
import type { AppLocale } from "@/lib/i18n/config";

type TopbarProfileMenuProps = {
  locale: AppLocale;
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
  locale,
  uid,
  userLabel,
  photoUrl,
}: TopbarProfileMenuProps) {
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
        console.log("Pointer down outside of profile menu, closing menu");
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

  useEffect(() => {
    console.log("Profile menu open state changed:", isOpen);
  }, [isOpen]);

  return (
    <div
      ref={rootRef}
      className={`topbar-profile-menu ${isOpen ? "open" : ""}`}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onClick={() => setIsOpen((current) => !current)}
    >
      <button
        ref={btnRef}
        type="button"
        className="topbar-profile-trigger"
        aria-expanded={isOpen}
        aria-label={userLabel}
      >
        {photoUrl ? (
          <Image
            className="topbar-profile-image"
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

      <div className="topbar-profile-dropdown">
        <div className="topbar-profile-label" title={userLabel}>
          {userLabel}
        </div>
        <Link
          className={`topbar-profile-item ${isSettingsActive ? "active" : ""}`}
          href={localizePath(locale, "/settings")}
          onClick={() => setIsOpen(false)}
        >
          {messages.settings.title}
        </Link>
        <LogoutButton uid={uid} className="topbar-profile-item topbar-profile-logout" />
      </div>
    </div>
  );
}
