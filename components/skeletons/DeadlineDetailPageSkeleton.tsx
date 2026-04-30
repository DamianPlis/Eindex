import SkeletonLine from "@/components/skeletons/SkeletonLine";
import planningStyles from "@/css/planning.module.css";

export default function DeadlineDetailPageSkeleton({}) {
  return (
    <>
      <>
        <div className="container m-4">
          <SkeletonLine className="skeleton-pill" />
          <br />
          <div className="deadlines-skeleton-text">
            <SkeletonLine className="skeleton-text-line-lg" />
            <SkeletonLine className={`mb-1 ${planningStyles.planningSkeletonDayName}`} />
            <SkeletonLine className={`mb-4 ${planningStyles.planningSkeletonDayDate}`} />

            <SkeletonLine className="skeleton-text-line-lg" />
            <SkeletonLine className="mb-2 skeleton-text-line-md" />
            <SkeletonLine className="mb-2 skeleton-text-line-md" />
            <SkeletonLine className="mb-2 skeleton-text-line-md" />
            <SkeletonLine className="mb-6 skeleton-text-line-md" />

            <SkeletonLine className="skeleton-text-line-short-lg" />
          </div>
        </div>
      </>
    </>
  );
}
