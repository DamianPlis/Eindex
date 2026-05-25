"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { getMessages, type AppMessages } from "@/lib/i18n/messages";
import { getLocaleFromPathname, localizePath } from "@/lib/i18n/routing";
import { normalizeAppLocale, type AppLocale } from "@/lib/i18n/config";

type LocaleContextValue = {
  locale: AppLocale;
  messages: AppMessages;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

type LocaleProviderProps = LocaleContextValue & {
  children: React.ReactNode;
  uid?: string | null;
};

function resolveSnapshotLocale(data: unknown): AppLocale | null {
  if (!data || typeof data !== "object") return null;

  const source = data as {
    settings?: {
      locale?: unknown;
    };
    state?: {
      settings?: {
        locale?: unknown;
      };
    };
  };

  const rawLocale = source.settings?.locale ?? source.state?.settings?.locale;
  if (rawLocale === undefined) return null;
  return normalizeAppLocale(rawLocale);
}

export function LocaleProvider({ locale, messages, uid, children }: LocaleProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [livePreference, setLivePreference] = useState<{ uid: string | null; locale: AppLocale | null }>({
    uid: uid || null,
    locale: null,
  });
  const activeLocale =
    uid && livePreference.uid === uid && livePreference.locale ? livePreference.locale : locale;
  const activeMessages = activeLocale === locale ? messages : getMessages(activeLocale);

  useEffect(() => {
    if (!uid) return;

    const unsubscribe = onSnapshot(
      doc(db, "users", uid),
      (snapshot) => {
        if (!snapshot.exists()) return;
        const nextLocale = resolveSnapshotLocale(snapshot.data());
        if (!nextLocale) return;
        setLivePreference((current) =>
          current.uid === uid && current.locale === nextLocale ? current : { uid, locale: nextLocale },
        );
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

    const query = typeof window !== "undefined" ? window.location.search.slice(1) : "";
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
    <LocaleContext.Provider value={{ locale: activeLocale, messages: activeMessages }}>{children}</LocaleContext.Provider>
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
