"use client";

import SkeletonLine from "@/components/skeletons/SkeletonLine";
import s from "@/components/settings/settings.module.css";
import sk from "@/components/skeletons/Skeletons.module.css";

export default function AppearanceSectionSkeleton() {
  return (
    <section className={s.section} aria-hidden="true">
      <div className={s.sectionHeading}>
        <SkeletonLine className={sk.settingsSkeletonHeading} />
        <SkeletonLine className={sk.settingsSkeletonPill} />
      </div>

      <div className={s.optionGridCompact}>
        <SkeletonLine className={sk.settingsSkeletonChoice} />
        <SkeletonLine className={sk.settingsSkeletonChoice} />
      </div>
    </section>
  );
}
