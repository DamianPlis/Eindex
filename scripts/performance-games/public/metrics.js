/* Local lab instrumentation only; never imported by the application. */
(() => {
  const m = (window.gameMetrics = {
    userAgent: navigator.userAgent,
    started: new Date().toISOString(),
    viewport: [innerWidth, innerHeight, devicePixelRatio],
    marks: [],
    actions: [],
    entries: {},
    workers: [],
    draws: [],
    errors: [],
  });
  for (const type of [
    "paint",
    "largest-contentful-paint",
    "layout-shift",
    "longtask",
    "event",
  ]) {
    if (!PerformanceObserver.supportedEntryTypes.includes(type)) continue;
    m.entries[type] = [];
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        const row = e.toJSON();
        delete row.element;
        delete row.sources;
        m.entries[type].push(row);
      }
    }).observe({
      type,
      buffered: true,
      ...(type === "event" ? { durationThreshold: 16 } : {}),
    });
  }
  const OriginalWorker = Worker;
  window.Worker = class extends OriginalWorker {
    constructor(...args) {
      super(...args);
      this.record = {
        created: performance.now(),
        sent: [],
        received: [],
        terminated: null,
      };
      m.workers.push(this.record);
      this.addEventListener("message", () =>
        this.record.received.push(performance.now()),
      );
    }
    postMessage(...args) {
      this.record.sent.push(performance.now());
      return super.postMessage(...args);
    }
    terminate() {
      this.record.terminated = performance.now();
      return super.terminate();
    }
  };
  // Mandala starts each draw by resetting width, finishes by restoring the context.
  const width = Object.getOwnPropertyDescriptor(
    HTMLCanvasElement.prototype,
    "width",
  );
  const starts = new WeakMap();
  Object.defineProperty(HTMLCanvasElement.prototype, "width", {
    ...width,
    set(value) {
      starts.set(this, performance.now());
      width.set.call(this, value);
    },
  });
  const restore = CanvasRenderingContext2D.prototype.restore;
  CanvasRenderingContext2D.prototype.restore = function (...args) {
    const result = restore.apply(this, args);
    const start = starts.get(this.canvas);
    if (start !== undefined) {
      m.draws.push({
        start,
        duration: performance.now() - start,
        width: this.canvas.width,
        cssWidth: this.canvas.getBoundingClientRect().width,
      });
      starts.delete(this.canvas);
    }
    return result;
  };
  addEventListener("error", (e) => m.errors.push(e.message));
  addEventListener(
    "click",
    (e) =>
      m.actions.push({
        at: performance.now(),
        target:
          e.target
            .closest("button, [role=gridcell]")
            ?.getAttribute("aria-label") || e.target.textContent?.slice(0, 60),
        trusted: e.isTrusted,
      }),
    true,
  );
  let wasReady = false;
  new MutationObserver(() => {
    const ready = !!document.querySelector('[role=gridcell][tabindex="0"]');
    if (ready && !wasReady)
      m.marks.push({ name: "sudoku-ready", at: performance.now() });
    wasReady = ready;
  }).observe(document, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["tabindex"],
  });
  window.saveGameMetrics = async () => {
    const body = JSON.stringify({
      ...m,
      capturedAt: performance.now(),
      navigation: performance
        .getEntriesByType("navigation")
        .map((e) => e.toJSON()),
    });
    const response = await fetch("/api/capture", { method: "POST", body });
    document.getElementById("capture-status").textContent = response.ok
      ? "Measurement saved"
      : "Save failed";
  };
})();
