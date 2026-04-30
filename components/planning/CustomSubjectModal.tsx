"use client";

import { useState } from "react";
import type { AppMessages } from "@/lib/i18n/messages";
import styles from "@/css/planning.module.css";

type CustomSubjectModalProps = {
  isOpen: boolean;
  isPending: boolean;
  messages: AppMessages;
  onClose: () => void;
  onSave: (name: string, color: string) => void;
};

const DEFAULT_COLOR = "#64748b";

export default function CustomSubjectModal({
  isOpen,
  isPending,
  messages,
  onClose,
  onSave,
}: CustomSubjectModalProps) {
  const [customName, setCustomName] = useState("");
  const [customColor, setCustomColor] = useState(DEFAULT_COLOR);

  if (!isOpen) return null;

  function handleClose() {
    setCustomName("");
    setCustomColor(DEFAULT_COLOR);
    onClose();
  }

  function handleSave() {
    const name = customName.trim();
    if (!name) return;
    onSave(name, customColor);
    setCustomName("");
    setCustomColor(DEFAULT_COLOR);
  }

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <div className="font-bold">
            {messages.planning.addCustomSubjectTitle}
          </div>
          <button
            className={styles.modalSave}
            onClick={handleSave}
            disabled={isPending}
          >
            {messages.common.save}
          </button>
        </div>

        <div className={styles.modalBody}>
          <label className="text-sm font-bold mb-1.5">
            {messages.planning.name}
          </label>
          <input
            className={`${styles.slotInput} mb-3 text-base`}
            value={customName}
            onChange={(event) => setCustomName(event.target.value)}
            placeholder={messages.planning.exampleSubject}
          />

          <label className="text-sm font-bold mb-1.5">
            {messages.planning.color}
          </label>
          <div className="flex gap-2 items-center">
            <input
              type="color"
              value={customColor}
              onChange={(event) => setCustomColor(event.target.value)}
            />
            <div className="text-sm">{customColor}</div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button
            className={styles.modalCancel}
            onClick={handleClose}
            disabled={isPending}
          >
            {messages.common.cancel}
          </button>
        </div>
      </div>
    </div>
  );
}
