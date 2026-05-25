"use client";

import SubjectsSection from "@/components/settings/sections/SubjectsSection";
import SubjectGroupsSection from "@/components/settings/sections/SubjectGroupsSection";
import { useSettings } from "@/components/settings/SettingsProvider";
import SubjectGroupsSectionSkeleton from "@/components/skeletons/settings/SubjectGroupsSectionSkeleton";
import SubjectsSectionSkeleton from "@/components/skeletons/settings/SubjectsSectionSkeleton";
import s from "@/components/settings/settings.module.css";

export default function SubjectsPage() {
  const { isRefreshing } = useSettings();
  if (isRefreshing) {
    return (
      <div className={s.page}>
        <div className={s.container}>
          <SubjectGroupsSectionSkeleton />
          <SubjectsSectionSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className={s.page}>
      <div className={s.container}>
        <SubjectGroupsSection />
        <SubjectsSection />
      </div>
    </div>
  );
}
