"use client";

import LanguageSection from "@/components/settings/sections/LanguageSection";
import { useSettings } from "@/components/settings/SettingsProvider";
import SettingsPageSkeleton from "@/components/skeletons/SettingsPageSkeleton";
import s from "@/components/settings/settings.module.css";

export default function LanguagePage() {
  const { isRefreshing } = useSettings();
  if (isRefreshing) return <SettingsPageSkeleton />;

  return (
    <div className={s.page}>
      <div className={s.container}>
        <LanguageSection />
      </div>
    </div>
  );
}
