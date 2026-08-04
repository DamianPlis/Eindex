/**
 * Puzzle Pool — pre-generates puzzles in the background so the user
 * always gets an instant puzzle when they click "New Game".
 *
 * Generates one puzzle at a time via setTimeout to avoid blocking the
 * main thread for too long. Keeps POOL_SIZE puzzles per difficulty.
 */

import type { Board, Difficulty } from "./sudoku";

const POOL_SIZE = 5;
const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

export interface PoolEntry {
  puzzle: Board;
  solution: Board;
  elapsedMs: number;
  finalGivens: number;
}

/** The pool: difficulty → array of ready puzzles */
const pool: Record<Difficulty, PoolEntry[]> = {
  easy: [],
  medium: [],
  hard: [],
};

let worker: Worker | null = null;
let isGenerating = false;

/** Take a puzzle from the pool. Returns null if empty. */
export function takeFromPool(difficulty: Difficulty): PoolEntry | null {
  const entry = pool[difficulty].shift() ?? null;

  // Schedule a refill if it is needed
  if (pool[difficulty].length < POOL_SIZE) {
    scheduleRefill();
  }
  return entry;
}

/** Start filling the pool in the background using a Web Worker */
export function initPool(): void {
  // Only initialize the worker once, and only on the client side
  if (typeof window !== "undefined" && !worker) {
    worker = new Worker(new URL("./worker.ts", import.meta.url));

    worker.onmessage = (
      e: MessageEvent<PoolEntry & { difficulty: Difficulty }>,
    ) => {
      const { difficulty, puzzle, solution, elapsedMs, finalGivens } = e.data;

      pool[difficulty].push({ puzzle, solution, elapsedMs, finalGivens });

      // console.log(
      //   `[pool] ${difficulty}: ${pool[difficulty].length}/${POOL_SIZE} (generated in worker in ${elapsedMs}ms, ${finalGivens} givens)`,
      // );

      isGenerating = false;
      scheduleRefill();
    };
  }

  scheduleRefill();
}

/**
 * Ask the worker to generate a puzzle for the first difficulty that needs one.
 */
function scheduleRefill(): void {
  if (isGenerating || !worker) return;

  const diff = DIFFICULTIES.find((d) => pool[d].length < POOL_SIZE);

  if (!diff) return; // All pools are full

  isGenerating = true;
  worker.postMessage({ difficulty: diff });
}
