"use client";

import SkeletonLine from "@/components/skeletons/SkeletonLine";
import s from "@/components/settings/settings.module.css";

export default function SubjectGroupsSectionSkeleton() {
  return (
    <section
      className={s.subjectsSection}
      style={{ marginTop: "2rem" }}
      aria-hidden="true"
    >
      <div className={s.subjectsListHeader}>
        <SkeletonLine className="settings-skeleton-heading" />
        <SkeletonLine className="skeleton-action-circle" />
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
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
              <SkeletonLine className="skeleton-text-line-md" style={{ margin: 0 }} />
              <SkeletonLine className="skeleton-text-line-sm" style={{ margin: 0 }} />
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
