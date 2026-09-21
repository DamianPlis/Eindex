import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { load } from "cheerio";
import { expect, test } from "vitest";
import { PlanningSlotCard } from "../components/pages/PlanningSlotCard";
import { getMessages } from "../lib/i18n/messages";
import type { Subject } from "../lib/schedule/types";

const subjects: Subject[] = [
  { id: "regular", name: "Regular subject", color: "#ffffff" },
  {
    id: "trip",
    name: "School trip",
    color: "#123456",
    hiddenFromPlanning: true,
  },
];

function renderSlot(currentSubjectValue: string, options = subjects) {
  return load(
    renderToStaticMarkup(
      createElement(PlanningSlotCard, {
        slot: {
          id: "slot",
          time: "08:00",
          fixed: false,
          fixedKey: null,
          fixedLabel: "",
          allowTopic: true,
          subjectId: currentSubjectValue || null,
          topic: "Museum visit",
          updatedAt: 0,
        },
        dayIndex: 0,
        slotIndex: 1,
        subjects: options,
        messages: getMessages("en"),
        currentSubjectValue,
        currentTopicValue: "Museum visit",
        updateSubject: () => {},
        getTopicInputProps: () => ({}),
      }),
    ),
  );
}

test("new slots omit hidden subjects and restored subjects reappear", () => {
  const $ = renderSlot("");
  expect(
    $("option")
      .map((_, el) => $(el).attr("value"))
      .get(),
  ).toEqual(["", "regular"]);
  const restored = renderSlot(
    "",
    subjects.map((s) => ({ ...s, hiddenFromPlanning: false })),
  );
  expect(restored('option[value="trip"]').text()).toBe("School trip");
});

test("existing hidden assignments retain their label, color and topic without appearing as choices", () => {
  const $ = renderSlot("trip");
  expect($("option[selected]").attr("value")).toBe("trip");
  expect($("option[selected]").is("[hidden]")).toBe(true);
  expect(
    $("option:not([hidden])")
      .map((_, el) => $(el).attr("value"))
      .get(),
  ).toEqual(["", "regular"]);
  expect($("div[style]").attr("style")).toContain("background:#123456");
  expect($("div").text()).toContain("School trip");
  expect($("input").attr("value")).toBe("Museum visit");
  expect(renderSlot("regular")('option[value="trip"]').length).toBe(0);
});

test("all subjects can be hidden while the empty selection remains available", () => {
  const $ = renderSlot(
    "",
    subjects.map((s) => ({ ...s, hiddenFromPlanning: true })),
  );
  expect($("option")).toHaveLength(1);
  expect($("option").attr("value")).toBe("");
});
