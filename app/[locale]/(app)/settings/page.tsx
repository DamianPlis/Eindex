"use client";

import AppearanceSection from "@/components/settings/sections/AppearanceSection";
import LanguageSection from "@/components/settings/sections/LanguageSection";
import SubjectsSection from "@/components/settings/sections/SubjectsSection";
import StatisticsSection from "@/components/settings/sections/StatisticsSection";
import { useSettings } from "@/components/settings/SettingsProvider";
import SettingsPageSkeleton from "@/components/skeletons/SettingsPageSkeleton";
import s from "@/components/settings/settings.module.css";

export default function SettingsAllPage() {
  const { isRefreshing } = useSettings();

  if (isRefreshing) return <SettingsPageSkeleton />;

  return (
    <div className={s.page}>
      <div className={s.container}>
        <AppearanceSection />
        <LanguageSection />
        <SubjectsSection />
        <StatisticsSection />
      </div>
    </div>
  );
}
