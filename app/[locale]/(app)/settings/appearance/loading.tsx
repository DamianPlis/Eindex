import AppearanceSectionSkeleton from "@/components/skeletons/settings/AppearanceSectionSkeleton";
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
