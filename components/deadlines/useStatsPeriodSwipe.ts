"use client";

import { useEffect, useEffectEvent, useRef } from "react";

const CONTROLS = "button, a, input, select, textarea, [data-swipe-ignore]";
const THRESHOLD = 48;

export function useStatsPeriodSwipe(onStep: (direction: number) => void) {
  const cardRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const changePeriod = useEffectEvent(onStep);

  useEffect(() => {
    const card = cardRef.current;
    const content = contentRef.current;
    if (!card || !content) return;

    let start: {
      x: number;
      y: number;
      id: number;
      horizontal: boolean;
    } | null = null;
    let wheelDistance = 0;
    let wheelCommitted = false;
    let wheelTimer: ReturnType<typeof setTimeout>;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const isControl = (event: Event) =>
      (event.target as Element).closest(CONTROLS);

    function move(distance: number) {
      if (!content || reducedMotion.matches) return;
      content.style.transition = "none";
      content.style.transform = `translateX(${Math.max(-60, Math.min(60, distance * 0.4))}px)`;
    }

    function settle(distance = 0) {
      if (!content) return;
      if (Math.abs(distance) >= THRESHOLD) changePeriod(distance < 0 ? 1 : -1);
      content.style.transition = reducedMotion.matches
        ? "none"
        : "transform 180ms ease-out";
      content.style.transform = "";
    }

    function cancel() {
      const pointerId = start?.id;
      start = null;
      if (pointerId !== undefined && card?.hasPointerCapture(pointerId)) {
        card.releasePointerCapture(pointerId);
      }
      settle();
    }

    function down(event: PointerEvent) {
      if (!event.isPrimary) return cancel();
      if (event.button !== 0 || isControl(event)) return;
      start = {
        x: event.clientX,
        y: event.clientY,
        id: event.pointerId,
        horizontal: false,
      };
      card!.setPointerCapture(event.pointerId);
    }

    function pointerMove(event: PointerEvent) {
      if (!start || start.id !== event.pointerId) return;
      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;
      if (!start.horizontal) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 10) return;
        if (Math.abs(dy) >= Math.abs(dx)) return cancel();
        // Choose the axis once. A slow, curved swipe must not lose its capture.
        start.horizontal = true;
      }
      move(dx);
    }

    function up(event: PointerEvent) {
      if (!start || start.id !== event.pointerId) return;
      const distance = start.horizontal ? event.clientX - start.x : 0;
      cancel();
      settle(distance);
    }

    function wheel(event: WheelEvent) {
      if (event.ctrlKey || isControl(event)) return;
      const dx = event.shiftKey && !event.deltaX ? event.deltaY : event.deltaX;
      if (!dx || (!event.shiftKey && Math.abs(dx) <= Math.abs(event.deltaY)))
        return;
      event.preventDefault();
      clearTimeout(wheelTimer);
      // Treat the momentum tail as part of the same gesture.
      wheelTimer = setTimeout(() => {
        wheelDistance = 0;
        wheelCommitted = false;
        settle();
      }, 350);
      if (wheelCommitted) return;
      const unit =
        event.deltaMode === 1
          ? 16
          : event.deltaMode === 2
            ? card!.clientWidth
            : 1;
      wheelDistance -= dx * unit;
      move(wheelDistance);
      if (Math.abs(wheelDistance) >= THRESHOLD) {
        wheelCommitted = true;
        settle(wheelDistance);
      }
    }

    card.addEventListener("pointerdown", down);
    card.addEventListener("pointermove", pointerMove);
    card.addEventListener("pointerup", up);
    card.addEventListener("pointercancel", cancel);
    card.addEventListener("lostpointercapture", cancel);
    card.addEventListener("wheel", wheel, { passive: false });
    return () => {
      clearTimeout(wheelTimer);
      card.removeEventListener("pointerdown", down);
      card.removeEventListener("pointermove", pointerMove);
      card.removeEventListener("pointerup", up);
      card.removeEventListener("pointercancel", cancel);
      card.removeEventListener("lostpointercapture", cancel);
      card.removeEventListener("wheel", wheel);
    };
  }, []);

  return { cardRef, contentRef };
}
