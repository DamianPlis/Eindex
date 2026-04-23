import SkeletonLine from "./SkeletonLine";

export default function StatsCardSkeleton() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, cardIndex) => (
        <div
          key={`stats-skeleton-${cardIndex}`}
          className="stats-card deadlines-skeleton-stats-card"
        >
          <div className="stats-card-header">
            <SkeletonLine className="skeleton-title" />
            <div className="stats-card-header-icons">
              <SkeletonLine className="skeleton-icon" />
              <SkeletonLine className="skeleton-icon" />
            </div>
          </div>
          <ul className="deadlines-skeleton-stats-list">
            {Array.from({ length: 5 }).map((_, statIndex) => (
              <li
                key={`stats-item-skeleton-${cardIndex}-${statIndex}`}
                className="stats-entry"
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
