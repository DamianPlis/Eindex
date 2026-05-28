import SkeletonLine from "@/components/skeletons/SkeletonLine";
import sk from "./Skeletons.module.css";
import u from "@/components/ui/shared.module.css";

export default function DeadlineDetailPageSkeleton({}) {
  return (
    <>
      <>
        <div className={u.container} style={{ margin: 16 }}>
          <SkeletonLine className={sk.skeletonPill} />
          <br />
          <div className={sk.deadlinesSkeletonText}>
            <SkeletonLine className={sk.textLineLg} />
            <SkeletonLine className={`${sk.mb1} ${sk.planningSkeletonDayName}`} />
            <SkeletonLine className={`${sk.mb4} ${sk.planningSkeletonDayDate}`} />

            <SkeletonLine className={sk.textLineLg} />
            <SkeletonLine className={`${sk.mb2} ${sk.textLineMd}`} />
            <SkeletonLine className={`${sk.mb2} ${sk.textLineMd}`} />
            <SkeletonLine className={`${sk.mb2} ${sk.textLineMd}`} />
            <SkeletonLine className={`${sk.mb6} ${sk.textLineMd}`} />

            <SkeletonLine className={sk.textLineShortLg} />
          </div>
        </div>
      </>
    </>
  );
}
