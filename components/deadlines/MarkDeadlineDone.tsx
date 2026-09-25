"use client";

import { useFormStatus } from "react-dom";
import { useMessages } from "@/components/i18n/UserSyncProvider";
import { useDeadlineActions } from "./DeadlineToastProvider";
import Check from "@/icons/check.svg";
import s from "./Deadlines.module.css";
import u from "@/components/ui/shared.module.css";

function DoneButton({ id }: { id: string }) {
  const { pendingIds } = useDeadlineActions();
  const messages = useMessages();
  const formStatus = useFormStatus();
  const pending = formStatus.pending || pendingIds.has(id);

  return (
    <button
      className={`${s.doneButton} ${pending ? u.pending : ""}`}
      title={messages.deadlines.actions.markDone}
      aria-label={messages.deadlines.actions.markDone}
      type="submit"
      disabled={pending}
      aria-busy={pending}
    >
      <Check
        alt={messages.deadlines.actions.markDone}
        fill="currentColor"
        width="1.25em"
        height="1.25em"
      />
    </button>
  );
}

function MarkDeadlineDone({ deadline }: { deadline: { id: string } }) {
  const { perform } = useDeadlineActions();
  return (
    <form
      action={async () => {
        await perform("done", deadline.id);
      }}
    >
      <input type="hidden" name="id" value={deadline.id} />
      <DoneButton id={deadline.id} />
    </form>
  );
}

export default MarkDeadlineDone;
