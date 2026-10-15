import d from "@/components/deadlines/Deadlines.module.css";
import DeadlinesListSkeleton from "@/components/skeletons/DeadlinesListSkeleton";
import SkeletonLine from "@/components/skeletons/SkeletonLine";
import sk from "@/components/skeletons/Skeletons.module.css";
import StatsCardSkeleton from "@/components/skeletons/StatsCardSkeleton";

export default function DeadlinesLoading() {
  return (
    <div className={d.deadlinesContainer}>
      <div style={{ marginBottom: 14 }} className={d.flexBetween}>
        <SkeletonLine className={sk.deadlinesSkeletonPageHeading} />
        <SkeletonLine className={sk.deadlinesSkeletonAddButton} />
      </div>

      <DeadlinesListSkeleton />

      <SkeletonLine className={sk.deadlinesSkeletonStatsHeading} />
      <div className={d.statsContainer}>
        <StatsCardSkeleton />
      </div>
    </div>
  );
}
