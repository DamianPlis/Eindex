import { readFile, writeFile } from "node:fs/promises";

const rows = (
  await readFile("docs/performance-evidence/07-browser.jsonl", "utf8")
)
  .trim()
  .split("\n")
  .map(JSON.parse);
const round = (value) => Math.round(value * 1000) / 1000;
function summary(values) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return null;
  const n = sorted.length;
  return {
    n,
    min: round(sorted[0]),
    median: round(
      (sorted[Math.floor((n - 1) / 2)] + sorted[Math.floor(n / 2)]) / 2,
    ),
    p75NearestRank: round(sorted[Math.ceil(n * 0.75) - 1]),
    max: round(sorted[n - 1]),
    samples: values.map(round),
  };
}
const mark = (r, name) => r.marks.find((m) => m.name === name)?.at;
function summarize(records) {
  return {
    n: records.length,
    viewports: [...new Set(records.map((r) => JSON.stringify(r.viewport)))],
    fcp: summary(
      records.map(
        (r) =>
          r.entries.paint.find((e) => e.name === "first-contentful-paint")
            ?.startTime,
      ),
    ),
    lcpAtCapture: summary(
      records.map(
        (r) => r.entries["largest-contentful-paint"].at(-1)?.startTime,
      ),
    ),
    longTasks: records.flatMap((r) => r.entries.longtask),
    clsEligibleShiftSum: summary(
      records.map((r) =>
        r.entries["layout-shift"]
          .filter((e) => !e.hadRecentInput)
          .reduce((v, e) => v + e.value, 0),
      ),
    ),
    clickProcessing: summary(
      records.flatMap((r) =>
        r.entries.event
          .filter((e) => e.name === "click" && e.interactionId)
          .map((e) => e.processingEnd - e.processingStart),
      ),
    ),
    observedInteractionMax: records.map(
      (r) =>
        summary(
          r.entries.event.filter((e) => e.interactionId).map((e) => e.duration),
        )?.max ?? null,
    ),
    draws: summary(records.flatMap((r) => r.draws.map((d) => d.duration))),
  };
}
const sudoku = rows.slice(2, 12);
const result = {
  method:
    "Rows 0-1 pilots; rows 2-11 Sudoku fresh document mounts; rows 12-21 Mandala mounts/regenerations; row 22 synthetic pinch/pan. All durations milliseconds. Null is unavailable, not zero. Shift sum is not a session-window CLS algorithm. Draw durations exclude raster/GPU presentation.",
  sudoku: {
    ...summarize(sudoku),
    mountToPlayableDom: summary(
      sudoku.map((r) => mark(r, "sudoku-ready") - mark(r, "sudoku")),
    ),
    workerCreatedAfterMount: summary(
      sudoku.map((r) => r.workers[0].created - mark(r, "sudoku")),
    ),
    workerTerminated: sudoku.map((r) => r.workers[0].terminated),
    workerMessagesAfterExit: sudoku.map(
      (r) => r.workers[0].received.filter((t) => t > mark(r, "exit")).length,
    ),
  },
  mandala: summarize(rows.slice(12, 22)),
  wheelPilot: summary(rows[0].draws.slice(1).map((d) => d.duration)),
  sudokuInteractionPilot: summarize([rows[1]]),
  syntheticPan: {
    ...summarize(rows.slice(22, 23)),
    elapsed: round(
      mark(rows[22], "synthetic-pinch-pan-end") -
        mark(rows[22], "synthetic-pinch-pan"),
    ),
  },
};
await writeFile(
  "docs/performance-evidence/07-summary.json",
  JSON.stringify(result, null, 2) + "\n",
);
console.log(JSON.stringify(result, null, 2));
