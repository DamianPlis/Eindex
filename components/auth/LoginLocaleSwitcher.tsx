"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAppLocale } from "@/components/i18n/UserSyncProvider";
import { APP_LOCALES, type AppLocale } from "@/lib/i18n/config";
import { localizePath, stripLocaleFromPath } from "@/lib/i18n/routing";
import s from "./LoginLocaleSwitcher.module.css";

/**
 * Language labels intentionally in their own language so they're
 * recognisable regardless of the current UI locale.
 */
const LOCALE_META: Record<AppLocale, { flag: string; native: string }> = {
  cs: { flag: "/flags/cs.svg", native: "Čeština" },
  en: { flag: "/flags/en.svg", native: "English" },
  pl: { flag: "/flags/pl.svg", native: "Polski" },
};

export default function LoginLocaleSwitcher() {
  const locale = useAppLocale();
  const pathname = usePathname();
  const router = useRouter();

  function switchTo(next: AppLocale) {
    if (next === locale) return;
    const stripped = stripLocaleFromPath(pathname);
    router.replace(localizePath(next, stripped));
    router.refresh();
  }

  return (
    <div className={s.switcher} role="group" aria-label="Language">
      {APP_LOCALES.map((loc) => {
        const meta = LOCALE_META[loc];
        const active = loc === locale;
        return (
          <button
            key={loc}
            type="button"
            className={`${s.pill} ${active ? s.pillActive : ""}`}
            onClick={() => switchTo(loc)}
            disabled={active}
            aria-pressed={active}
            aria-label={meta.native}
            id={`login-locale-${loc}`}
          >
            <Image
              src={meta.flag}
              alt=""
              width={20}
              height={14}
              className={s.flag}
            />
            <span className={s.label}>{meta.native}</span>
          </button>
        );
      })}
    </div>
  );
}
