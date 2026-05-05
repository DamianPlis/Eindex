"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { addDeadlineAction } from "@/app/(app)/actions";
import { useMessages } from "@/components/i18n/LocaleProvider";
import CloseIcon from "@/icons/close_24dp_000000_FILL0_wght400_GRAD0_opsz24 (1).svg";
import DeadlineIcon from "@/icons/checklist_24dp_000000_FILL0_wght400_GRAD0_opsz24.svg";
import AddIcon from "@/icons/add_24dp_000000_FILL0_wght400_GRAD0_opsz24.svg";
import { useDeadlinesRefresh } from "@/components/deadlines/DeadlinesRefreshContext";

function SubmitButton() {
  const { pending } = useFormStatus();
  const messages = useMessages();

  return (
    <button
      type="submit"
      className={`add-button ${pending ? "pending" : ""}`}
      disabled={pending}
      aria-busy={pending}
    >
      {messages.deadlines.add}
    </button>
  );
}

export default function AddDeadlinePending() {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const messages = useMessages();
  const { refreshDeadlines } = useDeadlinesRefresh();

  function openModal() {
    setIsOpen(true);
  }

  function closeModal() {
    setIsOpen(false);
  }

  return (
    <>
      <div className="deadlines-add-row">
        <button
          type="button"
          className="flex items-center justify-center deadline-plus-button"
          onClick={openModal}
          aria-label={messages.deadlines.openCreateModal}
          title={messages.deadlines.openCreateModal}
        >
          <AddIcon fill="currentColor" />
        </button>
      </div>

      {isOpen ? (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={messages.deadlines.createTitle}
        >
          <div className="modal">
            <div className="modal-header">
              <div className="flex items-center gap-2 font-bold">
                {messages.deadlines.createTitle}
                <DeadlineIcon fill="currentColor" />
              </div>
              <button
                type="button"
                className="bg-transparent border-none"
                onClick={closeModal}
              >
                <CloseIcon fill="currentColor" />
              </button>
            </div>

            <form
              ref={formRef}
              action={async (formData) => {
                await addDeadlineAction(formData);
                formRef.current?.reset();
                closeModal();
                refreshDeadlines();
              }}
              className="add-form add-form-modal"
            >
              <div className="modal-body">
                <input
                  type="text"
                  name="text"
                  placeholder={messages.deadlines.homeworkTitle}
                  className="add-input add-input-text"
                  required
                />
                <textarea
                  name="description"
                  placeholder={messages.deadlines.descriptionPlaceholder}
                  className="add-input add-input-description"
                  rows={4}
                />
                <input
                  type="date"
                  name="date"
                  className="add-input add-input-date"
                  required
                  placeholder={messages.deadlines.dueDate}
                />
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="modal-cancel"
                  onClick={closeModal}
                >
                  {messages.common.cancel}
                </button>
                <SubmitButton />
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
