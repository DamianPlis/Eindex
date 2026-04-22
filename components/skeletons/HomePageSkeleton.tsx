import SkeletonLine from "@/components/skeletons/SkeletonLine";

interface HomePageSkeletonProps {
  showScheduleList?: boolean;
  showRemindersList?: boolean;
}



export default function DeadlinesPageSkeleton({
  showScheduleList = true,
  showRemindersList = true,
}: HomePageSkeletonProps) {
  return (
    <>
      {showRemindersList ? (
        <>
          <ul className="deadlines-list">
            {Array.from({ length: 3 }).map((_, index) => (
              <li key={`deadline-skeleton-${index}`} className="deadline-item deadlines-skeleton-item">
                <div className="deadlines-skeleton-text">
                  <SkeletonLine className="skeleton-text-line-lg" />
                  <SkeletonLine className="skeleton-text-line-sm" />
                </div>
                <div className="deadline-actions deadlines-skeleton-actions">
                  <SkeletonLine className="skeleton-pill" />
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {showScheduleList ? (
        <div className="schedule-list">
         {Array.from({ length: 5 }).map((_, index) => (
          <div
          key={`schedule-skeleton-${index}`}
            className={`slot-bubble `}
          >
            <div className="slot-content">
              <div className="schedule-skeleton-text-container">
                <SkeletonLine style={{marginBottom: 8}} className=" skeleton-text-line-short-lg"></SkeletonLine>
                <SkeletonLine className="skeleton-text-line-medium-sm"></SkeletonLine>
              </div>
              <SkeletonLine className="slot-time-text skeleton-pill"></SkeletonLine>
            </div>
          </div>
          ))}
        </div>
      ) : null}
    </>
  );
}
