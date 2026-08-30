import type { Metadata } from "next";
import PlanningPageClient from "@/components/pages/PlanningPageClient";
import { buildDaysForWeek, normalizeWeekKey } from "@/lib/schedule/defaults";
import { requireSession } from "@/lib/session";
import { assertLocale } from "@/lib/i18n/server";
import { Suspense } from "react";
import PlanningPageSkeleton from "@/components/skeletons/PlanningPageSkeleton";
import { generatePageMetadata } from "@/lib/metadata";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  assertLocale(locale);
  return generatePageMetadata({ page: "planning", locale, path: "/planning" });
}

function shiftWeek(weekISO: string, deltaWeeks: number) {
  const date = new Date(weekISO);
  date.setDate(date.getDate() + deltaWeeks * 7);
  return normalizeWeekKey(date.toISOString());
}

export default async function LocalePlanningPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ week?: string }>;
}) {
  assertLocale((await params).locale);
  const query = await searchParams;
  const weekStart = normalizeWeekKey(query.week);

  return (
    <Suspense key={`planning-${weekStart}`} fallback={<PlanningPageSkeleton />}>
      <PlanningPageContent weekStart={weekStart} />
    </Suspense>
  );
}

async function PlanningPageContent({ weekStart }: { weekStart: string }) {
  await requireSession();
  const token = await convexAuthNextjsToken();
  const [weekData, subjects] = await Promise.all([
    fetchQuery(
      api.schedule.getWeekSchedule,
      { weekStart },
      { token: token || undefined },
    ),
    fetchQuery(api.subjects.getSubjects, {}, { token: token || undefined }),
  ]);

  const builtDays = buildDaysForWeek(weekStart);
  if (weekData && weekData.slots) {
    for (const slot of weekData.slots) {
      if (builtDays[slot.dayIndex]?.slots?.[slot.slotIndex]) {
        const target = builtDays[slot.dayIndex].slots[slot.slotIndex];
        target.subjectId = slot.subjectId || null;
        target.topic = slot.topic || "";
        target.updatedAt = slot.updatedAt || 0;
      }
    }
  }

  const mappedSubjects =
    subjects && subjects.length > 0
      ? subjects.map((s) => ({ id: s.slug, name: s.name, color: s.color }))
      : [];

  return (
    <PlanningPageClient
      weekStart={weekStart}
      currentWeekStart={normalizeWeekKey()}
      prevWeek={shiftWeek(weekStart, -1)}
      nextWeek={shiftWeek(weekStart, 1)}
      days={builtDays}
      subjects={mappedSubjects}
    />
  );
}
