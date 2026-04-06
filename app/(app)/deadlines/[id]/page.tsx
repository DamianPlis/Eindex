import { redirect } from "next/navigation";
import { getPreferredLocale } from "@/lib/i18n/preference";
import { localizePath } from "@/lib/i18n/routing";
import { getSession } from "@/lib/session";

export default async function DeadlineDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ redirect?: string | string[] }>;
}) {
  const { id } = await params;
  const redirectParams = await searchParams;
  const redirectParam = Array.isArray(redirectParams?.redirect)
    ? redirectParams?.redirect[0]
    : redirectParams?.redirect;
  const session = await getSession();
  const locale = await getPreferredLocale(session);
  const detailPath = redirectParam
    ? localizePath(locale, `/deadlines/${id}?redirect=${encodeURIComponent(redirectParam)}`)
    : localizePath(locale, `/deadlines/${id}`);

  if (!session) {
    redirect(localizePath(locale, "/login"));
  }

  redirect(detailPath);
}
