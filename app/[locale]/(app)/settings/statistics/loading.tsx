import StatisticsSectionSkeleton from "@/components/skeletons/settings/StatisticsSectionSkeleton";
import s from "@/components/settings/settings.module.css";

export default function StatisticsLoading() {
  return (
    <div className={s.page}>
      <div className={s.container}>
        <StatisticsSectionSkeleton />
      </div>
    </div>
  );
}
