import Link from "next/link";
import { notFound } from "next/navigation";
import { getUserState } from "@/lib/schedule/store";
import { requireSession } from "@/lib/session";
import StatusPill from "@/components/deadlines/StatusPill";
import { isoDate } from "@/lib/schedule/defaults";

export default async function DeadlineDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { redirect?: string | string[] };
}) {
  const { id } =  await params;
  const redirectParams = await searchParams;
  const redirectParam =  Array.isArray(redirectParams?.redirect)
    ? redirectParams?.redirect[0]
    : redirectParams?.redirect;
  const session = await requireSession();
  const state = await getUserState(session.uid);
  const item = state.deadlines.find((deadline) => deadline.id === id);

  if (!item) notFound();

  const todayISO = isoDate(new Date());
  const isExpired = item.date < todayISO;
  const isToday = item.date === todayISO;
  const backHref = redirectParam === "main" ? "/" : "/deadlines";
  const backLabel = redirectParam === "main" ? "Home Page" : "Deadlines";
  
  return (
    <div className="container" style={{ margin: "16px" }}>
      <StatusPill status={isExpired ? "expired" : isToday ? "today" : "upcoming"} />
      <h2>{item.text}</h2>
      <p>Due: {item.date}</p>
      <Link href={backHref} className="inline-link">
        Back to {backLabel}
      </Link>
    </div>
  );
}
