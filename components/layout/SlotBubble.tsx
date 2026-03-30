"use client";

import { useSyncExternalStore } from "react";
import type { Slot, Subject } from "@/lib/schedule/types";
import LunchIcon from "@/icons/restaurant_24dp_999999_FILL0_wght400_GRAD0_opsz24.svg";

function parseRange(timeStr: string) {
  if (!timeStr || !timeStr.includes("-")) return null;
  const [startRaw, endRaw] = timeStr.split("-").map((v) => v.trim());
  const [sh, sm] = startRaw.split(":").map(Number);
  const [eh, em] = endRaw.split(":").map(Number);
  if ([sh, sm, eh, em].some(Number.isNaN)) return null;
  return { start: sh * 60 + sm, end: eh * 60 + em };
}

function isCurrentSlot(timeStr: string) {
  const range = parseRange(timeStr);
  if (!range) return false;
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  return minutes >= range.start && minutes <= range.end;
}

function contrastColor(hex: string) {
  if (!hex || !hex.startsWith("#")) return "#000000";
  const parsed = parseInt(
    hex.slice(1).length === 3 ? hex.slice(1).split("").map((c) => c + c).join("") : hex.slice(1),
    16,
  );
  if (Number.isNaN(parsed)) return "#000000";
  const r = (parsed >> 16) & 255;
  const g = (parsed >> 8) & 255;
  const b = parsed & 255;
  const lum = 0.2126 * (r / 255) + 0.7152 * (g / 255) + 0.0722 * (b / 255);
  return lum > 0.6 ? "#000000" : "#ffffff";
}

type SlotBubbleProps = {
  slot: Slot;
  subject: Subject | null;
  isLunch: boolean;
  lunchText: string;
  title: string;
  subtitle: string;
};

export default function SlotBubble({
  slot,
  subject,
  isLunch,
  lunchText,
  title,
  subtitle,
}: SlotBubbleProps) {
  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const bg = slot.fixed ? "#ff7fbf" : subject?.color || null;
  const style = bg ? { background: bg, color: contrastColor(bg) } : undefined;

  return (
    <div
      key={slot.id}
      className={`slot-bubble ${isHydrated && isCurrentSlot(slot.time) ? "active" : ""}`}
      style={style}
    >
      <div className="slot-content">
        <div>
          <div className="slot-title-text">{title}</div>
          {subtitle ? (
            <div className="slot-subtitle">
              {isLunch && lunchText ? (
                <LunchIcon fill="currentColor" alt="Lunch" height={16} width={16} />
              ) : null}
              {subtitle}
            </div>
          ) : null}
        </div>
        <div className="slot-time-text">{slot.time}</div>
      </div>
    </div>
  );
}
