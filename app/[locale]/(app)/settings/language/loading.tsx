import LanguageSectionSkeleton from "@/components/skeletons/settings/LanguageSectionSkeleton";
import s from "@/components/settings/settings.module.css";

export default function LanguageLoading() {
  return (
    <div className={s.page}>
      <div className={s.container}>
        <LanguageSectionSkeleton />
      </div>
    </div>
  );
}
