"use client";

import { useState } from "react";
import type { AppMessages } from "@/lib/i18n/messages";
import ModalFooter from "@/components/planning/ModalFooter";
import CloseIcon from "@/icons/close_24dp_000000_FILL0_wght400_GRAD0_opsz24.svg";

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
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal">
        <div className="modal-header">
          <div className="font-bold">
            {title || messages.planning.addCustomSubjectTitle}
          </div>
          <button
            className="modal-close"
            type="button"
            onClick={handleClose}
            disabled={isPending}
            aria-label={messages.common.cancel}
          >
            <CloseIcon fill="currentColor" />
          </button>
        </div>

        <div className="modal-body">
          <label className="text-sm font-bold mb-1.5">
            {messages.planning.name}
          </label>
          <input
            className="slot-input mb-3 text-base"
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
