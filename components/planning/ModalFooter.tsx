import type { AppMessages } from "@/lib/i18n/messages";
import u from "@/components/ui/shared.module.css";

type ModalFooterProps = {
  messages: AppMessages;
  isPending: boolean;
  onCancel: () => void;
  onSave: () => void;
};

export default function ModalFooter({
  messages,
  isPending,
  onCancel,
  onSave,
}: ModalFooterProps) {
  return (
    <div className={u.modalFooter}>
      <button
        className={u.cancelButton}
        type="button"
        onClick={onCancel}
        disabled={isPending}
      >
        {messages.common.cancel}
      </button>
      <button
        className={u.primaryButton}
        type="button"
        onClick={onSave}
        disabled={isPending}
      >
        {messages.common.save}
      </button>
    </div>
  );
}
