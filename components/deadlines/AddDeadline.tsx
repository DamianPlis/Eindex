"use client";

import { useRef } from "react";
import { useFormStatus } from "react-dom";
import { addDeadlineAction } from "@/app/(app)/actions";
import { useMessages } from "@/components/i18n/LocaleProvider";

function SubmitButton() {
  const { pending } = useFormStatus();
  const messages = useMessages();

  return (
    <button type="submit" className={`add-button ${pending ? "pending" : ""}`} disabled={pending} aria-busy={pending}>
      {messages.deadlines.add}
    </button>
  );
}

export default function AddDeadlinePending() {
  const formRef = useRef<HTMLFormElement | null>(null);
  const messages = useMessages();

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
        placeholder={messages.deadlines.homeworkDescription}
        className="add-input add-input-text"
        required
      />
      <input type="date" name="date" className="add-input add-input-date" required />
      <SubmitButton />
    </form>
  );
}
