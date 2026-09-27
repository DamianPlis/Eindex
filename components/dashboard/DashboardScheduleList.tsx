import { Suspense, use } from "react";
import SlotBubble from "@/components/layout/SlotBubble";
import SkeletonLine from "@/components/skeletons/SkeletonLine";
import d from "@/components/deadlines/Deadlines.module.css";
import {
  getFixedSlotDisplayName,
  getSubjectDisplayName,
} from "@/lib/schedule/labels";
import type { Slot, Subject } from "@/lib/schedule/types";
import type { AppMessages } from "@/lib/i18n/messages";

type DashboardData = {
  slots: Slot[];
  subjects: Subject[];
};

export type DashboardScheduleListProps = {
  schedulePromise: Promise<DashboardData>;
  lunchPromise: Promise<Record<string, string>>;
  messages: AppMessages;
  selectedDateISO: string;
  isToday: boolean;
};

export default function DashboardScheduleList({
  schedulePromise,
  lunchPromise,
  messages,
  selectedDateISO,
  isToday,
}: DashboardScheduleListProps) {
  const { slots, subjects } = use(schedulePromise);

  return (
    <div className={d.scheduleList}>
      {slots.length > 0 ? (
        slots.map((slot) => {
          const subject = slot.subjectId
            ? subjects.find(
                (stateSubject) => stateSubject.id === slot.subjectId,
              ) || null
            : null;
          const isLunch =
            slot.subjectId === "lunch" ||
            slot.fixedKey === "lunch" ||
            /obed|lunch/i.test(slot.fixedLabel || "");
          const title = slot.fixed
            ? getFixedSlotDisplayName(slot, messages)
            : getSubjectDisplayName(subject, messages) || slot.topic || "-";

          let subtitle = "";
          if (!isLunch && slot.fixed && slot.allowTopic && slot.topic) {
            subtitle = slot.topic;
          } else if (!isLunch && !slot.fixed && slot.topic) {
            subtitle = slot.topic;
          }

          return (
            <SlotBubble
              key={slot.id}
              slot={slot}
              subject={subject}
              isLunch={isLunch}
              lunchText=""
              lunchContent={
                isLunch ? (
                  <Suspense
                    fallback={
                      <SkeletonLine
                        style={{ width: "min(220px, 55vw)", height: 14 }}
                      />
                    }
                  >
                    <LunchMenu
                      lunchPromise={lunchPromise}
                      selectedDateISO={selectedDateISO}
                      unavailableText={messages.home.menuUnavailable}
                    />
                  </Suspense>
                ) : undefined
              }
              title={title}
              subtitle={subtitle}
            />
          );
        })
      ) : (
        <div className={d.emptyState}>
          {isToday
            ? messages.home.noScheduleForToday
            : messages.home.noScheduleForTomorrow}
        </div>
      )}
    </div>
  );
}

function LunchMenu({
  lunchPromise,
  selectedDateISO,
  unavailableText,
}: {
  lunchPromise: Promise<Record<string, string>>;
  selectedDateISO: string;
  unavailableText: string;
}) {
  const lunchPerDay = use(lunchPromise);
  return lunchPerDay[selectedDateISO] || unavailableText || "Menu unavailable";
}
