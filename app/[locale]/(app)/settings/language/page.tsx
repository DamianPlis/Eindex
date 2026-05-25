"use client";

import LanguageSection from "@/components/settings/sections/LanguageSection";
import { useSettings } from "@/components/settings/SettingsProvider";
import LanguageSectionSkeleton from "@/components/skeletons/settings/LanguageSectionSkeleton";
import s from "@/components/settings/settings.module.css";

export default function LanguagePage() {
  const { isRefreshing } = useSettings();
  if (isRefreshing) {
    return (
      <div className={s.page}>
        <div className={s.container}>
          <LanguageSectionSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className={s.page}>
      <div className={s.container}>
        <LanguageSection />
      </div>
    </div>
  );
}
