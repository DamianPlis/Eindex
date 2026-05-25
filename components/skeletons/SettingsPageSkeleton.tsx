import AppearanceSectionSkeleton from "./AppearanceSectionSkeleton";
import LanguageSectionSkeleton from "./LanguageSectionSkeleton";
import SubjectGroupsSectionSkeleton from "./SubjectGroupsSectionSkeleton";
import SubjectsSectionSkeleton from "./SubjectsSectionSkeleton";
import StatisticsSectionSkeleton from "./StatisticsSectionSkeleton";
import s from "@/components/settings/settings.module.css";

export default function SettingsPageSkeleton() {
  return (
    <div className={s.page} aria-hidden="true">
      <div className={s.container}>
        <AppearanceSectionSkeleton />
        <LanguageSectionSkeleton />
        <SubjectGroupsSectionSkeleton />
        <SubjectsSectionSkeleton />
        <StatisticsSectionSkeleton />
      </div>
    </div>
  );
}

