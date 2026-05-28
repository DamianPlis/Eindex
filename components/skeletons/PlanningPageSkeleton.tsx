import SkeletonLine from "@/components/skeletons/SkeletonLine";
import sk from "./Skeletons.module.css";
import s from "@/components/pages/PlanningPageClient.module.css";

const tabCount = 5;
const slotCountFR = [8, 7, 6, 6, 8];
const slotCount = slotCountFR.map((count) => count - 2); // remove 2 slots artificially to make it look better on skeleton screen

export default function PlanningPageSkeleton() {
  return (
    <div className={s.planningRoot} aria-hidden="true">
      <div className={s.planningInner}>
        <div className={s.controls}>
          <div className={s.navGroup}>
            <SkeletonLine className={sk.planningSkeletonNav} />
          </div>
          <SkeletonLine className={sk.planningSkeletonWeekTitle} />
          <div className={s.navGroup}>
            <SkeletonLine className={sk.planningSkeletonNav} />
          </div>
        </div>

        <div className={s.planningDayTabs}>
          {Array.from({ length: tabCount }).map((_, index) => (
            <div key={`planning-tab-skeleton-${index}`} className={s.planningDayTab}>
              <SkeletonLine className={sk.planningSkeletonTabName} />
              <SkeletonLine className={sk.planningSkeletonTabDate} />
            </div>
          ))}
        </div>

        <div className={s.daysScroll}>
          {slotCount.map((slotCount, dayIndex) => (
            <article key={`planning-day-skeleton-${dayIndex}`} className={s.dayCard}>
              <div className={s.dayInner}>
                <header className={s.dayHeader}>
                  <SkeletonLine className={sk.planningSkeletonDayName} />
                  <SkeletonLine className={sk.planningSkeletonDayDate} />
                </header>

                <div className={s.slots}>
                  {Array.from({ length: slotCount }).map((_, slotIndex) => (
                    <div key={`planning-slot-skeleton-${dayIndex}-${slotIndex}`} className={s.slotCard}>
                      <div className={s.slotTop}>
                        <SkeletonLine className={sk.planningSkeletonSlotTitle} />
                        <SkeletonLine className={sk.planningSkeletonSlotTime} />
                      </div>

                      <div className={s.slotBody}>
                        <SkeletonLine className={sk.planningSkeletonInput} />
                        <SkeletonLine className={sk.planningSkeletonInput} />
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
