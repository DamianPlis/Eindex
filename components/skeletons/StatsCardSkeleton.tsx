import SkeletonLine from "./SkeletonLine";
import styles from "@/components/deadlines/StatsCard.module.css";
import sk from "./Skeletons.module.css";

export default function StatsCardSkeleton() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, cardIndex) => (
        <div
          key={`stats-skeleton-${cardIndex}`}
          className={`${styles.statsCard} ${sk.deadlinesSkeletonStatsCard}`}
        >
          <div className={styles.statsCardHeader}>
            <div className={styles.statsCardTitleNav}>
              <SkeletonLine className={sk.skeletonTitle} />
              <div className={styles.statsCardNav}>
                <SkeletonLine className={sk.skeletonIcon} />
                <SkeletonLine className={sk.planningSkeletonSlotTitle} />
                <SkeletonLine className={sk.skeletonIcon} />
              </div>
            </div>
            <div className={styles.statsCardHeaderIcons}>
              <SkeletonLine className={sk.skeletonIcon} />
              <SkeletonLine className={sk.skeletonPill} />
            </div>
          </div>
          <ul className={sk.deadlinesSkeletonStatsList}>
            {Array.from({ length: 5 }).map((_, statIndex) => (
              <li
                key={`stats-item-skeleton-${cardIndex}-${statIndex}`}
                className={styles.statsEntry}
              >
                <SkeletonLine className={sk.textLineMd} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}
