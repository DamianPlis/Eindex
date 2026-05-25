"use client";

import SkeletonLine from "@/components/skeletons/SkeletonLine";
import s from "@/components/settings/settings.module.css";

export default function StatisticsSectionSkeleton() {
  return (
    <section className={s.section} aria-hidden="true">
      <div className={s.sectionHeading}>
        <SkeletonLine className="settings-skeleton-heading" />
      </div>

      <div className={s.toggleRow}>
        <div className={s.toggleText} style={{ width: "80%", display: "flex", flexDirection: "column", gap: "6px" }}>
          <SkeletonLine className="skeleton-text-line-sm" style={{ margin: 0 }} />
          <SkeletonLine className="skeleton-text-line-long-md" style={{ margin: 0 }} />
        </div>
        <SkeletonLine className="skeleton-toggle-button" style={{ width: "48px", height: "28px", borderRadius: "999px", margin: 0 }} />
      </div>
    </section>
  );
}
