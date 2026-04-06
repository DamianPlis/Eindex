"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { updateSettingsAction } from "@/app/(app)/actions";
import { useAppLocale, useMessages } from "@/components/i18n/LocaleProvider";
import { localizePath, stripLocaleFromPath } from "@/lib/i18n/routing";
import { applyTheme } from "@/lib/settings/client";
import type { AppSettings, AppTheme } from "@/lib/settings/types";
import { getClientId } from "@/lib/sync/client-id";

type SettingsPageClientProps = {
  initialSettings: AppSettings;
};

type PendingAction = "theme" | "locale" | null;

export default function SettingsPageClient({ initialSettings }: SettingsPageClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = useAppLocale();
  const messages = useMessages();
  const clientIdRef = useRef("");
  const [isPending, startTransition] = useTransition();
  const [settings, setSettings] = useState(initialSettings);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    clientIdRef.current = getClientId();
  }, []);

  useEffect(() => {
    setSettings(initialSettings);
  }, [initialSettings]);

  useEffect(() => {
    applyTheme(settings.theme);
  }, [settings.theme]);

  function handleThemeToggle() {
    const nextTheme: AppTheme = settings.theme === "dark" ? "light" : "dark";

    const previousSettings = settings;
    const optimisticSettings = {
      ...settings,
      theme: nextTheme,
    };

    setSettings(optimisticSettings);
    setPendingAction("theme");
    setErrorMessage("");
    applyTheme(nextTheme);

    startTransition(async () => {
      try {
        const savedSettings = await updateSettingsAction({
          theme: nextTheme,
          writerId: clientIdRef.current,
        });
        setSettings(savedSettings);
        applyTheme(savedSettings.theme);
      } catch {
        setSettings(previousSettings);
        setErrorMessage(messages.settings.themeSaveError);
        applyTheme(previousSettings.theme);
      } finally {
        setPendingAction(null);
      }
    });
  }

  function handleLocaleToggle() {
    const nextLocale = locale === "en" ? "cs" : "en";
    const previousSettings = settings;
    const query = searchParams.toString();
    const nextPath = localizePath(
      nextLocale,
      `${stripLocaleFromPath(pathname || "/")}${query ? `?${query}` : ""}`,
    );

    setPendingAction("locale");
    setErrorMessage("");

    startTransition(async () => {
      try {
        const savedSettings = await updateSettingsAction({
          locale: nextLocale,
          writerId: clientIdRef.current,
        });
        setSettings(savedSettings);
        router.replace(nextPath);
      } catch {
        setSettings(previousSettings);
        setPendingAction(null);
        setErrorMessage(messages.settings.languageSaveError);
      }
    });
  }

  const currentThemeLabel = settings.theme === "dark" ? messages.common.dark : messages.common.light;
  const currentLanguageLabel = locale === "cs" ? messages.common.czech : messages.common.english;

  return (
    <div className="main-container">
      <div className="container">
        <h2>{messages.settings.title}</h2>
        <p>{messages.settings.currentTheme}: {currentThemeLabel}</p>
        <button className="add-button" type="button" onClick={handleThemeToggle} disabled={isPending}>
          {isPending && pendingAction === "theme"
            ? messages.common.saving
            : settings.theme === "dark"
              ? messages.settings.switchToLightMode
              : messages.settings.switchToDarkMode}
        </button>
        <p>{messages.settings.currentLanguage}: {currentLanguageLabel}</p>
        <button className="add-button" type="button" onClick={handleLocaleToggle} disabled={isPending}>
          {isPending && pendingAction === "locale"
            ? messages.common.saving
            : locale === "en"
              ? messages.settings.switchToCzech
              : messages.settings.switchToEnglish}
        </button>
        {errorMessage ? (
          <p style={{ color: "var(--danger-text)", marginBottom: 0 }}>{errorMessage}</p>
        ) : null}
      </div>
    </div>
  );
}
