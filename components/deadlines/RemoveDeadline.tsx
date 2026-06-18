"use client";

import { useFormStatus } from "react-dom";
import { useMessages } from "@/components/i18n/UserSyncProvider";
import { removeDeadlineAction } from "@/app/(app)/actions";
import { useDeadlinesRefresh } from "@/components/deadlines/DeadlinesRefreshContext";
import RemoveIcon from "@/icons/close_24dp_000000_FILL0_wght400_GRAD0_opsz24.svg";
import s from "./Deadlines.module.css";
import u from "@/components/ui/shared.module.css";

function RemoveButton() {
  const messages = useMessages();
  const formStatus = useFormStatus();
  const { pending } = formStatus;

  return (
    <button
      className={`${s.removeButton} ${pending ? u.pending : ""}`}
      title={messages.deadlines.actions.remove}
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
  const { refreshDeadlines } = useDeadlinesRefresh();
  return (
    <form
      action={async (formData) => {
        await removeDeadlineAction(formData);
        refreshDeadlines();
      }}
    >
      <input type="hidden" name="id" value={deadline.id} />
      <RemoveButton />
    </form>
  );
}

export default RemoveDeadline;
