"use client";

import { useFormStatus } from "react-dom";
import { useMessages } from "@/components/i18n/LocaleProvider";
import { markAsDoneDeadlineAction } from "@/app/(app)/actions";
import { useDeadlinesRefresh } from "@/components/deadlines/DeadlinesRefreshContext";
import Check from "@/icons/check_24dp_000000_FILL0_wght400_GRAD0_opsz24.svg";

function DoneButton() {
  const messages = useMessages();
  const formStatus = useFormStatus();
  const { pending } = formStatus;

  return (
    <button
      className={`deadline-action-button done-button ${pending ? "pending" : ""}`}
      title={messages.deadlines.actions.markDone}
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
  const { refreshDeadlines } = useDeadlinesRefresh();
  return (
    <form
      action={async (formData) => {
        await markAsDoneDeadlineAction(formData);
        refreshDeadlines();
      }}
    >
      <input type="hidden" name="id" value={deadline.id} />
      <DoneButton />
    </form>
  );
}

export default MarkDeadlineDone;
