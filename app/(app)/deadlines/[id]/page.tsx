import Link from "next/link";
import { notFound } from "next/navigation";
import { getUserState } from "@/lib/schedule/store";
import { requireSession } from "@/lib/session";
import StatusPill from "@/components/deadlines/StatusPill";
import { formatDeadlineRelativeLabel } from "@/lib/schedule/selectors";

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

  const backHref = redirectParam === "main" ? "/" : "/deadlines";
  const backLabel = redirectParam === "main" ? "Home Page" : "Deadlines";
  
  return (
    <div className="container" style={{ margin: "16px" }}>
      <StatusPill status={item.status} />
      <h2>{item.text}</h2>
      <p style={{marginBottom: 0}}>Due: {item.date}
      </p>
        <div style={{marginBottom: "1em"}} className="reminder-date reminder-relative-date">{formatDeadlineRelativeLabel(item.date)}</div>
      <Link href={backHref} className="inline-link">
        Back to {backLabel}
      </Link>
    </div>
  );
}
