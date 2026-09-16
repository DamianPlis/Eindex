"use client";
import { createContext, useContext, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { getMessages, type AppMessages } from "@/lib/i18n/messages";
import { getLocaleFromPathname, localizePath } from "@/lib/i18n/routing";
import { type AppLocale } from "@/lib/i18n/config";
import { applyTheme } from "@/lib/settings/client";
import { getClientId } from "@/lib/sync/client-id";

type LocaleContextValue = { locale: AppLocale; messages: AppMessages };
const LocaleContext = createContext<LocaleContextValue | null>(null);
export function UserSyncProvider({
  locale,
  messages,
  children,
}: LocaleContextValue & { children: React.ReactNode; uid?: string | null }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useConvexAuth();
  const settings = useQuery(
    api.settings.getUserSettings,
    isAuthenticated ? {} : "skip",
  );
  const activeLocale = settings?.locale ?? locale;
  const lastRevision = useRef<{ uid: string; version: number } | null>(null);

  useEffect(() => {
    if (settings?.theme) applyTheme(settings.theme);
  }, [settings?.theme]);
  useEffect(() => {
    document.documentElement.lang = activeLocale;
  }, [activeLocale]);
  useEffect(() => {
    if (
      !settings ||
      !pathname ||
      getLocaleFromPathname(pathname) === settings.locale
    )
      return;
    router.replace(
      localizePath(settings.locale, pathname + window.location.search),
    );
  }, [settings?.locale, settings, pathname, router]);
  useEffect(() => {
    if (!settings) {
      lastRevision.current = null;
      return;
    }
    const previous = lastRevision.current;
    lastRevision.current = {
      uid: settings.userId,
      version: settings.updatedAt,
    };
    if (
      !previous ||
      previous.uid !== settings.userId ||
      previous.version === settings.updatedAt ||
      settings.lastWriter === getClientId()
    )
      return;
    router.refresh();
  }, [settings, router]);
  return (
    <LocaleContext.Provider
      value={{
        locale: activeLocale,
        messages:
          activeLocale === locale ? messages : getMessages(activeLocale),
      }}
    >
      {children}
    </LocaleContext.Provider>
  );
}
function useLocaleContext() {
  const value = useContext(LocaleContext);
  if (!value) throw new Error("Locale context is not available.");
  return value;
}
export function useAppLocale() {
  return useLocaleContext().locale;
}
export function useMessages() {
  return useLocaleContext().messages;
}
