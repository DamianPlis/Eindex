"use client";

import { useMessages } from "@/components/i18n/UserSyncProvider";
import { useSettings } from "@/components/settings/SettingsProvider";
import DarkModeIcon from "@/icons/dark_mode_24dp_000000_FILL0_wght400_GRAD0_opsz24.svg";
import LightModeIcon from "@/icons/light_mode_24dp_000000_FILL0_wght400_GRAD0_opsz24.svg";
import s from "@/components/settings/settings.module.css";

const themeOptions = [
  { value: "light", icon: LightModeIcon, labelKey: "light" },
  { value: "dark", icon: DarkModeIcon, labelKey: "dark" },
] as const;

export default function AppearanceSection() {
  const messages = useMessages();
  const { settings, isPending, pendingAction, handleThemeSelect } =
    useSettings();

  const currentThemeLabel =
    settings.theme === "dark" ? messages.common.dark : messages.common.light;

  return (
    <section id="settings-appearance" className={s.section}>
      <div className={s.sectionHeading}>
        <h3>{messages.settings.currentTheme}</h3>
        <span className={`capitalize ${s.currentValue}`}>
          {currentThemeLabel}
        </span>
      </div>

      <div className={s.optionGridCompact}>
        {themeOptions.map((option) => {
          const Icon = option.icon;
          const isActive = settings.theme === option.value;
          const label =
            option.labelKey === "dark"
              ? messages.common.dark
              : messages.common.light;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => handleThemeSelect(option.value)}
              className={`capitalize ${isActive ? s.choiceButtonActive : s.choiceButton} ${
                isPending && pendingAction === "theme" ? "pending" : ""
              }`}
              disabled={isPending && pendingAction === "theme"}
              aria-pressed={isActive}
              aria-label={label}
            >
              <span className={s.choiceIcon}>
                <Icon fill="currentColor" />
              </span>
              <span className={s.choiceLabel}>{label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
