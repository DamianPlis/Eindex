import SkeletonLine from "@/components/skeletons/SkeletonLine";
import s from "@/components/settings/settings.module.css";
import sk from "@/components/skeletons/Skeletons.module.css";

export default function LanguageSectionSkeleton() {
  return (
    <section className={s.section} aria-hidden="true">
      <div className={s.sectionHeading}>
        <SkeletonLine className={sk.settingsSkeletonHeading} />
        <SkeletonLine className={sk.settingsSkeletonPill} />
      </div>

      <div className={s.optionGrid}>
        {[0, 1, 2].map((index) => (
          <SkeletonLine
            key={`settings-language-skeleton-${index}`}
            className={sk.settingsSkeletonLanguageChoice}
          />
        ))}
      </div>
    </section>
  );
}
