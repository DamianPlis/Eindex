import type { ReactNode } from "react";
import SkeletonLine from "./SkeletonLine";
import sk from "./Skeletons.module.css";
import d from "@/components/deadlines/Deadlines.module.css";

type SkeletonListItemsProps = {
  /** Extra action elements to render inside each item's actions area */
  extraActions?: ReactNode;
};

/**
 * Shared skeleton list items used by both DeadlinesListSkeleton and RemindersListSkeleton.
 */
export default function SkeletonListItems({ extraActions }: SkeletonListItemsProps) {
  return (
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
            {extraActions}
          </div>
        </li>
      ))}
    </ul>
  );
}
