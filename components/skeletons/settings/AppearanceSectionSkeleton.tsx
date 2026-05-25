"use client";

import SkeletonLine from "@/components/skeletons/SkeletonLine";
import s from "@/components/settings/settings.module.css";

export default function AppearanceSectionSkeleton() {
  return (
    <section className={s.section} aria-hidden="true">
      <div className={s.sectionHeading}>
        <SkeletonLine className="settings-skeleton-heading" />
        <SkeletonLine className="settings-skeleton-pill" />
      </div>

      <div className={s.optionGridCompact}>
        <SkeletonLine className="settings-skeleton-choice" />
        <SkeletonLine className="settings-skeleton-choice" />
      </div>
    </section>
  );
}
