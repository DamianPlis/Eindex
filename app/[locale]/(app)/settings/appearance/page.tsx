"use client";

import AppearanceSection from "@/components/settings/sections/AppearanceSection";
import { useSettings } from "@/components/settings/SettingsProvider";
import SettingsPageSkeleton from "@/components/skeletons/SettingsPageSkeleton";
import s from "@/components/settings/settings.module.css";

export default function AppearancePage() {
  const { isRefreshing } = useSettings();
  if (isRefreshing) return <SettingsPageSkeleton />;

  return (
    <div className={s.page}>
      <div className={s.container}>
        <AppearanceSection />
      </div>
    </div>
  );
}
