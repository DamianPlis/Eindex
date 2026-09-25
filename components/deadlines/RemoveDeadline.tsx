"use client";

import { useFormStatus } from "react-dom";
import { useMessages } from "@/components/i18n/UserSyncProvider";
import { useDeadlineActions } from "./DeadlineToastProvider";
import RemoveIcon from "@/icons/close.svg";
import s from "./Deadlines.module.css";
import u from "@/components/ui/shared.module.css";

function RemoveButton({ id }: { id: string }) {
  const { pendingIds } = useDeadlineActions();
  const messages = useMessages();
  const formStatus = useFormStatus();
  const pending = formStatus.pending || pendingIds.has(id);

  return (
    <button
      className={`${s.removeButton} ${pending ? u.pending : ""}`}
      title={messages.deadlines.actions.remove}
      aria-label={messages.deadlines.actions.remove}
      type="submit"
      disabled={pending}
      aria-busy={pending}
    >
      <RemoveIcon
        alt={messages.deadlines.actions.remove}
        fill="currentColor"
        width="1.25em"
        height="1.25em"
      />
    </button>
  );
}

function RemoveDeadline({ deadline }: { deadline: { id: string } }) {
  const { perform } = useDeadlineActions();
  return (
    <form
      action={async () => {
        await perform("remove", deadline.id);
      }}
    >
      <input type="hidden" name="id" value={deadline.id} />
      <RemoveButton id={deadline.id} />
    </form>
  );
}

export default RemoveDeadline;
