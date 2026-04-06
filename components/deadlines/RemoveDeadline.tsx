"use client"

import { useFormStatus } from "react-dom";
import { useMessages } from "@/components/i18n/LocaleProvider";
import { removeDeadlineAction } from "@/app/(app)/actions"
import RemoveIcon from "@/icons/close_24dp_000000_FILL0_wght400_GRAD0_opsz24.svg"

function RemoveButton() {
    const messages = useMessages();
    const formStatus = useFormStatus();
    const { pending } = formStatus;


    return (        
      <button className={`deadline-action-button remove-button ${pending ? "pending" : ""}`} type="submit" disabled={pending} aria-busy={pending}>
        <RemoveIcon alt={messages.deadlines.actions.remove} fill="currentColor" width="1.25em" height="1.25em" />
      </button>
    )
}

function RemoveDeadline({ deadline }: { deadline: { id: string } }) {
  return (
    <form action={removeDeadlineAction}>
        <input type="hidden" name="id" value={deadline.id} />
        <RemoveButton />
    </form>
  )
}

export default RemoveDeadline
