"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { addDeadlineAction } from "@/app/(app)/actions";
import { useMessages } from "@/components/i18n/UserSyncProvider";
import CloseIcon from "@/icons/close_24dp_000000_FILL0_wght400_GRAD0_opsz24 (1).svg";
import DeadlineIcon from "@/icons/checklist_24dp_000000_FILL0_wght400_GRAD0_opsz24.svg";
import AddIcon from "@/icons/add_24dp_000000_FILL0_wght400_GRAD0_opsz24.svg";
import { useDeadlinesRefresh } from "@/components/deadlines/DeadlinesRefreshContext";
import s from "./Deadlines.module.css";
import u from "@/components/ui/shared.module.css";

function SubmitButton() {
  const { pending } = useFormStatus();
  const messages = useMessages();

  return (
    <button
      type="submit"
      className={`${u.primaryButton} ${pending ? u.pending : ""}`}
      disabled={pending}
      aria-busy={pending}
    >
      {messages.deadlines.add}
    </button>
  );
}

export default function AddDeadline() {
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
      <div className={s.deadlinesAddRow}>
        <button
          type="button"
          className={s.deadlinePlusButton}
          onClick={openModal}
          aria-label={messages.deadlines.openCreateModal}
          title={messages.deadlines.openCreateModal}
        >
          <AddIcon fill="currentColor" />
        </button>
      </div>

      {isOpen ? (
        <div
          className={u.modalOverlay}
          role="dialog"
          aria-modal="true"
          aria-label={messages.deadlines.createTitle}
        >
          <div className={u.modal}>
            <div className={u.modalHeader}>
              <div className={s.modalHeaderRow}>
                {messages.deadlines.createTitle}
                <DeadlineIcon fill="currentColor" />
              </div>
              <button
                type="button"
                className={u.transparentButton}
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
              className={s.addFormModal}
            >
              <div className={u.modalBody}>
                <input
                  type="text"
                  name="text"
                  placeholder={messages.deadlines.homeworkTitle}
                  className={`${u.formInput} ${s.addInputText}`}
                  required
                />
                <textarea
                  name="description"
                  placeholder={messages.deadlines.descriptionPlaceholder}
                  className={`${u.formInput} ${s.addInputDescription}`}
                  rows={4}
                />
                <input
                  type="date"
                  name="date"
                  className={`${u.formInput} ${s.addInputDate}`}
                  required
                  placeholder={messages.deadlines.dueDate}
                />
              </div>
              <div className={u.modalFooter}>
                <button
                  type="button"
                  className={u.cancelButton}
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
