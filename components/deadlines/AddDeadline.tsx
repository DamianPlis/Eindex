"use client";

import { useRef } from "react";
import { useFormStatus } from "react-dom";
import { addDeadlineAction } from "@/app/(app)/actions";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className="btn-primary deadline-add-submit"
      disabled={pending}
      aria-busy={pending}
    >
      {pending ? "Adding..." : "Add"}
    </button>
  );
}

export default function AddDeadlinePending() {
  const formRef = useRef<HTMLFormElement | null>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await addDeadlineAction(formData);
        formRef.current?.reset();
      }}
      className="deadline-add-form"
    >
      <input
        type="text"
        name="text"
        placeholder="Homework description"
        className="field-control field-text"
        required
      />
      <input type="date" name="date" className="field-control field-date" required />
      <SubmitButton />
    </form>
  );
}
