import { NextResponse } from "next/server";
import { getLunchDate, getLunchWeekStart } from "@/lib/lunch/dates";
import { getLunchPerDay } from "@/lib/lunch/server";

export async function GET() {
  const today = getLunchDate();
  return NextResponse.json({
    weekStart: getLunchWeekStart(today),
    perDay: await getLunchPerDay(today),
    fetchedAt: Date.now(),
  });
}
