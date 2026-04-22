import SkeletonLine from "@/components/skeletons/SkeletonLine";

const tabCount = 5;
const slotCountFR = [8, 7, 6, 6, 8];
const slotCount = slotCountFR.map((count) => count - 2); // remove 2 slots artificially to make it look better on skeleton screen

export default function PlanningPageSkeleton() {
  return (
    <div className="planning-root" aria-hidden="true">
      <div className="planning-inner">
        <div className="controls">
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <SkeletonLine className="planning-skeleton-nav" />
          </div>
          <SkeletonLine className="planning-skeleton-week-title" />
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <SkeletonLine className="planning-skeleton-nav" />
          </div>
        </div>

        <div className="planning-day-tabs">
          {Array.from({ length: tabCount }).map((_, index) => (
            <div key={`planning-tab-skeleton-${index}`} className="planning-day-tab">
              <SkeletonLine className="planning-skeleton-tab-name" />
              <SkeletonLine className="planning-skeleton-tab-date" />
            </div>
          ))}
        </div>

        <div className="days-scroll">
          {slotCount.map((slotCount, dayIndex) => (
            <article key={`planning-day-skeleton-${dayIndex}`} className="day-card">
              <div className="day-inner">
                <header className="day-header">
                  <SkeletonLine className="planning-skeleton-day-name" />
                  <SkeletonLine className="planning-skeleton-day-date" />
                </header>

                <div className="slots">
                  {Array.from({ length: slotCount }).map((_, slotIndex) => (
                    <div key={`planning-slot-skeleton-${dayIndex}-${slotIndex}`} className="slot-card">
                      <div className="slot-top">
                        <SkeletonLine className="planning-skeleton-slot-title" />
                        <SkeletonLine className="planning-skeleton-slot-time" />
                      </div>

                      <div className="slot-body">
                        <SkeletonLine className="planning-skeleton-input" />
                        <SkeletonLine className="planning-skeleton-input" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
