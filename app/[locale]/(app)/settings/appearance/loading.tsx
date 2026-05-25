import AppearanceSectionSkeleton from "@/components/skeletons/AppearanceSectionSkeleton";
import s from "@/components/settings/settings.module.css";

export default function AppearanceLoading() {
  return (
    <div className={s.page}>
      <div className={s.container}>
        <AppearanceSectionSkeleton />
      </div>
    </div>
  );
}
