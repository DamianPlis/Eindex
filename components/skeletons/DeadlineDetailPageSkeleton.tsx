import SkeletonLine from "@/components/skeletons/SkeletonLine";

export default function DeadlineDetailPageSkeleton({}) {
  return (
    <>
      <>
        <div className="container m-4">
          <SkeletonLine className="skeleton-pill" />
          <br />
          <div className="deadlines-skeleton-text">
            <SkeletonLine className="skeleton-text-line-lg" />
            <SkeletonLine className="mb-1 planning-skeleton-day-name" />
            <SkeletonLine className="mb-4 planning-skeleton-day-date" />

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
