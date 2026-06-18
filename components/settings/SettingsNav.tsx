"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMessages, useAppLocale } from "@/components/i18n/UserSyncProvider";
import s from "./SettingsNav.module.css";
import AppreanceIcon from "@/icons/palette_24dp_000000_FILL0_wght400_GRAD0_opsz24.svg";
import LanguageIcon from "@/icons/language_24dp_000000_FILL0_wght400_GRAD0_opsz24.svg";
import StatsIcon from "@/icons/insert_chart_24dp_000000_FILL0_wght400_GRAD0_opsz24.svg";
import CloseIcon from "@/icons/close_24dp_000000_FILL0_wght400_GRAD0_opsz24.svg";
import SearchIcon from "@/icons/search_24dp_000000_FILL0_wght400_GRAD0_opsz24.svg";
import HamburgerIcon from "@/icons/menu_24dp_000000_FILL0_wght400_GRAD0_opsz24.svg";

type NavItem = {
  id: string;
  labelKey: string;
  href: string;
  icon: React.ReactNode;
};

/* ── SVG icons ── */
const IconAll = (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
    <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
  </svg>
);
const IconAppearance = (
  <>
    <AppreanceIcon width="20" height="20" fill="currentColor" />
  </>
);
const IconLanguage = (
  <>
    <LanguageIcon width="20" height="20" fill="currentColor" />
  </>
);
const IconSubjects = (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
    <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9h-4v4h-2v-4H9V9h4V5h2v4h4v2z" />
  </svg>
);
const IconStats = (
  <>
    <StatsIcon width="20" height="20" fill="currentColor" />
  </>
);
const IconSearch = (
  <>
    <SearchIcon width="20" height="20" fill="currentColor" />
  </>
);
const IconHamburger = (
  <>
    <HamburgerIcon width="20" height="20" fill="currentColor" />
  </>
);
const IconClose = (
  <>
    <CloseIcon width="20" height="20" fill="currentColor" />
  </>
);

export default function SettingsNav() {
  const messages = useMessages();
  const locale = useAppLocale();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const overlayRef = useRef<HTMLDivElement>(null);

  const base = `/${locale}/settings`;

  const navItems: NavItem[] = [
    {
      id: "all",
      labelKey: messages.settings.allSettings,
      href: base,
      icon: IconAll,
    },
    {
      id: "appearance",
      labelKey: messages.settings.appearance,
      href: `${base}/appearance`,
      icon: IconAppearance,
    },
    {
      id: "language",
      labelKey: messages.settings.currentLanguage,
      href: `${base}/language`,
      icon: IconLanguage,
    },
    {
      id: "subjects",
      labelKey: messages.settings.subjects,
      href: `${base}/subjects`,
      icon: IconSubjects,
    },
    {
      id: "statistics",
      labelKey: messages.settings.statisticsSection,
      href: `${base}/statistics`,
      icon: IconStats,
    },
  ];

  const filtered = search.trim()
    ? navItems.filter((item) =>
        item.labelKey.toLowerCase().includes(search.toLowerCase()),
      )
    : navItems;

  function isActive(href: string) {
    if (!pathname) return false;
    if (href === base) return pathname === base || pathname === `${base}/`;
    return pathname.startsWith(href);
  }

  // Close mobile nav on route change
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setMobileOpen(false);
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [pathname]);

  // Close on Escape
  useEffect(() => {
    if (!mobileOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileOpen(false);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [mobileOpen]);

  const navContent = (
    <>
      <div className={s.search}>
        <span className={s.searchIcon}>{IconSearch}</span>
        <input
          type="search"
          className={s.searchInput}
          placeholder={messages.settings.searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <nav className={s.links}>
        {filtered.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className={isActive(item.href) ? s.linkActive : s.link}
            onClick={() => setMobileOpen(false)}
          >
            <span className={s.linkIcon}>{item.icon}</span>
            <span className={s.linkLabel}>{item.labelKey}</span>
          </Link>
        ))}
        {filtered.length === 0 && <p className={s.empty}>—</p>}
      </nav>
    </>
  );

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className={s.sidebar}>{navContent}</aside>

      {/* ── Mobile hamburger trigger ── */}
      <div className={s.mobileBar}>
        <h2 className={s.mobileTitle}>{messages.settings.title}</h2>
        <button
          type="button"
          className={s.hamburger}
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle settings menu"
        >
          {mobileOpen ? IconClose : IconHamburger}
        </button>
      </div>

      {/* ── Mobile overlay ── */}
      {mobileOpen && (
        <div
          className={s.mobileOverlay}
          ref={overlayRef}
          onClick={(e) => {
            if (e.target === overlayRef.current) setMobileOpen(false);
          }}
        >
          <div className={s.mobilePanel}>{navContent}</div>
        </div>
      )}
    </>
  );
}
