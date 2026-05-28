import SkeletonLine from "./SkeletonLine";
import sk from "./Skeletons.module.css";
import d from "@/components/deadlines/Deadlines.module.css";

export default function DealinesListSkeleton() {
  return (
    <>
      <div className={sk.deadlinesSkeletonToggle}>
        <SkeletonLine className={sk.skeletonToggleButton} />
      </div>
      <ul className={d.deadlinesList}>
        {Array.from({ length: 3 }).map((_, index) => (
          <li
            key={`deadline-skeleton-${index}`}
            className={`${d.deadlineItem} ${sk.deadlinesSkeletonItem}`}
          >
            <div className={sk.deadlinesSkeletonText}>
              <SkeletonLine className={sk.textLineLg} />
              <SkeletonLine className={sk.textLineSm} />
            </div>
            <div className={`${d.deadlineActions} ${sk.deadlinesSkeletonActions}`}>
              <SkeletonLine className={sk.skeletonPill} />
              <SkeletonLine className={sk.skeletonActionCircle} />
              <SkeletonLine className={sk.skeletonActionCircle} />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
