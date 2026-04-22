import { redirect } from "next/navigation";
import { localizePath } from "@/lib/i18n/routing";
import { getPreferredLocale } from "@/lib/i18n/preference";
import { getSession } from "@/lib/session";

export default async function MainPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const session = await getSession();
  const locale = await getPreferredLocale(session);
  const params = await searchParams;

  if (!session) {
    redirect(localizePath(locale, "/login"));
  }

  const mainPath = params.date
    ? localizePath(locale, `/?date=${encodeURIComponent(params.date)}`)
    : localizePath(locale, "/");

  redirect(mainPath);
}
