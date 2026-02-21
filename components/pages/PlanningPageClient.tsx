"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  addCustomSubjectAction,
  setSlotSubjectAction,
  setSlotTopicAction,
} from "@/app/(app)/actions";
import type { DaySchedule, Subject } from "@/lib/schedule/types";

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
  const n = parseInt(h, 16);
  if (Number.isNaN(n)) return null;
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function contrastForHex(hex: string, fallback = "#000000") {
  const rgb = safeHexToRgb(hex);
  if (!rgb) return fallback;
  const lum = 0.2126 * (rgb.r / 255) + 0.7152 * (rgb.g / 255) + 0.0722 * (rgb.b / 255);
  return lum > 0.6 ? "#000000" : "#ffffff";
}

function formatDayLabel(isoDateStr: string) {
  try {
    return new Date(isoDateStr).toLocaleDateString("cs-CZ", {
      weekday: "long",
      day: "numeric",
      month: "short",
    });
  } catch {
    return isoDateStr;
  }
}

export default function PlanningPageClient({
  weekStart,
  prevWeek,
  nextWeek,
  days,
  subjects,
}: PlanningPageClientProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const customTargetRef = useRef<{ dayIndex: number; slotIndex: number } | null>(null);
  const [isPending, startTransition] = useTransition();

  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customColor, setCustomColor] = useState("#64748b");

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const child = container.children.item(activeDayIndex);
    if (!child) return;
    child.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
  }, [activeDayIndex, weekStart]);

  function updateSubject(dayIndex: number, slotIndex: number, subjectId: string | null) {
    startTransition(async () => {
      await setSlotSubjectAction({ weekStart, dayIndex, slotIndex, subjectId });
      router.refresh();
    });
  }

  function updateTopic(dayIndex: number, slotIndex: number, topic: string) {
    startTransition(async () => {
      await setSlotTopicAction({ weekStart, dayIndex, slotIndex, topic });
      router.refresh();
    });
  }

  function openAddCustomForSlot(dayIndex: number, slotIndex: number) {
    customTargetRef.current = { dayIndex, slotIndex };
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
      const newId = await addCustomSubjectAction({ name, color: customColor });
      if (newId) {
        await setSlotSubjectAction({
          weekStart,
          dayIndex: target.dayIndex,
          slotIndex: target.slotIndex,
          subjectId: newId,
        });
      }
      setCustomModalOpen(false);
      customTargetRef.current = null;
      router.refresh();
    });
  }

  return (
    <div className="planning-root" aria-live="polite">
      <div className="planning-inner">
        <div className="controls" role="region" aria-label="Week controls">
          <Link className="nav-btn" href={`/planning?week=${encodeURIComponent(prevWeek)}`}>
            {"<"}
          </Link>
          <div className="week-title">Week starts {weekStart}</div>
          <Link className="nav-btn" href={`/planning?week=${encodeURIComponent(nextWeek)}`}>
            {">"}
          </Link>
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
                      !isFixed && slot.subjectId
                        ? subjects.find((s) => s.id === slot.subjectId) || null
                        : null;
                    const bg = isFixed ? "#ff7fbf" : subjectObj?.color || "#f1f5f9";
                    const textColor = contrastForHex(bg, "#000000");
                    const title = isFixed ? slot.fixedLabel || "Activity" : subjectObj?.name || "-";
                    const fixedTopicValue =
                      isFixed &&
                      slot.topic &&
                      slot.fixedLabel &&
                      slot.topic.trim().toLowerCase() === slot.fixedLabel.trim().toLowerCase()
                        ? ""
                        : slot.topic || "";

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
                                value={slot.subjectId || ""}
                                disabled={isPending}
                                onChange={(event) => {
                                  const value = event.target.value;
                                  if (value === "__add_custom__") {
                                    openAddCustomForSlot(dayIndex, slotIndex);
                                  } else {
                                    updateSubject(dayIndex, slotIndex, value || null);
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
                                value={slot.topic || ""}
                                disabled={isPending}
                                onChange={(event) =>
                                  updateTopic(dayIndex, slotIndex, event.target.value)
                                }
                                placeholder="Topic (optional)"
                              />
                            </>
                          ) : null}

                          {isFixed && slot.allowTopic ? (
                            <input
                              className="slot-input"
                              type="text"
                              value={fixedTopicValue}
                              disabled={isPending}
                              onChange={(event) =>
                                updateTopic(dayIndex, slotIndex, event.target.value)
                              }
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

        <div className="pager" role="navigation" aria-label="Day pager">
          {days.map((_, idx) => (
            <button
              key={idx}
              className={`pager-dot ${idx === activeDayIndex ? "active" : ""}`}
              onClick={() => setActiveDayIndex(idx)}
              disabled={isPending}
            />
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
