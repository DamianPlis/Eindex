import SkeletonLine from "./SkeletonLine";

export default function ScheduleListSkeleton() {
  return (
    <div className="schedule-list">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={`schedule-skeleton-${index}`} className={`slot-bubble `}>
          <div className="slot-content">
            <div className="schedule-skeleton-text-container">
              <SkeletonLine
                style={{ marginBottom: 8 }}
                className=" skeleton-text-line-short-lg"
              ></SkeletonLine>
              <SkeletonLine className="skeleton-text-line-medium-sm"></SkeletonLine>
            </div>
            <SkeletonLine className="slot-time-text skeleton-pill"></SkeletonLine>
          </div>
        </div>
      ))}
    </div>
  );
}
