"use client";

import StatisticsSection from "@/components/settings/sections/StatisticsSection";
import { useSettings } from "@/components/settings/SettingsProvider";
import StatisticsSectionSkeleton from "@/components/skeletons/StatisticsSectionSkeleton";
import s from "@/components/settings/settings.module.css";

export default function StatisticsPage() {
  const { isRefreshing } = useSettings();
  if (isRefreshing) {
    return (
      <div className={s.page}>
        <div className={s.container}>
          <StatisticsSectionSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className={s.page}>
      <div className={s.container}>
        <StatisticsSection />
      </div>
    </div>
  );
}

