"use client";

import StatisticsSection from "@/components/settings/sections/StatisticsSection";
import { useSettings } from "@/components/settings/SettingsProvider";
import SettingsPageSkeleton from "@/components/skeletons/SettingsPageSkeleton";
import s from "@/components/settings/settings.module.css";

export default function StatisticsPage() {
  const { isRefreshing } = useSettings();
  if (isRefreshing) return <SettingsPageSkeleton />;

  return (
    <div className={s.page}>
      <div className={s.container}>
        <StatisticsSection />
      </div>
    </div>
  );
}
