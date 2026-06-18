"use client";

import CloseIcon from "@/icons/close_24dp_000000_FILL0_wght400_GRAD0_opsz24.svg";
import type { ReactNode } from "react";
import u from "@/components/ui/shared.module.css";
import { useMessages } from "../i18n/UserSyncProvider";

type ConfirmDialogProps = {
  isDestructiveAction?: boolean;
  isOpen: boolean;
  isPending?: boolean;
  title?: string;
  children: ReactNode;
  cancelLabel: string;
  confirmLabel: string;
  confirmClassName?: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function ConfirmDialog({
  isDestructiveAction,
  isOpen,
  isPending = false,
  title,
  children,
  cancelLabel,
  confirmLabel,
  confirmClassName,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  const messages = useMessages();
  if (!isOpen) return null;
  const modalTitle =
    isDestructiveAction && !title ? messages.common.areYouSure : title;
  return (
    <div
      className={u.modalOverlay}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className={u.modal}>
        <div className={u.modalHeader}>
          <div className={u.modalHeaderTitle}>{modalTitle}</div>
          <button
            className={u.modalClose}
            type="button"
            onClick={onCancel}
            disabled={isPending}
            aria-label={cancelLabel}
          >
            <CloseIcon fill="currentColor" />
          </button>
        </div>
        <div className={u.modalBody}>{children}</div>
        <div className={u.modalFooter}>
          <button
            className={u.cancelButton}
            type="button"
            onClick={onCancel}
            disabled={isPending}
          >
            {cancelLabel}
          </button>
          <button
            className={`${confirmClassName ? `${confirmClassName} ` : `${isDestructiveAction ? u.destructiveButton : u.primaryButton}`}`}
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
