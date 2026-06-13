"use client";

import { useMessages } from "@/components/i18n/LocaleProvider";
import { useSettings } from "@/components/settings/SettingsProvider";
import CustomSubjectModal from "@/components/planning/CustomSubjectModal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import AddIcon from "@/icons/add_24dp_000000_FILL0_wght400_GRAD0_opsz24.svg";
import s from "@/components/settings/settings.module.css";

export default function SubjectsSection() {
  const messages = useMessages();
  const {
    subjects,
    isPending,
    handleAddSubject,
    handleUpdateSubject,
    handleDeleteSubject,
    confirmDeleteSubject,
    handleSaveCustomSubject,
    closeCustomSubjectModal,
    editingSubjectId,
    editName,
    editColor,
    setEditingSubjectId,
    setEditName,
    setEditColor,
    customModalOpen,
    subjectPendingDelete,
    setSubjectPendingDelete,
  } = useSettings();

  return (
    <section id="settings-subjects" className={s.subjectsSection}>
      <div className={s.subjectsListHeader}>
        <h3>{messages.settings.subjects}</h3>
        <button
          className={`deadline-plus-button ${s.addSubjectButton}`}
          type="button"
          onClick={handleAddSubject}
          disabled={isPending}
          title={messages.planning.addCustomSubjectTitle}
          aria-label={messages.planning.addCustomSubjectTitle}
        >
          <AddIcon fill="currentColor" />
        </button>
      </div>

      <div className={s.subjectsList}>
        {subjects.map((subject) => (
          <div key={subject.id} className={s.subjectItem}>
            {editingSubjectId === subject.id ? (
              <>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className={s.subjectInput}
                />
                <input
                  type="color"
                  value={editColor}
                  onChange={(e) => setEditColor(e.target.value)}
                  className={s.subjectColorPicker}
                />
                <div className={s.subjectActions}>
                  <button
                    className={s.subjectActionBtnSave}
                    onClick={() => handleUpdateSubject(subject.id)}
                    disabled={isPending}
                  >
                    {messages.common.save}
                  </button>
                  <button
                    className={s.subjectActionBtn}
                    onClick={() => setEditingSubjectId(null)}
                    disabled={isPending}
                  >
                    {messages.common.cancel}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div
                  className={s.subjectColorDot}
                  style={{ backgroundColor: subject.color }}
                />
                <span className={s.subjectName}>{subject.name}</span>
                <div className={s.subjectActions}>
                  <button
                    className={s.subjectActionBtn}
                    onClick={() => {
                      setEditingSubjectId(subject.id);
                      setEditName(subject.name);
                      setEditColor(subject.color);
                    }}
                    disabled={isPending}
                  >
                    {messages.common.edit}
                  </button>
                  <button
                    className={s.subjectActionBtnDelete}
                    onClick={() => handleDeleteSubject(subject.id)}
                    disabled={isPending}
                  >
                    {messages.common.delete}
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <CustomSubjectModal
        isOpen={customModalOpen}
        isPending={isPending}
        messages={messages}
        onClose={closeCustomSubjectModal}
        onSave={handleSaveCustomSubject}
      />
      <ConfirmDialog
        isDestructiveAction={true}
        isOpen={Boolean(subjectPendingDelete)}
        isPending={isPending}
        title={messages.settings.deleteSubject}
        cancelLabel={messages.common.cancel}
        confirmLabel={messages.common.delete}
        onCancel={() => setSubjectPendingDelete(null)}
        onConfirm={confirmDeleteSubject}
      >
        <p>
          {subjectPendingDelete
            ? messages.settings.deleteSubjectConfirm.replace(
                "{name}",
                subjectPendingDelete.name,
              )
            : ""}
        </p>
      </ConfirmDialog>
    </section>
  );
}
