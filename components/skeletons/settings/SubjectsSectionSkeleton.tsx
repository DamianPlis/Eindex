import SkeletonLine from "@/components/skeletons/SkeletonLine";
import s from "@/components/settings/settings.module.css";
import sk from "@/components/skeletons/Skeletons.module.css";

export default function SubjectsSectionSkeleton() {
  return (
    <>
      <section className={s.section} aria-hidden="true">
        <div className={s.sectionHeading}>
          <SkeletonLine className={sk.settingsSkeletonHeading} />
        </div>
        <div className={s.subjectSortDescription}>
          <SkeletonLine className={sk.textLineLongMd} />
          <SkeletonLine className={sk.textLineLongMd} />
        </div>
        <SkeletonLine style={{ width: "100%", height: 40, borderRadius: 8 }} />
      </section>
      <section className={s.subjectsSection} aria-hidden="true">
        <div className={s.subjectsListHeader}>
          <SkeletonLine className={sk.settingsSkeletonHeading} />
          <SkeletonLine className={sk.skeletonActionCircle} />
        </div>

        <div className={s.subjectsList}>
          {[0, 1, 2, 3, 4].map((index) => (
            <div
              key={`settings-subject-skeleton-${index}`}
              className={`${s.subjectItem} ${sk.settingsSkeletonSubject}`}
            >
              <div className={sk.settingsSkeletonInputContainer}>
                <SkeletonLine className={sk.skeletonActionCircle} />
                <SkeletonLine className={sk.textLineMd} />
              </div>
              <div className={s.subjectActions}>
                <SkeletonLine className={sk.skeletonPill} />
                <SkeletonLine className={sk.skeletonPill} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
