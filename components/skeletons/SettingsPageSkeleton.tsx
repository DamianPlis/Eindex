import SkeletonLine from "@/components/skeletons/SkeletonLine";
import s from "@/components/settings/settings.module.css";

export default function SettingsPageSkeleton() {
  return (
    <div className={s.page} aria-hidden="true">
      <div className={s.container}>
        <section className={s.section}>
          <div className={s.sectionHeading}>
            <SkeletonLine className="settings-skeleton-heading" />
            <SkeletonLine className="settings-skeleton-pill" />
          </div>
          <div className={s.optionGridCompact}>
            <SkeletonLine className="settings-skeleton-choice" />
            <SkeletonLine className="settings-skeleton-choice" />
          </div>
        </section>

        <section className={s.section}>
          <div className={s.sectionHeading}>
            <SkeletonLine className="settings-skeleton-heading" />
            <SkeletonLine className="settings-skeleton-pill" />
          </div>
          <div className={s.optionGrid}>
            {[0, 1, 2].map((index) => (
              <SkeletonLine
                key={`settings-language-skeleton-${index}`}
                className="settings-skeleton-language-choice"
              />
            ))}
          </div>
        </section>

        <section className={s.subjectsSection}>
          <div className={s.subjectsListHeader}>
            <SkeletonLine className="settings-skeleton-heading" />
            <SkeletonLine className="skeleton-action-circle" />
          </div>
          <div className={s.subjectsList}>
            {[0, 1, 2, 3, 4].map((index) => (
              <div
                key={`settings-subject-skeleton-${index}`}
                className={`${s.subjectItem} settings-skeleton-subject`}
              >
                <div className="settings-skeleton-input-container">
                  <SkeletonLine className="skeleton-action-circle" />
                  <SkeletonLine className="skeleton-text-line-md" />
                </div>
                <div className={s.subjectActions}>
                  <SkeletonLine className="skeleton-pill" />
                  <SkeletonLine className="skeleton-pill" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
