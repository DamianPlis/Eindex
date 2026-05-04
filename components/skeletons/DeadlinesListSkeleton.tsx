import SkeletonLine from "./SkeletonLine";
import styles from "@/css/Deadlines.module.css";

export default function DealinesListSkeleton() {
  return (
    <>
      <div className="deadlines-skeleton-toggle">
        <SkeletonLine className="skeleton-toggle-button" />
      </div>
      <ul className={styles.deadlinesList}>
        {Array.from({ length: 3 }).map((_, index) => (
          <li
            key={`deadline-skeleton-${index}`}
            className={`${styles.deadlineItem} deadlines-skeleton-item`}
          >
            <div className="deadlines-skeleton-text">
              <SkeletonLine className="skeleton-text-line-lg" />
              <SkeletonLine className="skeleton-text-line-sm" />
            </div>
            <div
              className={`${styles.deadlineActions} deadlines-skeleton-actions`}
            >
              <SkeletonLine className="skeleton-pill" />
              <SkeletonLine className="skeleton-action-circle" />
              <SkeletonLine className="skeleton-action-circle" />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
