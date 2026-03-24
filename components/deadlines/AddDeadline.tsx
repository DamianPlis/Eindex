"use client";

import { useRef } from "react";
import { useFormStatus } from "react-dom";
import { addDeadlineAction } from "@/app/(app)/actions";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className={`add-button ${pending ? "pending" : ""}`} disabled={pending} aria-busy={pending}>
      Add
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
      className="add-form"
    >
      <input
        type="text"
        name="text"
        placeholder="Homework description"
        className="add-input add-input-text"
        required
      />
      <input type="date" name="date" className="add-input add-input-date" required />
      <SubmitButton />
    </form>
  );
}
