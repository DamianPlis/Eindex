"use client";

import SkeletonLine from "@/components/skeletons/SkeletonLine";
import s from "@/components/settings/settings.module.css";

export default function SubjectsSectionSkeleton() {
  return (
    <section className={s.subjectsSection} aria-hidden="true">
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
  );
}
