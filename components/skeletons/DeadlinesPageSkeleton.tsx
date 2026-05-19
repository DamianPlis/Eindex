import SkeletonLine from "@/components/skeletons/SkeletonLine";
import styles from "@/components/deadlines/StatsCard.module.css";

interface DeadlinesPageSkeletonProps {
  showStats?: boolean;
  showList?: boolean;
}



export default function DeadlinesPageSkeleton({
  showStats = true,
  showList = true,
}: DeadlinesPageSkeletonProps) {
  return (
    <>
      {showList ? (
        <>
          <div className="deadlines-skeleton-toggle">
            <SkeletonLine className="skeleton-toggle-button" />
          </div>
          <ul className="deadlines-list">
            {Array.from({ length: 3 }).map((_, index) => (
              <li key={`deadline-skeleton-${index}`} className="deadline-item deadlines-skeleton-item">
                <div className="deadlines-skeleton-text">
                  <SkeletonLine className="skeleton-text-line-lg" />
                  <SkeletonLine className="skeleton-text-line-sm" />
                </div>
                <div className="deadline-actions deadlines-skeleton-actions">
                  <SkeletonLine className="skeleton-pill" />
                  <SkeletonLine className="skeleton-action-circle" />
                  <SkeletonLine className="skeleton-action-circle" />
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {showStats ? (
        <>
          {Array.from({ length: 3 }).map((_, cardIndex) => (
            <div key={`stats-skeleton-${cardIndex}`} className={`${styles.statsCard} deadlines-skeleton-stats-card`}>
              <div className={styles.statsCardHeader}>
                <SkeletonLine className="skeleton-title" />
                <div className={styles.statsCardHeaderIcons}>
                  <SkeletonLine className="skeleton-icon" />
                  <SkeletonLine className="skeleton-icon" />
                </div>
              </div>
              <ul className="deadlines-skeleton-stats-list">
                {Array.from({ length: 5 }).map((_, statIndex) => (
                  <li key={`stats-item-skeleton-${cardIndex}-${statIndex}`} className={styles.statsEntry}>
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
