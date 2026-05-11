"use client";

import CloseIcon from "@/icons/close_24dp_000000_FILL0_wght400_GRAD0_opsz24.svg";
import type { ReactNode } from "react";

type ConfirmDialogProps = {
  isOpen: boolean;
  isPending?: boolean;
  title: string;
  children: ReactNode;
  cancelLabel: string;
  confirmLabel: string;
  confirmClassName?: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function ConfirmDialog({
  isOpen,
  isPending = false,
  title,
  children,
  cancelLabel,
  confirmLabel,
  confirmClassName = "modal-save",
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="modal">
        <div className="modal-header">
          <div className="font-bold">{title}</div>
          <button
            className="modal-close"
            type="button"
            onClick={onCancel}
            disabled={isPending}
            aria-label={cancelLabel}
          >
            <CloseIcon fill="currentColor" />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        <div className="modal-footer">
          <button
            className="modal-cancel"
            type="button"
            onClick={onCancel}
            disabled={isPending}
          >
            {cancelLabel}
          </button>
          <button
            className={confirmClassName}
            type="button"
            onClick={onConfirm}
            disabled={isPending}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
