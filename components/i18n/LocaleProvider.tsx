"use client";

import { createContext, useContext } from "react";
import type { AppLocale } from "@/lib/i18n/config";
import type { AppMessages } from "@/lib/i18n/messages";

type LocaleContextValue = {
  locale: AppLocale;
  messages: AppMessages;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

type LocaleProviderProps = LocaleContextValue & {
  children: React.ReactNode;
};

export function LocaleProvider({ locale, messages, children }: LocaleProviderProps) {
  return <LocaleContext.Provider value={{ locale, messages }}>{children}</LocaleContext.Provider>;
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
