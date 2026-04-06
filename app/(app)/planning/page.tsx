import { redirect } from "next/navigation";
import { getPreferredLocale } from "@/lib/i18n/preference";
import { localizePath } from "@/lib/i18n/routing";
import { getSession } from "@/lib/session";

export default async function PlanningPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const session = await getSession();
  const locale = await getPreferredLocale(session);
  const params = await searchParams;
  const planningPath = params.week
    ? localizePath(locale, `/planning?week=${encodeURIComponent(params.week)}`)
    : localizePath(locale, "/planning");

  if (!session) {
    redirect(localizePath(locale, "/login"));
  }

  redirect(planningPath);
}
