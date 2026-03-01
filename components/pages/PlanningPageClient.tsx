"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  addCustomSubjectAction,
  setSlotSubjectAction,
  setSlotTopicAction,
} from "@/app/(app)/actions";
import type { DaySchedule, Slot, Subject } from "@/lib/schedule/types";
import { getClientId } from "@/lib/sync/client-id";

type PlanningPageClientProps = {
  weekStart: string;
  prevWeek: string;
  nextWeek: string;
  days: DaySchedule[];
  subjects: Subject[];
};

function safeHexToRgb(hex: string) {
  let h = (hex || "").trim();
  if (h.startsWith("#")) h = h.slice(1);
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (h.length !== 6) return null;
  const n = Number.parseInt(h, 16);
  if (Number.isNaN(n)) return null;
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function contrastForHex(hex: string, fallback = "#000000") {
  const rgb = safeHexToRgb(hex);
  if (!rgb) return fallback;
  const lum = 0.2126 * (rgb.r / 255) + 0.7152 * (rgb.g / 255) + 0.0722 * (rgb.b / 255);
  return lum > 0.6 ? "#000000" : "#ffffff";
}

function getDayLabels(isoDateStr: string) {
  const match = isoDateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return {
      shortName: isoDateStr,
      longName: isoDateStr,
      shortDate: isoDateStr,
    };
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(utcDate.getTime())) {
    return {
      shortName: isoDateStr,
      longName: isoDateStr,
      shortDate: isoDateStr,
    };
  }

  const weekdaysLong = ["nedele", "pondeli", "utery", "streda", "ctvrtek", "patek", "sobota"];
  const weekdaysShort = ["Ne", "Po", "Ut", "St", "Ct", "Pa", "So"];

  const dayIndex = utcDate.getUTCDay();
  const shortDate = `${day}.${month}.`;

  return {
    shortName: weekdaysShort[dayIndex] || "",
    longName: weekdaysLong[dayIndex] || "",
    shortDate,
  };
}

export default function PlanningPageClient({
  weekStart,
  prevWeek,
  nextWeek,
  days,
  subjects,
}: PlanningPageClientProps) {
  const customTargetRef = useRef<{ dayIndex: number; slotIndex: number; slotId: string } | null>(null);
  const pendingSubjectUpdatesRef = useRef<Record<string, string | null>>({});
  const lastSyncedTopicsRef = useRef<Record<string, string>>({});
  const clientIdRef = useRef("");
  const [isPending, startTransition] = useTransition();

  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customColor, setCustomColor] = useState("#64748b");

  const [subjectOverrides, setSubjectOverrides] = useState<Record<string, string | null>>({});
  const [topicOverrides, setTopicOverrides] = useState<Record<string, string>>({});

  useEffect(() => {
    clientIdRef.current = getClientId();
  }, []);

  useEffect(() => {
    setActiveDayIndex(0);
  }, [weekStart]);

  useEffect(() => {
    const topics: Record<string, string> = {};
    const subjectsBySlot: Record<string, string | null> = {};
    for (const day of days) {
      for (const slot of day.slots) {
        topics[slot.id] = slot.topic || "";
        subjectsBySlot[slot.id] = slot.subjectId || null;
      }
    }
    lastSyncedTopicsRef.current = topics;

    // Keep optimistic subject overrides only while waiting for matching server acks.
    setSubjectOverrides((current) => {
      const slotIds = Object.keys(current);
      if (slotIds.length === 0) return current;

      let changed = false;
      const next: Record<string, string | null> = { ...current };
      for (const slotId of slotIds) {
        const hasServerSlot = Object.prototype.hasOwnProperty.call(subjectsBySlot, slotId);
        if (!hasServerSlot) {
          delete next[slotId];
          delete pendingSubjectUpdatesRef.current[slotId];
          changed = true;
          continue;
        }

        const serverValue = subjectsBySlot[slotId];
        const hasPending = Object.prototype.hasOwnProperty.call(
          pendingSubjectUpdatesRef.current,
          slotId,
        );
        const pendingValue = hasPending ? pendingSubjectUpdatesRef.current[slotId] : null;

        if (hasPending && pendingValue === serverValue) {
          delete next[slotId];
          delete pendingSubjectUpdatesRef.current[slotId];
          changed = true;
          continue;
        }

        if (!hasPending) {
          delete next[slotId];
          changed = true;
        }
      }

      return changed ? next : current;
    });
  }, [days, weekStart]);

  function currentSubjectValue(slot: Slot): string {
    if (slot.id in subjectOverrides) return subjectOverrides[slot.id] || "";
    return slot.subjectId || "";
  }

  function currentTopicValue(slot: Slot): string {
    if (slot.id in topicOverrides) return topicOverrides[slot.id];
    return slot.topic || "";
  }

  function updateSubject(dayIndex: number, slotIndex: number, slot: Slot, subjectId: string | null) {
    const nextSubjectId = subjectId || null;
    if ((currentSubjectValue(slot) || null) === nextSubjectId) return;

    pendingSubjectUpdatesRef.current[slot.id] = nextSubjectId;
    setSubjectOverrides((current) => ({
      ...current,
      [slot.id]: nextSubjectId,
    }));

    startTransition(async () => {
      try {
        await setSlotSubjectAction({
          weekStart,
          dayIndex,
          slotIndex,
          subjectId: nextSubjectId,
          writerId: clientIdRef.current,
        });
      } catch {
        setSubjectOverrides((current) => {
          if (!(slot.id in current)) return current;
          const next = { ...current };
          delete next[slot.id];
          return next;
        });
      } finally {
        delete pendingSubjectUpdatesRef.current[slot.id];
      }
    });
  }

  function updateTopicLocal(slot: Slot, topic: string) {
    setTopicOverrides((current) => ({
      ...current,
      [slot.id]: topic,
    }));
  }

  function commitTopic(dayIndex: number, slotIndex: number, slot: Slot, topic: string) {
    const previous =
      lastSyncedTopicsRef.current[slot.id] !== undefined
        ? lastSyncedTopicsRef.current[slot.id]
        : slot.topic || "";
    if (topic === previous) return;
    startTransition(async () => {
      await setSlotTopicAction({
        weekStart,
        dayIndex,
        slotIndex,
        topic,
        writerId: clientIdRef.current,
      });
      lastSyncedTopicsRef.current[slot.id] = topic;
    });
  }

  function openAddCustomForSlot(dayIndex: number, slotIndex: number, slotId: string) {
    customTargetRef.current = { dayIndex, slotIndex, slotId };
    setCustomName("");
    setCustomColor("#64748b");
    setCustomModalOpen(true);
  }

  function handleSaveCustomSubject() {
    const name = customName.trim();
    if (!name) return;
    const target = customTargetRef.current;
    if (!target) return;

    startTransition(async () => {
      const newId = await addCustomSubjectAction({
        name,
        color: customColor,
        writerId: clientIdRef.current,
      });
      if (newId) {
        await setSlotSubjectAction({
          weekStart,
          dayIndex: target.dayIndex,
          slotIndex: target.slotIndex,
          subjectId: newId,
          writerId: clientIdRef.current,
        });
        setSubjectOverrides((current) => ({
          ...current,
          [target.slotId]: newId,
        }));
      }
      setCustomModalOpen(false);
      customTargetRef.current = null;
    });
  }

  return (
    <div className="planning-page page-enter" aria-live="polite">
      <section className="section-block planning-header">
        <div className="planning-week-controls" role="region" aria-label="Week controls">
          <Link className="btn-secondary week-arrow" href={`/planning?week=${encodeURIComponent(prevWeek)}`}>
            {"<"}
          </Link>

          <div>
            <p className="page-kicker">Planner</p>
            <h1 className="page-title planning-week-title">Week starts {weekStart}</h1>
          </div>

          <Link className="btn-secondary week-arrow" href={`/planning?week=${encodeURIComponent(nextWeek)}`}>
            {">"}
          </Link>
        </div>

        <div className="planning-day-tabs" role="tablist" aria-label="Days">
          {days.map((day, dayIndex) => {
            const labels = getDayLabels(day.date);
            const isActive = dayIndex === activeDayIndex;
            return (
              <button
                key={day.date}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`planning-day-tab ${isActive ? "is-active" : ""}`}
                onClick={() => setActiveDayIndex(dayIndex)}
              >
                <span className="planning-day-tab-name">{labels.shortName}</span>
                <span className="planning-day-tab-date">{labels.shortDate}</span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="planning-panels" role="list" aria-label="Days">
        {days.map((day, dayIndex) => {
          const labels = getDayLabels(day.date);
          return (
            <article
              key={day.date}
              className={`planning-day-panel ${dayIndex === activeDayIndex ? "is-active" : ""}`}
              role="listitem"
            >
              <header className="planning-day-head">
                <p className="planning-day-name">{labels.longName}</p>
                <p className="planning-day-date">{day.date}</p>
              </header>

              <div className="planning-slot-list">
                {day.slots.map((slot, slotIndex) => {
                  const isFixed = slot.fixed;
                  const subjectObj =
                    !isFixed && currentSubjectValue(slot)
                      ? subjects.find((s) => s.id === currentSubjectValue(slot)) || null
                      : null;
                  const bg = isFixed ? "#ffd8e5" : subjectObj?.color || "#e2e8f0";
                  const textColor = contrastForHex(bg, "#000000");
                  const title = isFixed ? slot.fixedLabel || "Activity" : subjectObj?.name || "-";
                  const topicValue = currentTopicValue(slot);
                  const fixedTopicValue =
                    isFixed &&
                    topicValue &&
                    slot.fixedLabel &&
                    topicValue.trim().toLowerCase() === slot.fixedLabel.trim().toLowerCase()
                      ? ""
                      : topicValue;

                  return (
                    <article
                      key={slot.id}
                      className={`planning-slot-card ${isFixed ? "is-fixed" : "is-editable"}`}
                      style={{ backgroundColor: bg, color: textColor }}
                    >
                      <div className="planning-slot-top">
                        <div className="planning-slot-title">{title}</div>
                        <div className="planning-slot-time">{slot.time}</div>
                      </div>

                      <div className="planning-slot-body">
                        {!isFixed ? (
                          <>
                            <select
                              className="field-control"
                              value={currentSubjectValue(slot)}
                              onChange={(event) => {
                                const value = event.target.value;
                                if (value === "__add_custom__") {
                                  openAddCustomForSlot(dayIndex, slotIndex, slot.id);
                                } else {
                                  updateSubject(dayIndex, slotIndex, slot, value || null);
                                }
                              }}
                            >
                              <option value="">- Select subject -</option>
                              {subjects.map((subject) => (
                                <option key={subject.id} value={subject.id}>
                                  {subject.name}
                                </option>
                              ))}
                              <option value="__add_custom__">+ Add custom subject</option>
                            </select>

                            <input
                              className="field-control"
                              type="text"
                              value={topicValue}
                              onChange={(event) => updateTopicLocal(slot, event.target.value)}
                              onBlur={(event) =>
                                commitTopic(dayIndex, slotIndex, slot, event.currentTarget.value)
                              }
                              onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                  event.currentTarget.blur();
                                }
                              }}
                              placeholder="Topic (optional)"
                            />
                          </>
                        ) : null}

                        {isFixed && slot.allowTopic ? (
                          <input
                            className="field-control"
                            type="text"
                            value={fixedTopicValue}
                            onChange={(event) => updateTopicLocal(slot, event.target.value)}
                            onBlur={(event) =>
                              commitTopic(dayIndex, slotIndex, slot, event.currentTarget.value)
                            }
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                event.currentTarget.blur();
                              }
                            }}
                            placeholder={`Topic for ${slot.fixedLabel || "fixed slot"}`}
                          />
                        ) : null}
                      </div>
                    </article>
                  );
                })}
              </div>
            </article>
          );
        })}
      </div>

      {customModalOpen ? (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-panel">
            <div className="modal-header">
              <h2 className="modal-title">Add custom subject</h2>
            </div>

            <div className="modal-body">
              <label className="modal-label">Name</label>
              <input
                className="field-control"
                value={customName}
                onChange={(event) => setCustomName(event.target.value)}
                placeholder="Example: Theater"
              />

              <label className="modal-label">Color</label>
              <div className="modal-color-row">
                <input
                  className="color-picker"
                  type="color"
                  value={customColor}
                  onChange={(event) => setCustomColor(event.target.value)}
                />
                <span className="color-value">{customColor}</span>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setCustomModalOpen(false);
                  customTargetRef.current = null;
                }}
                disabled={isPending}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleSaveCustomSubject}
                disabled={isPending}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
