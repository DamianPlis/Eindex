import SkeletonLine from "@/components/skeletons/SkeletonLine";

interface DeadlinesPageSkeletonProps {
  showStats?: boolean;
  showList?: boolean;
}



export default function DeadlineDetailPageSkeleton({
  showStats = false,
  showList = true,
}: DeadlinesPageSkeletonProps) {
  return (
    <>
      {showList ? (
        <>
            <div className="container" style={{ margin: "16px" }}>
                <SkeletonLine className="skeleton-pill" />
                <br/>
                <div className="deadlines-skeleton-text">
                    <SkeletonLine className="skeleton-text-line-lg" />
                    <SkeletonLine className="planning-skeleton-day-name" style={{marginBottom:4}}/>
                    <SkeletonLine className="planning-skeleton-day-date" style={{marginBottom: 16}} />
                    <SkeletonLine className="skeleton-text-line-short-lg" />
                </div>
            </div>
        </>
      ) : null}

      {showStats ? (
        <>
          {Array.from({ length: 3 }).map((_, cardIndex) => (
            <div key={`stats-skeleton-${cardIndex}`} className="stats-card deadlines-skeleton-stats-card">
              <div className="stats-card-header">
                <SkeletonLine className="skeleton-title" />
                <div className="stats-card-header-icons">
                  <SkeletonLine className="skeleton-icon" />
                  <SkeletonLine className="skeleton-icon" />
                </div>
              </div>
              <ul className="deadlines-skeleton-stats-list">
                {Array.from({ length: 5 }).map((_, statIndex) => (
                  <li key={`stats-item-skeleton-${cardIndex}-${statIndex}`} className="stats-entry">
                    <SkeletonLine className="skeleton-text-line-md" />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </>
      ) : null}
    </>
  );
}
