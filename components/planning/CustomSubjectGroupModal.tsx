"use client";

import { useState } from "react";
import type { AppMessages } from "@/lib/i18n/messages";
import type { Subject } from "@/lib/schedule/types";
import { getSubjectDisplayName } from "@/lib/schedule/labels";
import { APP_LOCALES } from "@/lib/i18n/config";
import ModalFooter from "@/components/planning/ModalFooter";
import CloseIcon from "@/icons/close.svg";
import styles from "./CustomSubjectGroupModal.module.css";
import u from "@/components/ui/shared.module.css";

type CustomSubjectGroupModalProps = {
  isOpen: boolean;
  isPending: boolean;
  messages: AppMessages;
  title?: string;
  subjects: Subject[];
  initialData?: {
    id?: string;
    names: Record<string, string>;
    subjectIds: string[];
    namePreferences?: Record<string, string>;
  } | null;
  onClose: () => void;
  onSave: (
    id: string | null,
    names: Record<string, string>,
    subjectIds: string[],
    namePreferences: Record<string, string>,
  ) => void;
};

export default function CustomSubjectGroupModal({
  isOpen,
  isPending,
  messages,
  title,
  subjects,
  initialData,
  onClose,
  onSave,
}: CustomSubjectGroupModalProps) {
  const [names, setNames] = useState<Record<string, string>>({});
  const [namePreferences, setNamePreferences] = useState<
    Record<string, string>
  >({});
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [prevIsOpen, setPrevIsOpen] = useState(false);

  // React-recommended pattern: adjust state when props change during render
  // instead of in useEffect, avoiding cascading post-paint renders.
  // See: https://react.dev/reference/react/useState#storing-information-from-the-previous-render
  if (isOpen && !prevIsOpen) {
    setPrevIsOpen(true);
    if (initialData) {
      const fullNames: Record<string, string> = {};
      for (const locale of APP_LOCALES) {
        fullNames[locale] = initialData.names[locale] || "";
      }
      setNames(fullNames);
      setSelectedSubjectIds(initialData.subjectIds);
      setNamePreferences(initialData.namePreferences || {});
    } else {
      const emptyNames: Record<string, string> = {};
      for (const locale of APP_LOCALES) {
        emptyNames[locale] = "";
      }
      setNames(emptyNames);
      setSelectedSubjectIds([]);
      setNamePreferences({});
    }
  } else if (!isOpen && prevIsOpen) {
    setPrevIsOpen(false);
  }

  if (!isOpen) return null;

  const modalMessages = messages.settings.subjectGroupModal;

  function handleClose() {
    onClose();
  }

  function handleSave() {
    const finalNames: Record<string, string> = {};
    for (const locale of APP_LOCALES) {
      const fallback = namePreferences[locale];
      if (fallback) {
        finalNames[locale] = names[fallback] || "";
      } else {
        finalNames[locale] = names[locale] || "";
      }
    }

    if (!finalNames["cs"] && !finalNames["en"] && !finalNames["pl"]) {
      return; // Ensure at least one name is provided
    }

    // Clean preferences — remove entries where the value is empty (= "Custom")
    const cleanPreferences: Record<string, string> = {};
    for (const [locale, fallback] of Object.entries(namePreferences)) {
      if (fallback) {
        cleanPreferences[locale] = fallback;
      }
    }

    onSave(
      initialData?.id || null,
      finalNames,
      selectedSubjectIds,
      cleanPreferences,
    );
  }

  const toggleSubject = (id: string) => {
    setSelectedSubjectIds((prev) =>
      prev.includes(id) ? prev.filter((sId) => sId !== id) : [...prev, id],
    );
  };

  function formatSameAs(locale: string): string {
    return modalMessages.sameAs.replace("{locale}", locale.toUpperCase());
  }

  function formatPlaceholder(locale: string): string {
    return modalMessages.namePlaceholder.replace(
      "{locale}",
      locale.toUpperCase(),
    );
  }

  return (
    <div className={u.modalOverlay} role="dialog" aria-modal="true">
      <div className={u.modal} style={{ maxWidth: "500px" }}>
        <div className={u.modalHeader}>
          <div className={styles.modalTitle}>
            {title || modalMessages.title}
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

        <div
          className={u.modalBody}
          style={{ maxHeight: "60vh", overflowY: "auto" }}
        >
          <label className={styles.sectionLabel}>
            {modalMessages.groupName}
          </label>

          <div className={styles.localeNamesContainer}>
            {APP_LOCALES.map((locale) => (
              <div key={locale} className={styles.localeRow}>
                <div className={styles.localeHeader}>
                  <span className={styles.localeCode}>{locale}</span>
                  <select
                    className={` ${styles.preferenceSelect} ${styles.localeOption}`}
                    value={namePreferences[locale] || ""}
                    onChange={(e) => {
                      setNamePreferences((prev) => ({
                        ...prev,
                        [locale]: e.target.value,
                      }));
                    }}
                  >
                    <option value=""> {modalMessages.custom}</option>
                    {APP_LOCALES.filter((l) => l !== locale).map((l) => (
                      <option key={l} value={l}>
                        {formatSameAs(l)}
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  className={`${styles.localeInput} ${u.formInput}`}
                  value={
                    namePreferences[locale]
                      ? names[namePreferences[locale]] || ""
                      : names[locale] || ""
                  }
                  disabled={Boolean(namePreferences[locale])}
                  onChange={(event) =>
                    setNames((prev) => ({
                      ...prev,
                      [locale]: event.target.value,
                    }))
                  }
                  placeholder={formatPlaceholder(locale)}
                />
              </div>
            ))}
          </div>

          <label className={styles.sectionLabel}>
            {modalMessages.selectSubjects}
          </label>
          <div className={styles.subjectsList}>
            {subjects.map((subject) => (
              <label key={subject.id} className={styles.subjectItem}>
                <input
                  type="checkbox"
                  checked={selectedSubjectIds.includes(subject.id)}
                  onChange={() => toggleSubject(subject.id)}
                  className={` ${styles.subjectCheckbox}`}
                />
                <div
                  className={styles.subjectColorDot}
                  style={{ backgroundColor: subject.color }}
                />
                <span className={styles.subjectName}>
                  {getSubjectDisplayName(subject, messages)}
                </span>
              </label>
            ))}
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
