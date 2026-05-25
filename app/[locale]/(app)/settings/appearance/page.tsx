"use client";

import AppearanceSection from "@/components/settings/sections/AppearanceSection";
import { useSettings } from "@/components/settings/SettingsProvider";
import AppearanceSectionSkeleton from "@/components/skeletons/settings/AppearanceSectionSkeleton";
import s from "@/components/settings/settings.module.css";

export default function AppearancePage() {
  const { isRefreshing } = useSettings();
  if (isRefreshing) {
    return (
      <div className={s.page}>
        <div className={s.container}>
          <AppearanceSectionSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className={s.page}>
      <div className={s.container}>
        <AppearanceSection />
      </div>
    </div>
  );
}
