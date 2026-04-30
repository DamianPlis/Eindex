"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { addDeadlineAction } from "@/app/(app)/actions";
import { useMessages } from "@/components/i18n/LocaleProvider";
import CloseIcon from "@/icons/close_24dp_000000_FILL0_wght400_GRAD0_opsz24 (1).svg";
import DeadlineIcon from "@/icons/checklist_24dp_000000_FILL0_wght400_GRAD0_opsz24.svg";
import AddIcon from "@/icons/add_24dp_000000_FILL0_wght400_GRAD0_opsz24.svg";
import styles from "@/css/Deadlines.module.css";
import planningStyles from "@/css/planning.module.css";

function SubmitButton() {
  const { pending } = useFormStatus();
  const messages = useMessages();

  return (
    <button
      type="submit"
      className={`${planningStyles.addButton} ${pending ? styles.pending : ""}`}
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

  function openModal() {
    setIsOpen(true);
  }

  function closeModal() {
    setIsOpen(false);
  }

  return (
    <>
      <div className={styles.deadlinesAddRow}>
        <button
          type="button"
          className={`flex items-center justify-center ${styles.deadlinePlusButton}`}
          onClick={openModal}
          aria-label={messages.deadlines.openCreateModal}
          title={messages.deadlines.openCreateModal}
        >
          <AddIcon fill="currentColor" />
        </button>
      </div>

      {isOpen ? (
        <div
          className={planningStyles.modalOverlay}
          role="dialog"
          aria-modal="true"
          aria-label={messages.deadlines.createTitle}
        >
          <div className={planningStyles.modal}>
            <div className={planningStyles.modalHeader}>
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
              }}
              className={`${styles.addForm} ${styles.addFormModal}`}
            >
              <div className={planningStyles.modalBody}>
                <input
                  type="text"
                  name="text"
                  placeholder={messages.deadlines.homeworkTitle}
                  className={`${planningStyles.addInput} ${styles.addInputText}`}
                  required
                />
                <textarea
                  name="description"
                  placeholder={messages.deadlines.descriptionPlaceholder}
                  className={`${planningStyles.addInput} ${styles.addInputDescription}`}
                  rows={4}
                />
                <input
                  type="date"
                  name="date"
                  className={`${planningStyles.addInput} ${styles.addInputDate}`}
                  required
                  placeholder={messages.deadlines.dueDate}
                />
              </div>
              <div className={planningStyles.modalFooter}>
                <button
                  type="button"
                  className={planningStyles.modalCancel}
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
