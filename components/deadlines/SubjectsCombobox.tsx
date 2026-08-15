"use client";

import { useState, useRef, useEffect } from "react";
import { useMessages, useAppLocale } from "@/components/i18n/UserSyncProvider";
import type { Subject, SubjectGroup } from "@/lib/schedule/types";
import {
  getSubjectDisplayName,
  getSubjectGroupDisplayName,
} from "@/lib/schedule/labels";
import styles from "./SubjectsCombobox.module.css";
import cardStyles from "./StatsCard.module.css";
import SearchIcon from "@/icons/search_24dp_000000_FILL0_wght400_GRAD0_opsz24.svg";
import CloseIcon from "@/icons/close_24dp_000000_FILL0_wght400_GRAD0_opsz24 (1).svg";
import FilterAltIcon from "@/icons/filter_alt_24dp_FFFFFF_FILL0_wght400_GRAD0_opsz24.svg";

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
    return getSubjectGroupDisplayName(group, messages, locale)
      .toLowerCase()
      .includes(query);
  });

  const activeCount = selectedIds.length;

  return (
    <div className={styles.container} ref={containerRef}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Filter subjects"
      >
        <FilterAltIcon
          fill="currentColor"
          className={cardStyles.statsCardHeaderIcon}
        />
        {activeCount > 0 && <span className={styles.badge}>{activeCount}</span>}
      </button>

      {isOpen && (
        <div className={styles.popover}>
          <div className={styles.searchWrapper}>
            <SearchIcon
              className={styles.searchIcon}
              fill="currentColor"
              width="24"
              height="24"
            />
            <input
              type="text"
              className={styles.searchInput}
              placeholder={messages.deadlines.filterOptions.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            {selectedIds.length > 0 && (
              <div className={styles.closeIcon}>
                <button
                  type="button"
                  className={styles.clearBtn}
                  onClick={handleClear}
                >
                  <CloseIcon fill="currentColor" width="24" height="24" />
                </button>
              </div>
            )}
          </div>

          <div className={styles.list} role="listbox">
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
