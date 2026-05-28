import { getRequestMessages } from "@/lib/i18n/server";
import e from "@/app/ErrorPage.module.css";
import s from "@/components/ui/shared.module.css";

export default async function LocaleLoading() {
  const messages = await getRequestMessages();

  return (
    <div className={`${s.container} ${e.loadingContainer}`}>
      {messages.common.loading}
    </div>
  );
}
