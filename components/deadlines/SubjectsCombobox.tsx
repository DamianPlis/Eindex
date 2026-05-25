"use client";

import { useState, useRef, useEffect } from "react";
import { useMessages, useAppLocale } from "@/components/i18n/LocaleProvider";
import type { Subject, SubjectGroup } from "@/lib/schedule/types";
import {
  getSubjectDisplayName,
  getSubjectGroupDisplayName,
} from "@/lib/schedule/labels";
import styles from "@/css/SubjectsCombobox.module.css";
import SearchIcon from "@/icons/search_24dp_000000_FILL0_wght400_GRAD0_opsz24.svg";

interface SubjectsComboboxProps {
  subjects: Subject[];
  subjectGroups: SubjectGroup[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export default function SubjectsCombobox({
  subjects,
  subjectGroups,
  selectedIds,
  onChange,
}: SubjectsComboboxProps) {
  const messages = useMessages();
  const locale = useAppLocale();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggleSubject = (subjectId: string) => {
    if (selectedIds.includes(subjectId)) {
      onChange(selectedIds.filter((id) => id !== subjectId));
    } else {
      onChange([...selectedIds, subjectId]);
    }
  };

  const handleGroupClick = (group: SubjectGroup) => {
    // Check if all subjects in the group are already selected
    const allSelected = group.subjectIds.every((id) =>
      selectedIds.includes(id),
    );

    if (allSelected) {
      // Remove all subjects in this group
      onChange(selectedIds.filter((id) => !group.subjectIds.includes(id)));
    } else {
      // Add all subjects in this group
      const newSelection = new Set([...selectedIds, ...group.subjectIds]);
      onChange(Array.from(newSelection));
    }
  };

  const handleClear = () => {
    onChange([]);
  };

  const query = searchQuery.toLowerCase();

  const filteredSubjects = subjects.filter((subject) => {
    const name = getSubjectDisplayName(subject, messages).toLowerCase();
    return name.includes(query);
  });

  const filteredGroups = subjectGroups.filter((group) => {
    return getSubjectGroupDisplayName(group, messages, locale).toLowerCase().includes(query);
  });

  // Calculate button text
  let buttonText = messages.deadlines.filterOptions?.all || "Všechny předměty";
  if (selectedIds.length > 0) {
    if (selectedIds.length === 1) {
      const subj = subjects.find((s) => s.id === selectedIds[0]);
      buttonText = subj ? getSubjectDisplayName(subj, messages) : "1 Vybráno";
    } else {
      buttonText = `${selectedIds.length} Vybráno`;
    }
  }

  return (
    <div className={styles.container} ref={containerRef}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span>{buttonText}</span>
        <svg
          width="24"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {isOpen && (
        <div className={styles.popover}>
          <div className={styles.searchWrapper}>
            <SearchIcon fill="currentColor" width="24" height="24" />
            <input
              type="text"
              className={styles.searchInput}
              placeholder={messages.deadlines.filterOptions.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>

          <div className={styles.list} role="listbox">
            {selectedIds.length > 0 && (
              <button
                type="button"
                className={styles.clearBtn}
                onClick={handleClear}
              >
                {messages.deadlines.filterOptions.cancelSelection}
              </button>
            )}

            {filteredGroups.length > 0 && (
              <div>
                <div className={styles.sectionTitle}>
                  {messages.deadlines.filterOptions.groups}
                </div>
                {filteredGroups.map((group) => {
                  const allSelected = group.subjectIds.every((id) =>
                    selectedIds.includes(id),
                  );
                  return (
                    <div
                      key={group.id}
                      className={styles.groupItem}
                      onClick={() => handleGroupClick(group)}
                    >
                      <div
                        className={`${styles.checkbox} ${allSelected ? styles.checked : ""}`}
                      >
                        {allSelected && (
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                      <span className={styles.itemText}>
                        {getSubjectGroupDisplayName(group, messages, locale)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {filteredGroups.length > 0 && filteredSubjects.length > 0 && (
              <div className={styles.divider} />
            )}

            {filteredSubjects.length > 0 && (
              <div>
                <div className={styles.sectionTitle}>
                  {messages.deadlines.filterOptions.subjects}
                </div>
                {filteredSubjects.map((subject) => {
                  const isSelected = selectedIds.includes(subject.id);
                  return (
                    <div
                      key={subject.id}
                      className={styles.item}
                      onClick={() => handleToggleSubject(subject.id)}
                    >
                      <div
                        className={`${styles.checkbox} ${isSelected ? styles.checked : ""}`}
                      >
                        {isSelected && (
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                      <div
                        className={styles.colorDot}
                        style={{ backgroundColor: subject.color }}
                      />
                      <span className={styles.itemText}>
                        {getSubjectDisplayName(subject, messages)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {filteredGroups.length === 0 && filteredSubjects.length === 0 && (
              <div className={styles.empty}>
                {messages.deadlines.filterOptions.nothingFound}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
