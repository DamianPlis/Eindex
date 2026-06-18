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
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
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

function resolveSnapshotLocale(data: unknown): AppLocale | null {
  if (!data || typeof data !== "object") return null;

  const source = data as {
    settings?: { locale?: unknown };
    state?: { settings?: { locale?: unknown } };
  };

  // Prefer top-level settings; fall back to legacy state.settings
  const rawLocale = source.settings?.locale ?? source.state?.settings?.locale;
  if (rawLocale === undefined) return null;
  return normalizeAppLocale(rawLocale);
}

/**
 * Extracts the theme from a Firestore user document snapshot.
 * Prefers the top-level settings field; falls back to legacy state.settings.
 */
function resolveSnapshotTheme(data: unknown): AppTheme | null {
  if (!data || typeof data !== "object") return null;

  const source = data as {
    settings?: { theme?: unknown };
    state?: { settings?: { theme?: unknown } };
  };

  // Prefer top-level settings; fall back to legacy state.settings
  const rawTheme = source.settings?.theme ?? source.state?.settings?.theme;
  if (rawTheme === undefined) return null;
  return rawTheme === "dark" ? "dark" : "light";
}

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
    if (!uid) return;

    const unsubscribe = onSnapshot(
      doc(db, "users", uid),
      (snapshot) => {
        if (!snapshot.exists()) return;
        const data = snapshot.data();

        const nextLocale = resolveSnapshotLocale(data);
        if (nextLocale) {
          setLivePreference((current) =>
            current.uid === uid && current.locale === nextLocale
              ? current
              : { uid, locale: nextLocale },
          );
        }

        // Sync theme from Firestore → DOM + cookie.
        // Firestore is the source of truth, but onSnapshot fires immediately
        // with locally cached data which can be stale (e.g. theme was changed
        // on this device via a server action, which updates the cookie but
        // NOT the client-side Firestore cache). Skip cached snapshots that
        // disagree with the current DOM theme to avoid a flash; only apply
        // from server-confirmed data.
        const nextTheme = resolveSnapshotTheme(data);
        if (nextTheme && nextTheme !== lastAppliedThemeRef.current) {
          const domTheme = document.documentElement.getAttribute("data-theme");
          const isStaleCachedTheme =
            snapshot.metadata.fromCache && nextTheme !== domTheme;
          if (!isStaleCachedTheme) {
            lastAppliedThemeRef.current = nextTheme;
            applyTheme(nextTheme);
          }
        }
      },
      () => {
        // noop
      },
    );

    return unsubscribe;
  }, [uid]);

  useEffect(() => {
    document.documentElement.lang = activeLocale;
  }, [activeLocale]);

  useEffect(() => {
    if (!pathname) return;

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
  }, [activeLocale, pathname, router]);

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
