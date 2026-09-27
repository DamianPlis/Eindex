// @vitest-environment node
import { PassThrough } from "node:stream";
import { createElement, Suspense, type ReactNode } from "react";
import { renderToPipeableStream } from "react-dom/server";
import { expect, test, vi } from "vitest";
import DashboardScheduleList, {
  type DashboardScheduleListProps,
} from "@/components/dashboard/DashboardScheduleList";
import { getMessages } from "@/lib/i18n/messages";
import type { Slot } from "@/lib/schedule/types";

vi.mock("@/components/layout/SlotBubble", async () => {
  const React = await vi.importActual<typeof import("react")>("react");

  return {
    default: ({
      slot,
      title,
      subtitle,
      lunchContent,
    }: {
      slot: Pick<Slot, "id" | "time">;
      title: string;
      subtitle: string;
      lunchContent?: ReactNode;
    }) =>
      React.createElement(
        "article",
        { "data-slot": slot.id },
        title,
        " ",
        slot.time,
        subtitle,
        lunchContent,
      ),
  };
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

test("streams the schedule and lunch skeleton before the delayed menu", async () => {
  const selectedDateISO = "2026-09-28";
  const schedule: Awaited<DashboardScheduleListProps["schedulePromise"]> = {
    slots: [
      {
        id: "lesson",
        time: "08:20-10:20",
        fixed: false,
        fixedKey: null,
        fixedLabel: "",
        allowTopic: false,
        subjectId: null,
        topic: "Fast schedule content",
        updatedAt: 0,
      },
      {
        id: "lunch",
        time: "12:40-13:20",
        fixed: true,
        fixedKey: "lunch",
        fixedLabel: "Obed",
        allowTopic: false,
        subjectId: "lunch",
        topic: "",
        updatedAt: 0,
      },
    ],
    subjects: [],
  };
  const delayedLunch = deferred<Record<string, string>>();
  const output = new PassThrough();
  output.setEncoding("utf8");

  let html = "";
  let resolveSchedule!: (value: string) => void;
  let rejectSchedule!: (reason: unknown) => void;
  const scheduleMarkup = new Promise<string>((resolve, reject) => {
    resolveSchedule = resolve;
    rejectSchedule = reject;
  });
  let resolveComplete!: (value: string) => void;
  const completeMarkup = new Promise<string>((resolve) => {
    resolveComplete = resolve;
  });

  output.on("data", (chunk: string) => {
    html += chunk;
    if (html.includes("Fast schedule content")) resolveSchedule(html);
  });
  output.on("end", () => resolveComplete(html));

  const render = renderToPipeableStream(
    createElement(
      Suspense,
      { fallback: createElement("p", null, "Schedule loading") },
      createElement(DashboardScheduleList, {
        schedulePromise: Promise.resolve(schedule),
        lunchPromise: delayedLunch.promise,
        messages: getMessages("cs"),
        selectedDateISO,
        isToday: false,
      }),
    ),
    {
      onShellReady() {
        render.pipe(output);
      },
      onShellError(error) {
        rejectSchedule(error);
      },
      onError(error) {
        rejectSchedule(error);
      },
    },
  );

  const timeout = setTimeout(
    () =>
      rejectSchedule(
        new Error("Schedule did not stream while lunch was pending"),
      ),
    1000,
  );

  let shell: string;
  try {
    shell = await scheduleMarkup;
    expect(shell).toContain('aria-hidden="true"');
    expect(shell).not.toContain("Delayed lunch menu");
  } finally {
    clearTimeout(timeout);
    delayedLunch.resolve({ [selectedDateISO]: "Delayed lunch menu" });
  }

  expect(await completeMarkup).toContain("Delayed lunch menu");
  render.abort();
});
