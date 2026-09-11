import SkeletonLine from "@/components/skeletons/SkeletonLine";
import dp from "@/app/[locale]/(app)/deadlines/DeadlinesPage.module.css";
import sk from "./Skeletons.module.css";

export default function DeadlineDetailPageSkeleton() {
  return (
    <div className={dp.detailContainer} aria-hidden="true">
      <div className={dp.backLink}>
        <SkeletonLine style={{ width: 180, height: 16 }} />
      </div>
      <div className={dp.detailCard}>
        <div className={dp.detailHeader}>
          <div className={dp.detailHeading}>
            <div className={dp.detailMeta}>
              <SkeletonLine className={sk.skeletonPill} />
            </div>
            <SkeletonLine style={{ width: "85%", height: 36 }} />
          </div>
          <div className={dp.detailDuePanel}>
            <SkeletonLine
              style={{ flex: "0 0 40px", height: 40, borderRadius: 12 }}
            />
            <div className={dp.detailDueContent} style={{ flex: 1 }}>
              <SkeletonLine
                style={{ width: "40%", height: 12, marginBottom: 10 }}
              />
              <SkeletonLine
                style={{ width: "100%", height: 20, marginBottom: 8 }}
              />
              <SkeletonLine style={{ width: "60%", height: 14 }} />
            </div>
          </div>
        </div>
        <div className={dp.detailDescriptionBlock}>
          <SkeletonLine style={{ width: 100, height: 16, marginBottom: 20 }} />
          <SkeletonLine
            style={{ width: "90%", height: 14, marginBottom: 12 }}
          />
          <SkeletonLine
            style={{ width: "80%", height: 14, marginBottom: 12 }}
          />
          <SkeletonLine style={{ width: "60%", height: 14 }} />
        </div>
      </div>
    </div>
  );
}
