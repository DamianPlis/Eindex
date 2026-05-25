import SubjectGroupsSectionSkeleton from "@/components/skeletons/SubjectGroupsSectionSkeleton";
import SubjectsSectionSkeleton from "@/components/skeletons/SubjectsSectionSkeleton";
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
