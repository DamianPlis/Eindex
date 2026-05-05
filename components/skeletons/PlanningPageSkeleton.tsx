import SkeletonLine from "@/components/skeletons/SkeletonLine";
import styles from "@/css/planning.module.css";

const tabCount = 5;
const slotCountFR = [8, 7, 6, 6, 8];
const slotCount = slotCountFR.map((count) => count - 2); // remove 2 slots artificially to make it look better on skeleton screen

export default function PlanningPageSkeleton() {
  return (
    <div className={styles.planningRoot} aria-hidden="true">
      <div className={styles.planningInner}>
        <div className={styles.controls}>
          <div className="flex items-center gap-3">
            <SkeletonLine className="planning-skeleton-nav" />
          </div>
          <SkeletonLine className="planning-skeleton-week-title" />
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <SkeletonLine className="planning-skeleton-nav" />
          </div>
        </div>

        <div className={styles.planningDayTabs}>
          {Array.from({ length: tabCount }).map((_, index) => (
            <div
              key={`planning-tab-skeleton-${index}`}
              className={styles.planningDayTab}
            >
              <SkeletonLine className="planning-skeleton-tab-name" />
              <SkeletonLine className="planning-skeleton-tab-date" />
            </div>
          ))}
        </div>

        <div className={styles.daysScroll}>
          {slotCount.map((slotCount, dayIndex) => (
            <article
              key={`planning-day-skeleton-${dayIndex}`}
              className={styles.dayCard}
            >
              <div className={styles.dayInner}>
                <header className={styles.dayHeader}>
                  <SkeletonLine className="planning-skeleton-day-name" />
                  <SkeletonLine className="planning-skeleton-day-date" />
                </header>

                <div className={styles.slots}>
                  {Array.from({ length: slotCount }).map((_, slotIndex) => (
                    <div
                      key={`planning-slot-skeleton-${dayIndex}-${slotIndex}`}
                      className={styles.slotCard}
                    >
                      <div className={styles.slotTop}>
                        <SkeletonLine className="planning-skeleton-slot-title" />
                        <SkeletonLine className="planning-skeleton-slot-time" />
                      </div>

                      <div className={styles.slotBody}>
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
