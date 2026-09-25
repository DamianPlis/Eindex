"use client";

import { useState } from "react";
import { useMessages, useAppLocale } from "@/components/i18n/UserSyncProvider";
import { useSettings } from "@/components/settings/SettingsProvider";
import CustomSubjectGroupModal from "@/components/planning/CustomSubjectGroupModal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import AddIcon from "@/icons/add.svg";
import s from "@/components/settings/settings.module.css";
import {
  getSubjectGroupDisplayName,
  getSubjectDisplayName,
  builtinSubjectGroupIdSet,
} from "@/lib/schedule/labels";
import { APP_LOCALES } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import type { SubjectGroup } from "@/lib/schedule/types";

export default function SubjectGroupsSection() {
  const messages = useMessages();
  const locale = useAppLocale();
  const {
    subjects,
    subjectGroups,
    isPending,
    handleAddSubjectGroup,
    handleUpdateSubjectGroup,
    handleDeleteSubjectGroup,
  } = useSettings();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<{
    id?: string;
    names: Record<string, string>;
    subjectIds: string[];
    namePreferences?: Record<string, string>;
  } | null>(null);
  const [groupPendingDelete, setGroupPendingDelete] =
    useState<SubjectGroup | null>(null);

  const handleAddClick = () => {
    setEditingGroup(null);
    setModalOpen(true);
  };

  const handleEditClick = (group: SubjectGroup) => {
    const isBuiltin = builtinSubjectGroupIdSet.has(group.id);
    const names: Record<string, string> = {};

    if (isBuiltin) {
      for (const loc of APP_LOCALES) {
        const locMessages = getMessages(loc);
        names[loc] =
          locMessages.subjectGroups.builtin[
            group.id as keyof typeof locMessages.subjectGroups.builtin
          ] || "";
      }
    } else {
      const nameObj =
        typeof group.name === "object" && group.name !== null
          ? (group.name as Record<string, string>)
          : { cs: String(group.name) }; // redundancy that kind of doesnt make any sense but still better its there
      console.log("nameObj", nameObj);

      for (const loc of APP_LOCALES) {
        names[loc] = nameObj[loc] || "";
      }
    }

    setEditingGroup({
      id: group.id,
      names: { ...names },
      subjectIds: [...group.subjectIds],
      namePreferences: group.namePreferences
        ? { ...group.namePreferences }
        : undefined,
    });
    setModalOpen(true);
  };

  const handleDeleteClick = (group: SubjectGroup) => {
    setGroupPendingDelete(group);
  };

  const handleSaveGroup = (
    id: string | null,
    names: Record<string, string>,
    subjectIds: string[],
    namePreferences: Record<string, string>,
  ) => {
    if (id) {
      handleUpdateSubjectGroup(id, names, subjectIds, namePreferences);
    } else {
      handleAddSubjectGroup(names, subjectIds, namePreferences);
    }
    setModalOpen(false);
  };

  return (
    <section
      id="settings-subject-groups"
      className={s.subjectsSection}
      style={{ marginTop: "2rem" }}
    >
      <div className={s.subjectsListHeader}>
        <h3>{messages.settings.subjectGroups}</h3>
        <button
          className={`deadline-plus-button ${s.addSubjectButton}`}
          type="button"
          onClick={handleAddClick}
          disabled={isPending}
          title={messages.settings.addSubjectGroup}
          aria-label={messages.settings.addSubjectGroup}
        >
          <AddIcon fill="currentColor" />
        </button>
      </div>

      <div className={s.subjectsList}>
        {subjectGroups.map((group) => {
          const groupSubjects = group.subjectIds
            .map((id) => subjects.find((sub) => sub.id === id))
            .filter(Boolean)
            .map((sub) => getSubjectDisplayName(sub!, messages));

          return (
            <div
              key={group.id}
              className={s.subjectItem}
              style={{
                flexWrap: "wrap",
                alignItems: "flex-start",
                padding: "12px",
              }}
            >
              <div style={{ flex: 1 }}>
                <div className={s.subjectName} style={{ fontWeight: "bold" }}>
                  {getSubjectGroupDisplayName(group, messages, locale)}
                </div>
                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--text-secondary)",
                    marginTop: "4px",
                  }}
                >
                  {groupSubjects.join(", ") || messages.settings.noSubjects}
                </div>
              </div>

              <div className={s.subjectActions}>
                <button
                  className={s.subjectActionBtn}
                  onClick={() => handleEditClick(group)}
                  disabled={isPending}
                >
                  {messages.common.edit}
                </button>
                <button
                  className={s.subjectActionBtnDelete}
                  onClick={() => handleDeleteClick(group)}
                  disabled={isPending}
                >
                  {messages.common.delete}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <CustomSubjectGroupModal
        isOpen={modalOpen}
        isPending={isPending}
        messages={messages}
        subjects={subjects}
        initialData={editingGroup}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveGroup}
      />

      <ConfirmDialog
        isDestructiveAction={true}
        isOpen={Boolean(groupPendingDelete)}
        isPending={isPending}
        cancelLabel={messages.common.cancel}
        confirmLabel={messages.common.delete}
        onCancel={() => setGroupPendingDelete(null)}
        onConfirm={() => {
          if (groupPendingDelete) {
            handleDeleteSubjectGroup(groupPendingDelete.id);
            setGroupPendingDelete(null);
          }
        }}
      >
        <p>
          {groupPendingDelete
            ? messages.settings.deleteSubjectGroupConfirm.replace(
                "{name}",
                getSubjectGroupDisplayName(
                  groupPendingDelete,
                  messages,
                  locale,
                ),
              )
            : ""}
        </p>
      </ConfirmDialog>
    </section>
  );
}
