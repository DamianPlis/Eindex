"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { getMessages, type AppMessages } from "@/lib/i18n/messages";
import { getLocaleFromPathname, localizePath } from "@/lib/i18n/routing";
import { normalizeAppLocale, type AppLocale } from "@/lib/i18n/config";
import { applyTheme } from "@/lib/settings/client";
import type { AppTheme } from "@/lib/settings/types";

type LocaleContextValue = {
  locale: AppLocale;
  messages: AppMessages;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

/**
 * Context that exposes a setter for the uid. This allows child components
 * (rendered after the session is available) to inject the uid into
 * UserSyncProvider without blocking the root layout.
 */
const UidSetterContext = createContext<((uid: string) => void) | null>(null);

type UserSyncProviderProps = LocaleContextValue & {
  children: React.ReactNode;
  uid?: string | null;
};

export function UserSyncProvider({
  locale,
  messages,
  uid: initialUid,
  children,
}: UserSyncProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [uid, setUidState] = useState(initialUid || null);
  const [livePreference, setLivePreference] = useState<{
    uid: string | null;
    locale: AppLocale | null;
  }>({
    uid: uid || null,
    locale: null,
  });
  const lastAppliedThemeRef = useRef<AppTheme | null>(null);

  // Reactive subscription to user settings in Convex
  const userSettings = useQuery(api.settings.getUserSettings);

  const activeLocale =
    uid && livePreference.uid === uid && livePreference.locale
      ? livePreference.locale
      : locale;
  const activeMessages =
    activeLocale === locale ? messages : getMessages(activeLocale);

  const setUid = useCallback((nextUid: string) => {
    setUidState((current) => (current === nextUid ? current : nextUid));
  }, []);

  useEffect(() => {
    if (!userSettings) return;

    if (userSettings.locale) {
      const nextLocale = normalizeAppLocale(userSettings.locale);
      setLivePreference((current) =>
        current.uid === uid && current.locale === nextLocale
          ? current
          : { uid: uid || "authenticated", locale: nextLocale },
      );
    }

    if (userSettings.theme && userSettings.theme !== lastAppliedThemeRef.current) {
      lastAppliedThemeRef.current = userSettings.theme as AppTheme;
      applyTheme(userSettings.theme as AppTheme);
    }
  }, [userSettings, uid]);

  useEffect(() => {
    document.documentElement.lang = activeLocale;
  }, [activeLocale]);

  useEffect(() => {
    if (!pathname) return;

    // Only force-redirect when a live preference is driving the locale.
    const hasLivePreference =
      livePreference.locale && livePreference.locale !== locale;
    if (!hasLivePreference) return;

    const query =
      typeof window !== "undefined" ? window.location.search.slice(1) : "";
    const currentPath = `${pathname}${query ? `?${query}` : ""}`;
    const currentPathLocale = getLocaleFromPathname(pathname);
    if (currentPathLocale === activeLocale) return;

    const nextPath = localizePath(activeLocale, currentPath);
    if (nextPath === currentPath) return;

    const timeout = window.setTimeout(() => {
      router.replace(nextPath);
    }, 0);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [activeLocale, pathname, router, locale, livePreference]);

  return (
    <UidSetterContext.Provider value={setUid}>
      <LocaleContext.Provider
        value={{ locale: activeLocale, messages: activeMessages }}
      >
        {children}
      </LocaleContext.Provider>
    </UidSetterContext.Provider>
  );
}

function useLocaleContext() {
  const value = useContext(LocaleContext);
  if (!value) {
    throw new Error("Locale context is not available.");
  }
  return value;
}

export function useAppLocale() {
  return useLocaleContext().locale;
}

export function useMessages() {
  return useLocaleContext().messages;
}

/**
 * Returns a setter to inject the uid into UserSyncProvider after the initial
 * render. Call this from a client component inside a layout that has already
 * resolved the session.
 */
export function useSetUserSyncUid() {
  return useContext(UidSetterContext);
}
