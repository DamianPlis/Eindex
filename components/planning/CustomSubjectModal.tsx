"use client";

import { useState } from "react";
import type { AppMessages } from "@/lib/i18n/messages";

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
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal">
        <div className="modal-header">
          <div style={{ fontWeight: 800 }}>{messages.planning.addCustomSubjectTitle}</div>
          <button className="modal-save" onClick={handleSave} disabled={isPending}>
            {messages.common.save}
          </button>
        </div>

        <div className="modal-body">
          <label style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{messages.planning.name}</label>
          <input
            className="slot-input"
            style={{ marginBottom: 12, fontSize: 16 }}
            value={customName}
            onChange={(event) => setCustomName(event.target.value)}
            placeholder={messages.planning.exampleSubject}
          />

          <label style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{messages.planning.color}</label>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input type="color" value={customColor} onChange={(event) => setCustomColor(event.target.value)} />
            <div style={{ fontSize: 13 }}>{customColor}</div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="modal-cancel" onClick={handleClose} disabled={isPending}>
            {messages.common.cancel}
          </button>
        </div>
      </div>
    </div>
  );
}
