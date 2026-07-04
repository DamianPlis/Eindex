"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import s from "./Mandala.module.css";
import u from "@/components/ui/shared.module.css";

// Soothing pastel palette for coloring
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
  "#FFFFFF",
  "#E0E0E0",
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

type Props = { messages: any };

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

// ── Shape builders ─────────────────────────────────
// Each builds a Path2D in "mandala space":
//   Origin = mandala center.
//   Shape sits along the -Y axis (pointing "up").
//   innerR / outerR = radial distance from origin.
//   angHalf = π / symmetry = half the angular slice available.

function buildPetal(
  innerR: number,
  outerR: number,
  angHalf: number,
): Path2D {
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

function buildDiamond(
  innerR: number,
  outerR: number,
  angHalf: number,
): Path2D {
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

function buildArch(
  innerR: number,
  outerR: number,
  angHalf: number,
): Path2D {
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

function buildFlame(
  innerR: number,
  outerR: number,
  angHalf: number,
): Path2D {
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

const FEATURE_TYPES: readonly FeatureType[] = [
  "petal",
  "roundPetal",
  "diamond",
  "arch",
  "teardrop",
  "flame",
];

function generateConfig(): MandalaConfig {
  const symmetry = pick([6, 8, 10, 12] as const);
  const centerR = randFloat(14, 22);
  const rings: RingConfig[] = [];

  let r = centerR;
  const numFeatureRings = randInt(4, 7);
  let lastType: FeatureType | "" = "";

  for (let i = 0; i < numFeatureRings; i++) {
    // Gap before feature ring
    r += randFloat(5, 12);

    // Pick a feature type, never repeat the previous one
    let type: FeatureType;
    do {
      type = pick(FEATURE_TYPES);
    } while (type === lastType);
    lastType = type;

    // Feature ring height scales slightly with radius for visual balance
    const baseH = randFloat(22, 42);
    const h = baseH * (1 + r / 800);
    rings.push({ type, innerR: r, outerR: r + h });
    r += h;

    // Dot ring between features (65% chance, not after the last ring)
    if (i < numFeatureRings - 1 && Math.random() > 0.35) {
      r += randFloat(4, 8);
      const dotH = randFloat(5, 12);
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
      // Place a dot at each symmetry position
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
      // Feature shapes — build one at angle 0, rotate copies with DOMMatrix
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

// ── Component ──────────────────────────────────────

export default function MandalaGame({ messages }: Props) {
  const t = messages.mandala;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [config, setConfig] = useState<MandalaConfig | null>(null);
  const [coloredPaths, setColoredPaths] = useState<Record<string, string>>({});
  const [selectedColor, setSelectedColor] = useState(PALETTE[0]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedCfg = localStorage.getItem("eindex-mandala-config");
      const savedClr = localStorage.getItem("eindex-mandala-colors");

      let cfg: MandalaConfig | null = null;
      if (savedCfg) {
        const parsed = JSON.parse(savedCfg);
        // Validate it has the current format (not the old { slices, layers })
        if (parsed && Array.isArray(parsed.rings) && parsed.symmetry && parsed.centerR) {
          cfg = parsed;
        }
      }
      setConfig(cfg ?? generateConfig());
      if (savedClr) setColoredPaths(JSON.parse(savedClr));
    } catch {
      setConfig(generateConfig());
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (!isLoaded || !config) return;
    localStorage.setItem("eindex-mandala-config", JSON.stringify(config));
    localStorage.setItem(
      "eindex-mandala-colors",
      JSON.stringify(coloredPaths),
    );
  }, [config, coloredPaths, isLoaded]);

  // Build Path2D regions from config
  const regions = useMemo(
    () => (config ? buildRegions(config) : []),
    [config],
  );

  // Compute a consistent scale factor to fit the mandala in the canvas
  const getScale = useCallback(
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
    canvas.width = cs; // Resets transform to identity
    canvas.height = cs;

    const style = getComputedStyle(document.body);
    const strokeColor =
      style.getPropertyValue("--border-medium").trim() || "rgba(0,0,0,0.12)";
    const scale = getScale(cs);

    ctx.save();
    ctx.translate(cs / 2, cs / 2);
    ctx.scale(scale, scale);
    ctx.lineWidth = 1.2 / scale;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    // Draw separator circles at ring boundaries
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

    // Draw clickable regions (fill + stroke)
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
  }, [config, regions, coloredPaths, getScale]);

  // Redraw whenever draw dependencies change
  useEffect(() => {
    draw();
  }, [draw]);

  // Handle canvas clicks
  // FIX: Reset CTM to identity before isPointInPath so the browser doesn't
  // double-inverse-transform the already-converted coordinates.
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !config) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Convert mouse position to canvas-pixel coordinates
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    // Convert canvas-pixel coords → mandala-space coords
    const scale = getScale(canvas.width);
    const ptX = (x - canvas.width / 2) / scale;
    const ptY = (y - canvas.height / 2) / scale;

    // Reset the canvas transform so isPointInPath checks against raw path coords
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Check paths in reverse order (outermost first when shapes overlap)
    for (let i = regions.length - 1; i >= 0; i--) {
      if (ctx.isPointInPath(regions[i].path, ptX, ptY)) {
        setColoredPaths((prev) => ({
          ...prev,
          [regions[i].id]: selectedColor,
        }));
        break;
      }
    }

    ctx.restore();
  };

  const handleReset = () => {
    setColoredPaths({});
  };

  const handleNewGame = () => {
    setConfig(generateConfig());
    setColoredPaths({});
  };

  if (!isLoaded) return null;

  return (
    <div className={s.pageContainer}>
      <header className={s.header}>
        <h1 className={s.title}>{t.title}</h1>
        <p className={s.subtitle}>{t.subtitle}</p>
      </header>

      <div className={s.gameArea}>
        <div className={s.mandalaContainer}>
          <canvas
            ref={canvasRef}
            className={s.canvas}
            onClick={handleCanvasClick}
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
          </div>
        </div>

        <div className={s.actions}>
          <button
            className={`${s.actionBtn} ${s.actionBtnSecondary}`}
            onClick={handleNewGame}
          >
            {t.newGame}
          </button>
          <button
            className={`${s.actionBtn} ${s.actionBtnSecondary}`}
            onClick={handleReset}
          >
            {t.reset}
          </button>
          <Link href="/" className={`${u.primaryButton}`}>
            {messages.sudoku.backToApp}
          </Link>
        </div>
      </div>
    </div>
  );
}
