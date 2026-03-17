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
//import Image from "next/image";
import ArrowLeft from "@/icons/arrow_left_24dp_000000_FILL0_wght400_GRAD0_opsz24.svg";
import ArrowRight from "@/icons/arrow_right_24dp_000000_FILL0_wght400_GRAD0_opsz24.svg";

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

function formatDayLabel(isoDateStr: string) {
  const match = isoDateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return isoDateStr;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(utcDate.getTime())) return isoDateStr;

  const weekdays = ["nedele", "pondeli", "utery", "streda", "ctvrtek", "patek", "sobota"];
  // const months = ["led", "uno", "bre", "dub", "kve", "cer", "cvc", "srp", "zar", "rij", "lis", "pro"];

  const weekday = weekdays[utcDate.getUTCDay()] || "";
  // const monthLabel = months[month - 1] || "";
  return `${weekday} ${day}. `// dont add ${monthLabel} i dont want it;
}

export default function PlanningPageClient({
  weekStart,
  prevWeek,
  nextWeek,
  days,
  subjects,
}: PlanningPageClientProps) {
  const planningRootRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const customTargetRef = useRef<{ dayIndex: number; slotIndex: number; slotId: string } | null>(null);
  const pendingSubjectUpdatesRef = useRef<Record<string, string | null>>({});
  const lastSyncedTopicsRef = useRef<Record<string, string>>({});
  const clientIdRef = useRef("");
  const isActiveDayIndexTriggeredByObserver = useRef(false);
  const activeDayIndexRef = useRef(0);
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
    activeDayIndexRef.current = activeDayIndex;
  }, [activeDayIndex]);

  useEffect(() => {
    const planningRoot = planningRootRef.current;
    if (!planningRoot) return;
    const container = containerRef.current;
    if (!container) return;
    const child = container.children.item(activeDayIndex);
    if (!child) return;
    if (isActiveDayIndexTriggeredByObserver.current) {
      isActiveDayIndexTriggeredByObserver.current = false;
      return; // skip if triggered by observer to avoid stutering
    }
    try {
      child.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
      //planningRoot.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
    } catch {
      container.scrollLeft = activeDayIndex * container.clientWidth;
    }

  }, [activeDayIndex, weekStart]);

    // Update pager dots when user scrolls (scroll snap) using Intersection Observer
  // Much more performant than scroll events—only fires when visibility changes
  // Use isActiveDayIndexTriggeredByObserver to stop animation useEffect from firing, avoiding stutter
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !days) return;
    const observer = new IntersectionObserver(
      (entries) => {
        // Find the most visible day card (highest intersection ratio)
        let mostVisibleIndex = 0;
        let highestRatio = 0;

        entries.forEach((entry) => {
          if (entry.intersectionRatio > highestRatio) {
            highestRatio = entry.intersectionRatio;
            // Get the index from the card's position in the container
            mostVisibleIndex = Array.from(el.children).indexOf(entry.target);
          }
        });

        if (mostVisibleIndex !== -1 && mostVisibleIndex !== activeDayIndexRef.current) {
          isActiveDayIndexTriggeredByObserver.current = true;
          setActiveDayIndex(mostVisibleIndex);
        }
      },
      {
        root: el,
        threshold: [0.51], // Detect visibility changes
      }
    );
    // Observe all day cards
    Array.from(el.children).forEach((child) => observer.observe(child));

    return () => observer.disconnect();
  }, [days]);

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

    // Keep optimistic subject overrides only while waiting for that exact server ack.
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
    <div ref={planningRootRef} className="planning-root" aria-live="polite">
      <div className="planning-inner">
        <div className="controls" role="region" aria-label="Week controls">
          <Link className="nav-btn" href={`/planning?week=${encodeURIComponent(prevWeek)}`}>
            <ArrowLeft fill="currentColor" />
          </Link>
          <div className="week-title">Week starts {weekStart}</div>
          <Link className="nav-btn" href={`/planning?week=${encodeURIComponent(nextWeek)}`}>
            <ArrowRight fill="currentColor" />
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

        <div ref={containerRef} className="days-scroll" role="list" aria-label="Days">
          {days.map((day, dayIndex) => (
            <article key={day.date} className="day-card" role="listitem">
              <div className="day-inner">
                <header className="day-header">
                  <div className="day-name">{formatDayLabel(day.date)}</div>
                  <div className="day-date">{day.date}</div>
                </header>

                <div className="slots">
                  {day.slots.map((slot, slotIndex) => {
                    const isFixed = slot.fixed;
                    const subjectObj =
                      !isFixed && currentSubjectValue(slot)
                        ? subjects.find((s) => s.id === currentSubjectValue(slot)) || null
                        : null;
                    const bg = isFixed ? "#ff7fbf" : subjectObj?.color || "#f1f5f9";
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
                      <div
                        key={slot.id}
                        className="slot-card"
                        style={{ background: bg, color: textColor }}
                      >
                        <div className="slot-top">
                          <div className="slot-title">{title}</div>
                          <div className="slot-time">{slot.time}</div>
                        </div>

                        <div className="slot-body">
                          {!isFixed ? (
                            <>
                              <select
                                className="slot-select"
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
                                className="slot-input"
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
                              className="slot-input"
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
                      </div>
                    );
                  })}
                </div>
              </div>
            </article>
          ))}
        </div>

      </div>

      {customModalOpen ? (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal">
            <div className="modal-header">
              <div style={{ fontWeight: 800 }}>Add custom subject</div>
              <button className="modal-save" onClick={handleSaveCustomSubject} disabled={isPending}>
                Save
              </button>
            </div>

            <div className="modal-body">
              <label style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Name</label>
              <input
                className="slot-input"
                style={{ marginBottom: 12, fontSize: 16 }}
                value={customName}
                onChange={(event) => setCustomName(event.target.value)}
                placeholder="Example: Theater"
              />

              <label style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Color</label>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  type="color"
                  value={customColor}
                  onChange={(event) => setCustomColor(event.target.value)}
                />
                <div style={{ fontSize: 13 }}>{customColor}</div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="modal-cancel"
                onClick={() => {
                  setCustomModalOpen(false);
                  customTargetRef.current = null;
                }}
                disabled={isPending}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
