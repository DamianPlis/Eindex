"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { DaySchedule } from "@/lib/schedule/types";

const MOBILE_PLANNING_MEDIA_QUERY = "(max-width: 899px)";

function scrollToDay(
  container: HTMLDivElement,
  dayIndex: number,
  behavior: ScrollBehavior,
) {
  const day = container.children.item(dayIndex);
  if (!day) return false;
  const left =
    container.scrollLeft +
    day.getBoundingClientRect().left -
    container.getBoundingClientRect().left;
  try {
    container.scrollTo({ left, behavior });
  } catch {
    container.scrollLeft = left;
  }
  return true;
}

export function usePlanningDayScroll(days: DaySchedule[], weekStart: string) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeDayIndexRef = useRef(0);
  const fromObserver = useRef(false);
  const skipNextScroll = useRef(false);
  const [activeDayIndex, setActiveDayIndex] = useState(0);

  useEffect(() => {
    activeDayIndexRef.current = activeDayIndex;
  }, [activeDayIndex]);

  useLayoutEffect(() => {
    if (!window.matchMedia(MOBILE_PLANNING_MEDIA_QUERY).matches) return;
    const container = containerRef.current;
    if (!container || days.length === 0) return;
    const mondayBasedIndex = new Date().getDay() - 1;
    const currentIndex =
      mondayBasedIndex >= 0 && mondayBasedIndex < days.length
        ? mondayBasedIndex
        : 0;
    if (!scrollToDay(container, currentIndex, "auto")) return;
    activeDayIndexRef.current = currentIndex;
    skipNextScroll.current = true;
    const frame = requestAnimationFrame(() => setActiveDayIndex(currentIndex));
    window.scrollTo({ top: 0, behavior: "auto" });
    return () => cancelAnimationFrame(frame);
  }, [days.length, weekStart]);

  useEffect(() => {
    if (!window.matchMedia(MOBILE_PLANNING_MEDIA_QUERY).matches) return;
    if (skipNextScroll.current) {
      skipNextScroll.current = false;
      return;
    }
    const container = containerRef.current;
    if (!container) return;
    if (fromObserver.current) {
      fromObserver.current = false;
      return;
    }
    scrollToDay(container, activeDayIndex, "smooth");
  }, [activeDayIndex, weekStart]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !days) return;
    const observer = new IntersectionObserver(
      (entries) => {
        let mostVisibleIndex = 0;
        let highestRatio = 0;
        entries.forEach((entry) => {
          if (entry.intersectionRatio > highestRatio) {
            highestRatio = entry.intersectionRatio;
            mostVisibleIndex = Array.from(container.children).indexOf(
              entry.target,
            );
          }
        });
        if (
          mostVisibleIndex !== -1 &&
          mostVisibleIndex !== activeDayIndexRef.current
        ) {
          fromObserver.current = true;
          setActiveDayIndex(mostVisibleIndex);
        }
      },
      { root: container, threshold: [0.51] },
    );
    Array.from(container.children).forEach((child) => observer.observe(child));
    return () => observer.disconnect();
  }, [days]);

  return { containerRef, activeDayIndex, setActiveDayIndex };
}
