import SkeletonLine from "@/components/skeletons/SkeletonLine";
import s from "@/components/settings/settings.module.css";
import sk from "@/components/skeletons/Skeletons.module.css";

export default function SubjectGroupsSectionSkeleton() {
  return (
    <section
      className={s.subjectsSection}
      style={{ marginTop: "2rem" }}
      aria-hidden="true"
    >
      <div className={s.subjectsListHeader}>
        <SkeletonLine className={sk.settingsSkeletonHeading} />
        <SkeletonLine className={sk.skeletonActionCircle} />
      </div>

      <div className={s.subjectsList}>
        {[0, 1, 2].map((index) => (
          <div
            key={`settings-subgroup-skeleton-${index}`}
            className={s.subjectItem}
            style={{
              flexWrap: "wrap",
              alignItems: "flex-start",
              padding: "12px",
            }}
          >
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <SkeletonLine className={`${sk.textLineMd} ${sk.noMargin}`} />
              <SkeletonLine className={`${sk.textLineSm} ${sk.noMargin}`} />
            </div>

            <div className={s.subjectActions}>
              <SkeletonLine className={sk.skeletonPill} />
              <SkeletonLine className={sk.skeletonPill} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
