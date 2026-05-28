import SkeletonLine from "./SkeletonLine";
import sk from "./Skeletons.module.css";
import sb from "@/components/layout/SlotBubble.module.css";
import d from "@/components/deadlines/Deadlines.module.css";

export default function ScheduleListSkeleton() {
  return (
    <div className={d.scheduleList}>
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={`schedule-skeleton-${index}`} className={sb.slotBubble}>
          <div className={sb.slotContent}>
            <div className={sk.scheduleSkeletonTextContainer}>
              <SkeletonLine
                className={`${sk.textLineShortLg} ${sk.scheduleSkeletonSlotMb}`}
              />
              <SkeletonLine className={sk.textLineMediumSm} />
            </div>
            <SkeletonLine className={sk.skeletonPill} />
          </div>
        </div>
      ))}
    </div>
  );
}
