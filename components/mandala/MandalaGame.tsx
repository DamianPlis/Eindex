"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import s from "./Mandala.module.css";
import shared from "@/components/GameShared.module.css";
import UiShared from "@/components/ui/shared.module.css";

// Sentinel value for the eraser tool — never stored in localStorage
const ERASER = "__eraser__";

// Soothing pastel palette for coloring (no white/gray — use the eraser instead)
const PALETTE = [
  "#FFB3BA",
  "#FFDFBA",
  "#FFFFBA",
  "#BAFFC9",
  "#BAE1FF",
  "#E6B3FF",
  "#FFB3E6",
  "#B3FFF0",
  "#FFD1B3",
  "#D1B3FF",
  "#F4C2C2",
  "#C8E6C9",
];

// ── Types ──────────────────────────────────────────

type FeatureType =
  | "petal"
  | "roundPetal"
  | "diamond"
  | "arch"
  | "teardrop"
  | "flame";

interface RingConfig {
  type: FeatureType | "dots";
  innerR: number;
  outerR: number;
}

interface MandalaConfig {
  symmetry: number;
  centerR: number;
  rings: RingConfig[];
}

interface ClickableRegion {
  id: string;
  path: Path2D;
}

interface ViewTransform {
  zoom: number;
  panX: number;
  panY: number;
}

type Props = {
  messages: {
    mandala: {
      title: string;
      subtitle: string;
      newGame: string;
      reset: string;
      colors: string;
      eraser?: string;
    };
  };
};

// ── Helpers ────────────────────────────────────────

function randFloat(min: number, max: number) {
  return min + Math.random() * (max - min);
}
function randInt(min: number, max: number) {
  return Math.floor(randFloat(min, max + 1));
}
function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

// ── Shape builders ─────────────────────────────────
// Each builds a Path2D in "mandala space":
//   Origin = mandala center.
//   Shape sits along the -Y axis (pointing "up").
//   innerR / outerR = radial distance from origin.
//   angHalf = π / symmetry = half the angular slice available.

function buildPetal(innerR: number, outerR: number, angHalf: number): Path2D {
  const p = new Path2D();
  const h = outerR - innerR;
  const midR = innerR + h * 0.4;
  const bulge = Math.sin(angHalf) * midR * 0.82;

  p.moveTo(0, -innerR);
  p.quadraticCurveTo(bulge, -midR, 0, -outerR);
  p.quadraticCurveTo(-bulge, -midR, 0, -innerR);
  p.closePath();
  return p;
}

function buildRoundPetal(
  innerR: number,
  outerR: number,
  angHalf: number,
): Path2D {
  const p = new Path2D();
  const h = outerR - innerR;
  const bulge = Math.sin(angHalf) * (innerR + h * 0.5) * 0.88;

  p.moveTo(0, -innerR);
  p.bezierCurveTo(
    bulge,
    -(innerR + h * 0.2),
    bulge * 0.65,
    -(outerR - h * 0.08),
    0,
    -outerR,
  );
  p.bezierCurveTo(
    -bulge * 0.65,
    -(outerR - h * 0.08),
    -bulge,
    -(innerR + h * 0.2),
    0,
    -innerR,
  );
  p.closePath();
  return p;
}

function buildDiamond(innerR: number, outerR: number, angHalf: number): Path2D {
  const p = new Path2D();
  const midR = (innerR + outerR) / 2;
  const halfW = Math.sin(angHalf) * midR * 0.72;

  p.moveTo(0, -innerR);
  p.lineTo(halfW, -midR);
  p.lineTo(0, -outerR);
  p.lineTo(-halfW, -midR);
  p.closePath();
  return p;
}

function buildArch(innerR: number, outerR: number, angHalf: number): Path2D {
  const p = new Path2D();
  const halfW = Math.sin(angHalf) * innerR * 0.88;

  p.moveTo(-halfW, -innerR);
  p.quadraticCurveTo(-halfW * 0.35, -outerR, 0, -outerR);
  p.quadraticCurveTo(halfW * 0.35, -outerR, halfW, -innerR);
  p.lineTo(-halfW, -innerR);
  p.closePath();
  return p;
}

function buildTeardrop(
  innerR: number,
  outerR: number,
  angHalf: number,
): Path2D {
  const p = new Path2D();
  const h = outerR - innerR;
  const wide = Math.sin(angHalf) * (innerR + h * 0.3) * 0.82;
  const narrow = wide * 0.3;

  p.moveTo(0, -innerR);
  p.quadraticCurveTo(wide, -(innerR + h * 0.4), 0, -outerR);
  p.quadraticCurveTo(-narrow, -(innerR + h * 0.6), 0, -innerR);
  p.closePath();
  return p;
}

function buildFlame(innerR: number, outerR: number, angHalf: number): Path2D {
  const p = new Path2D();
  const h = outerR - innerR;
  const w = Math.sin(angHalf) * innerR * 0.58;

  p.moveTo(0, -innerR);
  p.bezierCurveTo(
    w * 1.4,
    -(innerR + h * 0.22),
    w * 0.5,
    -(innerR + h * 0.72),
    0,
    -outerR,
  );
  p.bezierCurveTo(
    -w * 0.5,
    -(innerR + h * 0.72),
    -w * 1.4,
    -(innerR + h * 0.22),
    0,
    -innerR,
  );
  p.closePath();
  return p;
}

function buildShape(
  type: FeatureType,
  innerR: number,
  outerR: number,
  angHalf: number,
): Path2D {
  switch (type) {
    case "petal":
      return buildPetal(innerR, outerR, angHalf);
    case "roundPetal":
      return buildRoundPetal(innerR, outerR, angHalf);
    case "diamond":
      return buildDiamond(innerR, outerR, angHalf);
    case "arch":
      return buildArch(innerR, outerR, angHalf);
    case "teardrop":
      return buildTeardrop(innerR, outerR, angHalf);
    case "flame":
      return buildFlame(innerR, outerR, angHalf);
  }
}

// ── Mandala configuration generation ───────────────
// Mobile-first: fewer symmetry slices → bigger shapes → easier to tap.
// Dot rings have a guaranteed minimum radius so they never become 1px specks.

const FEATURE_TYPES: readonly FeatureType[] = [
  "petal",
  "roundPetal",
  "diamond",
  "arch",
  "teardrop",
  "flame",
];

function generateConfig(): MandalaConfig {
  // Lower symmetry = bigger individual shapes = easier to tap on mobile
  const symmetry = pick([6, 8, 10] as const);
  const centerR = randFloat(18, 26);
  const rings: RingConfig[] = [];

  let r = centerR;
  const numFeatureRings = randInt(3, 5);
  let lastType: FeatureType | "" = "";

  for (let i = 0; i < numFeatureRings; i++) {
    // Gap before feature ring
    r += randFloat(6, 14);

    // Pick a feature type, never repeat the previous one
    let type: FeatureType;
    do {
      type = pick(FEATURE_TYPES);
    } while (type === lastType);
    lastType = type;

    // Feature ring height — generous minimum so shapes are big enough to tap
    const baseH = randFloat(30, 50);
    const h = baseH * (1 + r / 900);
    rings.push({ type, innerR: r, outerR: r + h });
    r += h;

    // Dot ring between features (55% chance, not after the last ring)
    if (i < numFeatureRings - 1 && Math.random() > 0.45) {
      r += randFloat(5, 10);
      // Minimum dot diameter of 10 units so they're tappable on mobile
      const dotH = randFloat(10, 18);
      rings.push({ type: "dots", innerR: r, outerR: r + dotH });
      r += dotH;
    }
  }

  return { symmetry, centerR, rings };
}

// ── Build clickable Path2D regions ─────────────────

function buildRegions(config: MandalaConfig): ClickableRegion[] {
  const regions: ClickableRegion[] = [];
  const angHalf = Math.PI / config.symmetry;

  // Center circle
  const cp = new Path2D();
  cp.arc(0, 0, config.centerR, 0, Math.PI * 2);
  regions.push({ id: "center", path: cp });

  config.rings.forEach((ring, rIdx) => {
    if (ring.type === "dots") {
      const dotR = (ring.outerR - ring.innerR) / 2;
      const dotDist = ring.innerR + dotR;

      for (let i = 0; i < config.symmetry; i++) {
        const angle = (i * 2 * Math.PI) / config.symmetry;
        const dp = new Path2D();
        dp.arc(
          Math.sin(angle) * dotDist,
          -Math.cos(angle) * dotDist,
          dotR,
          0,
          Math.PI * 2,
        );
        regions.push({ id: `r${rIdx}-${i}`, path: dp });
      }
    } else {
      const base = buildShape(ring.type, ring.innerR, ring.outerR, angHalf);

      for (let i = 0; i < config.symmetry; i++) {
        const deg = (i * 360) / config.symmetry;
        const tp = new Path2D();
        tp.addPath(base, new DOMMatrix().rotate(deg));
        regions.push({ id: `r${rIdx}-${i}`, path: tp });
      }
    }
  });

  return regions;
}

// ── Pinch-to-zoom / pan helpers ────────────────────

function getTouchDistance(
  t1: { clientX: number; clientY: number },
  t2: { clientX: number; clientY: number },
): number {
  return Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
}

function getTouchCenter(
  t1: { clientX: number; clientY: number },
  t2: { clientX: number; clientY: number },
): { x: number; y: number } {
  return { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 };
}

// ── Component ──────────────────────────────────────

export default function MandalaGame({ messages }: Props) {
  const t = messages.mandala;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [config, setConfig] = useState<MandalaConfig | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const savedCfg = localStorage.getItem("eindex-mandala-config");
      if (savedCfg) {
        const parsed = JSON.parse(savedCfg);
        if (
          parsed &&
          Array.isArray(parsed.rings) &&
          parsed.symmetry &&
          parsed.centerR
        ) {
          return parsed;
        }
      }
    } catch {}
    return generateConfig();
  });

  const [coloredPaths, setColoredPaths] = useState<Record<string, string>>(
    () => {
      if (typeof window === "undefined") return {};
      try {
        const savedClr = localStorage.getItem("eindex-mandala-colors");
        if (savedClr) return JSON.parse(savedClr);
      } catch {}
      return {};
    },
  );

  const [selectedColor, setSelectedColor] = useState(PALETTE[0]);
  const [isLoaded, setIsLoaded] = useState(false);

  // View transform for pinch-to-zoom and pan
  const [view, setView] = useState<ViewTransform>({
    zoom: 1,
    panX: 0,
    panY: 0,
  });

  // Touch gesture tracking refs (mutable, no re-renders needed)
  const gestureRef = useRef<{
    initialDist: number;
    initialZoom: number;
    initialPanX: number;
    initialPanY: number;
    centerX: number;
    centerY: number;
    isSingleFinger: boolean;
    lastSingleX: number;
    lastSingleY: number;
    didMove: boolean;
  } | null>(null);

  // Set loaded on mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoaded(true);
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (!isLoaded || !config) return;
    localStorage.setItem("eindex-mandala-config", JSON.stringify(config));
    localStorage.setItem("eindex-mandala-colors", JSON.stringify(coloredPaths));
  }, [config, coloredPaths, isLoaded]);

  // Build Path2D regions from config
  const regions = useMemo(() => (config ? buildRegions(config) : []), [config]);

  // Compute the base scale (mandala fills the canvas at zoom=1)
  const getBaseScale = useCallback(
    (canvasSize: number) => {
      if (!config || config.rings.length === 0) return 1;
      const maxR = Math.max(
        config.centerR,
        ...config.rings.map((r) => r.outerR),
      );
      return (canvasSize / 2 - 20) / Math.max(80, maxR);
    },
    [config],
  );

  // Draw the mandala onto the canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !config) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cs = 800;
    canvas.width = cs;
    canvas.height = cs;

    const style = getComputedStyle(document.body);
    const strokeColor =
      style.getPropertyValue("--muted").trim() || "rgba(0,0,0,0.12)";
    const baseScale = getBaseScale(cs);

    ctx.save();
    // Apply view transform: first translate to center, then apply pan, then zoom + base scale
    ctx.translate(
      cs / 2 + view.panX * (cs / 400),
      cs / 2 + view.panY * (cs / 400),
    );
    ctx.scale(baseScale * view.zoom, baseScale * view.zoom);
    ctx.lineWidth = 1.2 / (baseScale * view.zoom);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    // Draw separator circles
    const circleRadii = new Set<number>();
    circleRadii.add(config.centerR);
    for (const ring of config.rings) {
      circleRadii.add(ring.innerR);
      circleRadii.add(ring.outerR);
    }
    ctx.strokeStyle = strokeColor;
    for (const r of circleRadii) {
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Draw clickable regions
    for (const { id, path } of regions) {
      const color = coloredPaths[id];
      if (color) {
        ctx.fillStyle = color;
        ctx.fill(path);
      }
      ctx.strokeStyle = strokeColor;
      ctx.stroke(path);
    }

    ctx.restore();
  }, [
    config,
    regions,
    coloredPaths,
    getBaseScale,
    view.zoom,
    view.panX,
    view.panY,
    isLoaded,
  ]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Convert a screen-space point (relative to canvas element) to mandala-space
  const screenToMandala = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } | null => {
      const canvas = canvasRef.current;
      if (!canvas || !config) return null;

      const rect = canvas.getBoundingClientRect();
      const canvasX = (clientX - rect.left) * (canvas.width / rect.width);
      const canvasY = (clientY - rect.top) * (canvas.height / rect.height);

      const cs = canvas.width;
      const baseScale = getBaseScale(cs);
      const totalScale = baseScale * view.zoom;

      const ptX = (canvasX - cs / 2 - view.panX * (cs / 400)) / totalScale;
      const ptY = (canvasY - cs / 2 - view.panY * (cs / 400)) / totalScale;

      return { x: ptX, y: ptY };
    },
    [config, getBaseScale, view.zoom, view.panX, view.panY],
  );

  // Handle click / tap on a shape
  const hitTest = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const pt = screenToMandala(clientX, clientY);
      if (!pt) return;

      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      for (let i = regions.length - 1; i >= 0; i--) {
        if (ctx.isPointInPath(regions[i].path, pt.x, pt.y)) {
          const regionId = regions[i].id;
          if (selectedColor === ERASER) {
            // Eraser: remove the color entirely so the region is transparent
            setColoredPaths((prev) => {
              const next = { ...prev };
              delete next[regionId];
              return next;
            });
          } else {
            setColoredPaths((prev) => ({ ...prev, [regionId]: selectedColor }));
          }
          break;
        }
      }

      ctx.restore();
    },
    [regions, selectedColor, screenToMandala],
  );

  // Mouse click handler
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    hitTest(e.clientX, e.clientY);
  };

  // ── Touch gesture handlers (pinch-to-zoom + pan + tap-to-color) ──

  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault();

      if (e.touches.length === 2) {
        const d = getTouchDistance(e.touches[0], e.touches[1]);
        const c = getTouchCenter(e.touches[0], e.touches[1]);
        gestureRef.current = {
          initialDist: d,
          initialZoom: view.zoom,
          initialPanX: view.panX,
          initialPanY: view.panY,
          centerX: c.x,
          centerY: c.y,
          isSingleFinger: false,
          lastSingleX: 0,
          lastSingleY: 0,
          didMove: false,
        };
      } else if (e.touches.length === 1) {
        gestureRef.current = {
          initialDist: 0,
          initialZoom: view.zoom,
          initialPanX: view.panX,
          initialPanY: view.panY,
          centerX: e.touches[0].clientX,
          centerY: e.touches[0].clientY,
          isSingleFinger: true,
          lastSingleX: e.touches[0].clientX,
          lastSingleY: e.touches[0].clientY,
          didMove: false,
        };
      }
    },
    [view.zoom, view.panX, view.panY],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const g = gestureRef.current;
      if (!g) return;

      if (e.touches.length === 2 && !g.isSingleFinger) {
        // Pinch-to-zoom + two-finger pan
        const d = getTouchDistance(e.touches[0], e.touches[1]);
        const c = getTouchCenter(e.touches[0], e.touches[1]);

        const zoomRatio = d / g.initialDist;
        const newZoom = clamp(g.initialZoom * zoomRatio, 0.5, 6);

        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();

        const dx = ((c.x - g.centerX) / rect.width) * 400;
        const dy = ((c.y - g.centerY) / rect.height) * 400;

        setView({
          zoom: newZoom,
          panX: g.initialPanX + dx,
          panY: g.initialPanY + dy,
        });
        g.didMove = true;
      } else if (
        e.touches.length === 1 &&
        g.isSingleFinger &&
        view.zoom > 1.05
      ) {
        // Single-finger pan (only when zoomed in)
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();

        const dx = ((e.touches[0].clientX - g.lastSingleX) / rect.width) * 400;
        const dy = ((e.touches[0].clientY - g.lastSingleY) / rect.height) * 400;

        g.lastSingleX = e.touches[0].clientX;
        g.lastSingleY = e.touches[0].clientY;

        setView((prev) => ({
          ...prev,
          panX: prev.panX + dx,
          panY: prev.panY + dy,
        }));
        g.didMove = true;
      }
    },
    [view.zoom],
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const g = gestureRef.current;
      if (!g) return;

      // If the finger didn't move, treat it as a tap (color the shape)
      if (g.isSingleFinger && !g.didMove && e.changedTouches.length === 1) {
        hitTest(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
      }

      gestureRef.current = null;
    },
    [hitTest],
  );

  // Mouse wheel zoom (desktop)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setView((prev) => ({
        ...prev,
        zoom: clamp(prev.zoom * delta, 0.5, 6),
      }));
    };

    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", handleWheel);
  }, [isLoaded]);

  const handleReset = () => {
    setColoredPaths({});
  };

  const handleNewGame = () => {
    setConfig(generateConfig());
    setColoredPaths({});
    setView({ zoom: 1, panX: 0, panY: 0 });
  };

  // Double-tap to reset zoom
  const lastTapRef = useRef(0);
  const handleDoubleTapReset = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      setView({ zoom: 1, panX: 0, panY: 0 });
    }
    lastTapRef.current = now;
  }, []);

  if (!isLoaded) return null;

  return (
    <div className={s.pageContainer}>
      <header className={shared.header}>
        <h1 className={shared.title}>{t.title}</h1>
        <p className={shared.subtitle}>{t.subtitle}</p>
      </header>
      <div className={shared.actions}>
        <button className={UiShared.actionBtn} onClick={handleNewGame}>
          {t.newGame}
        </button>
        <button className={shared.resetBtn} onClick={handleReset}>
          {t.reset}
        </button>
      </div>

      <div className={s.gameArea}>
        <div className={s.mandalaContainer}>
          <canvas
            ref={canvasRef}
            className={s.canvas}
            onClick={handleCanvasClick}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            aria-label="Procedural Mandala Canvas"
          />
        </div>

        <div className={s.palette}>
          <span className={s.colorsLabel}>{t.colors}</span>
          <div className={s.colorGrid}>
            {PALETTE.map((color) => (
              <button
                key={color}
                className={`${s.colorBtn} ${
                  selectedColor === color ? s.colorBtnSelected : ""
                }`}
                style={{ backgroundColor: color }}
                aria-label={`Select color ${color}`}
                onClick={() => setSelectedColor(color)}
              />
            ))}
            {/* Eraser button */}
            <button
              className={`${s.colorBtn} ${s.eraserBtn} ${
                selectedColor === ERASER ? s.colorBtnSelected : ""
              }`}
              aria-label={t.eraser ?? "Eraser"}
              onClick={() => setSelectedColor(ERASER)}
              onDoubleClick={handleDoubleTapReset}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
