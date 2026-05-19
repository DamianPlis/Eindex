"use client";

import Image from "next/image";
import { useMessages } from "@/components/i18n/LocaleProvider";
import { useSettings } from "@/components/settings/SettingsProvider";
import type { AppLocale } from "@/lib/i18n/config";
import s from "@/components/settings/settings.module.css";

export default function LanguageSection() {
  const messages = useMessages();
  const {
    settings,
    isPending,
    pendingAction,
    errorMessage,
    handleLocaleChange,
  } = useSettings();

  const languageOptions: Array<{
    locale: AppLocale;
    label: string;
    flagSrc: string;
    countryCode: string;
  }> = [
    {
      locale: "cs",
      label: messages.common.czech,
      flagSrc: "/flags/cs.svg",
      countryCode: "CZ",
    },
    {
      locale: "en",
      label: messages.common.english,
      flagSrc: "/flags/en.svg",
      countryCode: "GB",
    },
    {
      locale: "pl",
      label: messages.common.polish,
      flagSrc: "/flags/pl.svg",
      countryCode: "PL",
    },
  ];

  const currentLanguageLabel =
    languageOptions.find((option) => option.locale === settings.locale)
      ?.label || messages.common.czech;

  return (
    <>
      <section id="settings-language" className={s.section}>
        <div className={s.sectionHeading}>
          <h3>{messages.settings.currentLanguage}</h3>
          <span className={s.currentValue}>
            {pendingAction === "locale"
              ? messages.common.saving
              : currentLanguageLabel}
          </span>
        </div>

        <div className={s.optionGrid}>
          {languageOptions.map((option) => {
            const isActive = settings.locale === option.locale;
            return (
              <button
                key={option.locale}
                className={`${isActive ? s.languageButtonActive : null}${s.languageButton} ${
                  isPending && pendingAction === "locale" ? "pending" : ""
                }`}
                type="button"
                onClick={() => handleLocaleChange(option.locale)}
                disabled={isPending || isActive}
                aria-pressed={isActive}
                aria-label={option.label}
              >
                <span className={s.flagFrame}>
                  <Image
                    src={option.flagSrc}
                    alt=""
                    width={34}
                    height={24}
                    className={s.flag}
                  />
                </span>
                <span className={s.languageText}>
                  <span className={s.choiceLabel}>{option.label}</span>
                  <span className={s.languageCode}>{option.countryCode}</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {errorMessage ? <p className={s.errorMessage}>{errorMessage}</p> : null}
    </>
  );
}
