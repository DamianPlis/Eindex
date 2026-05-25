import type { AppMessages } from "@/lib/i18n/messages";

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
    <div className="modal-footer">
      <button
        className="modal-cancel"
        type="button"
        onClick={onCancel}
        disabled={isPending}
      >
        {messages.common.cancel}
      </button>
      <button
        className="modal-save"
        type="button"
        onClick={onSave}
        disabled={isPending}
      >
        {messages.common.save}
      </button>
    </div>
  );
}
