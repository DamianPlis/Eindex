import SkeletonLine from "./SkeletonLine";

export default function DealinesListSkeleton() {
  return (
    <>
      <div className="deadlines-skeleton-toggle">
        <SkeletonLine className="skeleton-toggle-button" />
      </div>
      <ul className="deadlines-list">
        {Array.from({ length: 3 }).map((_, index) => (
          <li
            key={`deadline-skeleton-${index}`}
            className="deadline-item deadlines-skeleton-item"
          >
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
  );
}
