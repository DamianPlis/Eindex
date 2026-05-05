import SkeletonLine from "./SkeletonLine";
import styles from "@/css/Deadlines.module.css";

export default function RemidersListSkeleton() {
  return (
    <>
      <ul className={styles.deadlinesList}>
        {Array.from({ length: 3 }).map((_, index) => (
          <li
            key={`deadline-skeleton-${index}`}
            className={`${styles.deadlineItem} ${styles.deadlinesSkeletonItem}`}
          >
            <div className="deadlines-skeleton-text">
              <SkeletonLine className="skeleton-text-line-lg" />
              <SkeletonLine className="skeleton-text-line-sm" />
            </div>
            <div
              className={`${styles.deadlineActions} deadlines-skeleton-actions`}
            >
              <SkeletonLine className="skeleton-pill" />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
