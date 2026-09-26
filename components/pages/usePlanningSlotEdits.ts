"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { setSlotSubjectAction, setSlotTopicAction } from "@/app/(app)/actions";
import type { DaySchedule, Slot } from "@/lib/schedule/types";
import { getClientId } from "@/lib/sync/client-id";

function computeNextSubjectOverrides(
  current: Record<string, string | null>,
  subjectsBySlot: Record<string, string | null>,
  pendingUpdates: Record<string, string | null>,
) {
  const slotIds = Object.keys(current);
  if (slotIds.length === 0) return current;

  let changed = false;
  const next: Record<string, string | null> = { ...current };
  for (const slotId of slotIds) {
    const hasServerSlot = Object.prototype.hasOwnProperty.call(
      subjectsBySlot,
      slotId,
    );
    if (!hasServerSlot) {
      delete next[slotId];
      delete pendingUpdates[slotId];
      changed = true;
      continue;
    }
    const hasPending = Object.prototype.hasOwnProperty.call(
      pendingUpdates,
      slotId,
    );
    if (hasPending && pendingUpdates[slotId] === subjectsBySlot[slotId]) {
      delete next[slotId];
      delete pendingUpdates[slotId];
      changed = true;
      continue;
    }
    if (!hasPending) {
      delete next[slotId];
      changed = true;
    }
  }
  return changed ? next : current;
}

export function usePlanningSlotEdits(days: DaySchedule[], weekStart: string) {
  const pendingSubjectUpdatesRef = useRef<Record<string, string | null>>({});
  const lastSyncedTopicsRef = useRef<Record<string, string>>({});
  const clientIdRef = useRef("");
  const [, startTransition] = useTransition();
  const [subjectOverrides, setSubjectOverrides] = useState<
    Record<string, string | null>
  >({});
  const [topicOverrides, setTopicOverrides] = useState<Record<string, string>>(
    {},
  );

  useEffect(() => {
    clientIdRef.current = getClientId();
  }, []);

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
    setSubjectOverrides((current) =>
      computeNextSubjectOverrides(
        current,
        subjectsBySlot,
        pendingSubjectUpdatesRef.current,
      ),
    );
  }, [days, weekStart]);

  function currentSubjectValue(slot: Slot): string {
    if (slot.id in subjectOverrides) return subjectOverrides[slot.id] || "";
    return slot.subjectId || "";
  }

  function currentTopicValue(slot: Slot): string {
    if (slot.id in topicOverrides) return topicOverrides[slot.id];
    return slot.topic || "";
  }

  function updateSubject(
    dayIndex: number,
    slotIndex: number,
    slot: Slot,
    subjectId: string | null,
  ) {
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
    setTopicOverrides((current) => ({ ...current, [slot.id]: topic }));
  }

  function commitTopic(
    dayIndex: number,
    slotIndex: number,
    slot: Slot,
    topic: string,
  ) {
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

  function getTopicInputProps(slot: Slot, dayIndex: number, slotIndex: number) {
    return {
      onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
        updateTopicLocal(slot, event.target.value),
      onBlur: (event: React.FocusEvent<HTMLInputElement>) =>
        commitTopic(dayIndex, slotIndex, slot, event.currentTarget.value),
      onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter") event.currentTarget.blur();
      },
    };
  }

  return {
    currentSubjectValue,
    currentTopicValue,
    updateSubject,
    getTopicInputProps,
  };
}
