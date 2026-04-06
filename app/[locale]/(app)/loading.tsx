import { getRequestMessages } from "@/lib/i18n/server";

export default async function LocaleLoading() {
  const messages = await getRequestMessages();

  return (
    <div className="container" style={{ margin: "16px" }}>
      {messages.common.loading}
    </div>
  );
}
