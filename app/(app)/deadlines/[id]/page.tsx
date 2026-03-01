import Link from "next/link";
import { notFound } from "next/navigation";
import { getUserState } from "@/lib/schedule/store";
import { requireSession } from "@/lib/session";

export default async function DeadlineDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();
  const state = await getUserState(session.uid);
  const item = state.deadlines.find((deadline) => deadline.id === id);

  if (!item) notFound();

  return (
    <main className="status-page">
      <section className="status-panel page-enter">
        <p className="status-code">Deadline</p>
        <h1 className="status-title">{item.text}</h1>
        <p className="status-copy">Due: {item.date}</p>
        <Link href="/deadlines" className="btn-secondary">
          Back to deadlines
        </Link>
      </section>
    </main>
  );
}
