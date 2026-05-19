"use client";

import SubjectsSection from "@/components/settings/sections/SubjectsSection";
import { useSettings } from "@/components/settings/SettingsProvider";
import SettingsPageSkeleton from "@/components/skeletons/SettingsPageSkeleton";
import s from "@/components/settings/settings.module.css";

export default function SubjectsPage() {
  const { isRefreshing } = useSettings();
  if (isRefreshing) return <SettingsPageSkeleton />;

  return (
    <div className={s.page}>
      <div className={s.container}>
        <SubjectsSection />
      </div>
    </div>
  );
}
