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
    <div className="container" style={{ margin: "16px" }}>
      <h2>{item.text}</h2>
      <p>Due: {item.date}</p>
      <Link href="/deadlines" className="inline-link">
        Back to deadlines
      </Link>
    </div>
  );
}
