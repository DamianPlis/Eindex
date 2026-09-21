import React from "react";
import {
  getFixedSlotDisplayName,
  getSubjectDisplayName,
} from "@/lib/schedule/labels";
import type { Slot, Subject } from "@/lib/schedule/types";
import type { AppMessages } from "@/lib/i18n/messages";
import s from "./PlanningPageClient.module.css";
import u from "@/components/ui/shared.module.css";

function safeHexToRgb(hex: string) {
  let h = (hex || "").trim();
  if (h.startsWith("#")) h = h.slice(1);
  if (h.length === 3)
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  if (h.length !== 6) return null;
  const n = Number.parseInt(h, 16);
  if (Number.isNaN(n)) return null;
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function contrastForHex(hex: string, fallback = "#000000") {
  const rgb = safeHexToRgb(hex);
  if (!rgb) return fallback;
  const lum =
    0.2126 * (rgb.r / 255) + 0.7152 * (rgb.g / 255) + 0.0722 * (rgb.b / 255);
  return lum > 0.6 ? "#000000" : "#ffffff";
}

interface PlanningSlotCardProps {
  slot: Slot;
  dayIndex: number;
  slotIndex: number;
  subjects: Subject[];
  messages: AppMessages;
  currentSubjectValue: string;
  currentTopicValue: string;
  updateSubject: (
    dayIndex: number,
    slotIndex: number,
    slot: Slot,
    subjectId: string | null,
  ) => void;
  getTopicInputProps: (
    slot: Slot,
    dayIndex: number,
    slotIndex: number,
  ) => React.InputHTMLAttributes<HTMLInputElement>;
}

export function PlanningSlotCard({
  slot,
  dayIndex,
  slotIndex,
  subjects,
  messages,
  currentSubjectValue,
  currentTopicValue,
  updateSubject,
  getTopicInputProps,
}: PlanningSlotCardProps) {
  const isFixed = slot.fixed;
  const selectedSubject =
    !isFixed && currentSubjectValue
      ? subjects.find((subject) => subject.id === currentSubjectValue) || null
      : null;
  const slotBackground = isFixed ? "#ff7fbf" : selectedSubject?.color || null;
  const slotStyle = slotBackground
    ? {
        background: slotBackground,
        color: contrastForHex(slotBackground, "#000000"),
      }
    : undefined;
  const slotTitle = isFixed
    ? getFixedSlotDisplayName(slot, messages)
    : getSubjectDisplayName(selectedSubject, messages) || "-";
  const topicValue = currentTopicValue;
  const isFixedTopicSameAsLabel =
    isFixed &&
    Boolean(topicValue) &&
    Boolean(slot.fixedLabel) &&
    topicValue.trim().toLowerCase() === slot.fixedLabel!.trim().toLowerCase();
  const displayedFixedTopic = isFixedTopicSameAsLabel ? "" : topicValue;

  return (
    <div className={s.slotCard} style={slotStyle}>
      <div className={s.slotTop}>
        <div className={s.slotTitle}>{slotTitle}</div>
        <div className={s.slotTime}>{slot.time}</div>
      </div>

      <div className={s.slotBody}>
        {!isFixed ? (
          <>
            <select
              className={u.formInput}
              value={currentSubjectValue}
              onChange={(event) => {
                const value = event.target.value;
                updateSubject(dayIndex, slotIndex, slot, value || null);
              }}
            >
              <option value="">- {messages.planning.selectSubject} -</option>
              {selectedSubject?.hiddenFromPlanning ? (
                <option value={selectedSubject.id} hidden>
                  {getSubjectDisplayName(selectedSubject, messages)}
                </option>
              ) : null}
              {subjects
                .filter((subject) => !subject.hiddenFromPlanning)
                .map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {getSubjectDisplayName(subject, messages)}
                  </option>
                ))}
            </select>

            <input
              className={u.formInput}
              type="text"
              value={topicValue}
              {...getTopicInputProps(slot, dayIndex, slotIndex)}
              placeholder={messages.planning.topicOptional}
            />
          </>
        ) : null}

        {isFixed && slot.allowTopic ? (
          <input
            className={u.formInput}
            type="text"
            value={displayedFixedTopic}
            {...getTopicInputProps(slot, dayIndex, slotIndex)}
            placeholder={`${messages.planning.topicFor} ${getFixedSlotDisplayName(slot, messages)}`}
          />
        ) : null}
      </div>
    </div>
  );
}
