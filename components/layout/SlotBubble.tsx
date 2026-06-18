"use client";

import { useSyncExternalStore } from "react";
import { useMessages } from "@/components/i18n/UserSyncProvider";
import type { Slot, Subject } from "@/lib/schedule/types";
import { parseTimeRange } from "@/lib/schedule/date-utils";
import LunchIcon from "@/icons/restaurant_24dp_999999_FILL0_wght400_GRAD0_opsz24.svg"
import s from "./SlotBubble.module.css";

function isCurrentSlot(timeStr: string) {
  const range = parseTimeRange(timeStr);
  if (!range) return false;
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  return minutes >= range.start && minutes <= range.end;
}

function contrastColor(hex: string) {
  if (!hex || !hex.startsWith("#")) return "#000000";
  const parsed = parseInt(
    hex.slice(1).length === 3
      ? hex
          .slice(1)
          .split("")
          .map((c) => c + c)
          .join("")
      : hex.slice(1),
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
  const messages = useMessages();
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
      className={isHydrated && isCurrentSlot(slot.time) ? s.slotBubbleActive : s.slotBubble}
      style={style}
    >
      <div className={s.slotContent}>
        <div>
          <div className={s.slotTitleText}>{title}</div>
          {subtitle && isLunch && lunchText ? (
            <div className={s.slotSubtitle}>
              <LunchIcon
                fill="currentColor"
                alt={messages.planning.fixedSlots.lunch}
                height={16}
                width={16}
              />
              <div className={s.slotSubtitleFlex}>{subtitle}</div>
            </div>
          ) : subtitle ? (
            <div className={s.slotSubtitle}>{subtitle}</div>
          ) : null}
        </div>
        <div className={s.slotTimeText}>{slot.time}</div>
      </div>
    </div>
  );
}
