import { NextResponse } from "next/server";
import { getLunchWeekStart } from "@/lib/lunch/dates";
import { getLunchPerDay, LUNCH_MENU_UNAVAILABLE } from "@/lib/lunch/server";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ day: string }> },
) {
  const { day } = await params;
  const date = new Date(`${day}T00:00:00Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(day) ||
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== day
  ) {
    return NextResponse.json(
      { error: "Provide a valid date in YYYY-MM-DD format." },
      { status: 400 },
    );
  }

  const perDay = await getLunchPerDay(day, { publishedOnly: true });
  const meal = perDay[day];
  if (!meal || meal === LUNCH_MENU_UNAVAILABLE) {
    return NextResponse.json(
      { error: "No lunch found for this date." },
      { status: 404 },
    );
  }

  return NextResponse.json({
    weekStart: getLunchWeekStart(day),
    perDay,
    fetchedAt: Date.now(),
  });
}
