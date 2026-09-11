import SkeletonLine from "./SkeletonLine";
import SkeletonListItems from "./SkeletonListItems";
import sk from "./Skeletons.module.css";

export default function DeadlinesListSkeleton() {
  return (
    <>
      <div className={sk.deadlinesSkeletonToggle}>
        <SkeletonLine className={sk.skeletonToggleButton} />
      </div>
      <SkeletonListItems
        extraActions={
          <>
            <SkeletonLine className={sk.skeletonActionCircle} />
            <SkeletonLine className={sk.skeletonActionCircle} />
          </>
        }
      />
    </>
  );
}
