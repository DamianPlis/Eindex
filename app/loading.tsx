import e from "@/app/ErrorPage.module.css";
import s from "@/components/ui/shared.module.css";

export default function Loading() {
  return (
    <div className={`${s.container} ${e.loadingContainer}`}>Loading...</div>
  );
}
