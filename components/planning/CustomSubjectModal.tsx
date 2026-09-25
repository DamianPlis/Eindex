"use client";

import { useState } from "react";
import type { AppMessages } from "@/lib/i18n/messages";
import ModalFooter from "@/components/planning/ModalFooter";
import CloseIcon from "@/icons/close.svg";
import u from "@/components/ui/shared.module.css";
import p from "@/components/pages/PlanningPageClient.module.css";

type CustomSubjectModalProps = {
  isOpen: boolean;
  isPending: boolean;
  messages: AppMessages;
  title?: string;
  onClose: () => void;
  onSave: (name: string, color: string) => void;
};

const DEFAULT_COLOR = "#64748b";

export default function CustomSubjectModal({
  isOpen,
  isPending,
  messages,
  title,
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
    <div className={u.modalOverlay} role="dialog" aria-modal="true">
      <div className={u.modal}>
        <div className={u.modalHeader}>
          <div className={u.modalHeaderTitle}>
            {title || messages.planning.addCustomSubjectTitle}
          </div>
          <button
            className={u.modalClose}
            type="button"
            onClick={handleClose}
            disabled={isPending}
            aria-label={messages.common.cancel}
          >
            <CloseIcon fill="currentColor" />
          </button>
        </div>

        <div className={u.modalBody}>
          <label className={p.formLabel}>{messages.planning.name}</label>
          <input
            className={`${u.formInput} ${p.formInputSpaced}`}
            value={customName}
            onChange={(event) => setCustomName(event.target.value)}
            placeholder={messages.planning.exampleSubject}
          />

          <label className={p.formLabel}>{messages.planning.color}</label>
          <div className={p.colorRow}>
            <input
              type="color"
              value={customColor}
              onChange={(event) => setCustomColor(event.target.value)}
            />
            <div className={p.colorLabel}>{customColor}</div>
          </div>
        </div>

        <ModalFooter
          messages={messages}
          isPending={isPending}
          onCancel={handleClose}
          onSave={handleSave}
        />
      </div>
    </div>
  );
}
