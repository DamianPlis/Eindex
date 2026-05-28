"use client";

import SkeletonLine from "@/components/skeletons/SkeletonLine";
import s from "@/components/settings/settings.module.css";
import sk from "@/components/skeletons/Skeletons.module.css";

export default function StatisticsSectionSkeleton() {
  return (
    <section className={s.section} aria-hidden="true">
      <div className={s.sectionHeading}>
        <SkeletonLine className={sk.settingsSkeletonHeading} />
      </div>

      <div className={s.toggleRow}>
        <div className={s.toggleText} style={{ width: "80%", display: "flex", flexDirection: "column", gap: "6px" }}>
          <SkeletonLine className={`${sk.textLineSm} ${sk.noMargin}`} />
          <SkeletonLine className={`${sk.textLineLongMd} ${sk.noMargin}`} />
        </div>
        <SkeletonLine className={sk.skeletonToggleButton} style={{ width: "48px", height: "28px", borderRadius: "999px", margin: 0 }} />
      </div>
    </section>
  );
}
