"use client";

import SkeletonLine from "@/components/skeletons/SkeletonLine";
import s from "@/components/settings/settings.module.css";

export default function LanguageSectionSkeleton() {
  return (
    <section className={s.section} aria-hidden="true">
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
  );
}
