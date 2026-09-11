import d from "@/components/deadlines/Deadlines.module.css";
import SkeletonLine from "./SkeletonLine";
import sk from "./Skeletons.module.css";

export default function RemindersListSkeleton() {
  return (
    <section className={d.remindersPanel} aria-hidden="true">
      <div className={d.remindersHeader}>
        <div className={d.remindersHeadingGroup}>
          <SkeletonLine className={sk.remindersSkeletonIcon} />
          <div>
            <SkeletonLine className={sk.remindersSkeletonEyebrow} />
            <SkeletonLine className={sk.remindersSkeletonTitle} />
          </div>
        </div>
        <SkeletonLine className={sk.remindersSkeletonViewAll} />
      </div>
      <ul>
        {Array.from({ length: 3 }).map((_, index) => (
          <li key={index}>
            <div className={d.deadlineItem}>
              <div className={d.reminderBody}>
                <SkeletonLine className={`${sk.textLineLg} ${sk.noMargin}`} />
                <SkeletonLine className={`${sk.textLineSm} ${sk.noMargin}`} />
              </div>
              <SkeletonLine className={sk.skeletonPill} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
