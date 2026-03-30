"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { updateSettingsAction } from "@/app/(app)/actions";
import { applyTheme } from "@/lib/settings/client";
import type { AppSettings, AppTheme } from "@/lib/settings/types";
import { getClientId } from "@/lib/sync/client-id";

type SettingsPageClientProps = {
  initialSettings: AppSettings;
};

type SaveState = "idle" | "saving" | "error";

export default function SettingsPageClient({ initialSettings }: SettingsPageClientProps) {
  const clientIdRef = useRef("");
  const [isPending, startTransition] = useTransition();
  const [settings, setSettings] = useState(initialSettings);
  const [saveState, setSaveState] = useState<SaveState>("idle");

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
    setSaveState("saving");
    applyTheme(nextTheme);

    startTransition(async () => {
      try {
        const savedSettings = await updateSettingsAction({
          theme: nextTheme,
          writerId: clientIdRef.current,
        });
        setSettings(savedSettings);
        setSaveState("idle");
        applyTheme(savedSettings.theme);
      } catch {
        setSettings(previousSettings);
        setSaveState("error");
        applyTheme(previousSettings.theme);
      }
    });
  }

  return (
    <div className="main-container">
      <div className="container">
        <h2>Settings</h2>
        <p>Current theme: {settings.theme}</p>
        <button className="add-button" type="button" onClick={handleThemeToggle} disabled={isPending}>
          {isPending
            ? "Saving..."
            : settings.theme === "dark"
              ? "Switch to light mode"
              : "Switch to dark mode"}
        </button>
        {saveState === "error" ? (
          <p style={{ color: "var(--danger-text)", marginBottom: 0 }}>Could not save your theme.</p>
        ) : null}
      </div>
    </div>
  );
}
