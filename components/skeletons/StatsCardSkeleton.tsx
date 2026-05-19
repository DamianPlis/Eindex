import SkeletonLine from "./SkeletonLine";
import styles from "@/components/deadlines/StatsCard.module.css";

export default function StatsCardSkeleton() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, cardIndex) => (
        <div
          key={`stats-skeleton-${cardIndex}`}
          className={`${styles.statsCard} deadlines-skeleton-stats-card`}
        >
          <div className={styles.statsCardHeader}>
            <div className={styles.statsCardTitleNav}>
              <SkeletonLine className="skeleton-title" />
              <div className={styles.statsCardNav}>
                <SkeletonLine className="skeleton-icon" />
                <SkeletonLine className="planning-skeleton-slot-title h[18]" />
                <SkeletonLine className="skeleton-icon" />
              </div>
            </div>
            <div className={styles.statsCardHeaderIcons}>
              <SkeletonLine className="skeleton-icon" />
              <SkeletonLine className="skeleton-pill" />
            </div>
          </div>
          <ul className="deadlines-skeleton-stats-list">
            {Array.from({ length: 5 }).map((_, statIndex) => (
              <li
                key={`stats-item-skeleton-${cardIndex}-${statIndex}`}
                className={styles.statsEntry}
              >
                <SkeletonLine className="skeleton-text-line-md" />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}
