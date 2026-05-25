import SubjectGroupsSectionSkeleton from "@/components/skeletons/settings/SubjectGroupsSectionSkeleton";
import SubjectsSectionSkeleton from "@/components/skeletons/settings/SubjectsSectionSkeleton";
import s from "@/components/settings/settings.module.css";

export default function SubjectsLoading() {
  return (
    <div className={s.page}>
      <div className={s.container}>
        <SubjectGroupsSectionSkeleton />
        <SubjectsSectionSkeleton />
      </div>
    </div>
  );
}
