import SkeletonLine from "./SkeletonLine";
import styles from "@/css/SlotBubble.module.css";

export default function ScheduleListSkeleton() {
  return (
    <div className={styles.scheduleList}>
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={`schedule-skeleton-${index}`} className={styles.slotBubble}>
          <div className={styles.slotContent}>
            <div className="schedule-skeleton-text-container">
              <SkeletonLine
                style={{ marginBottom: 8 }}
                className=" skeleton-text-line-short-lg"
              ></SkeletonLine>
              <SkeletonLine className="skeleton-text-line-medium-sm"></SkeletonLine>
            </div>
            <SkeletonLine className="slot-time-text skeleton-pill"></SkeletonLine>
          </div>
        </div>
      ))}
    </div>
  );
}
