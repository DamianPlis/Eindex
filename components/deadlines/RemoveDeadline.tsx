"use client";

import { useFormStatus } from "react-dom";
import { removeDeadlineAction } from "@/app/(app)/actions";

function RemoveButton() {
  const formStatus = useFormStatus();
  const { pending } = formStatus;

  return (
    <button
      className="btn-danger remove-button"
      type="submit"
      disabled={pending}
      aria-busy={pending}
      aria-label="Remove deadline"
    >
      {pending ? "Removing..." : "Remove"}
    </button>
  );
}

function RemoveDeadline({ deadline }: { deadline: { id: string } }) {
  return (
    <form action={removeDeadlineAction} className="remove-inline-form">
      <input type="hidden" name="id" value={deadline.id} />
      <RemoveButton />
    </form>
  );
}

export default RemoveDeadline;
