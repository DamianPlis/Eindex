/**
 * Sudoku — generate, solve, candidates.
 * Board: 9×9 number[][] where 0 = empty.
 */

export type Board = number[][];
export type Difficulty = "easy" | "medium" | "hard";

const GIVENS: Record<Difficulty, number> = { easy: 38, medium: 30, hard: 22 };

/* ── Helpers ── */

export function cloneBoard(b: Board): Board {
  return b.map((r) => [...r]);
}

function isValid(b: Board, row: number, col: number, num: number): boolean {
  for (let i = 0; i < 9; i++) {
    if (b[row][i] === num || b[i][col] === num) return false;
  }
  const br = Math.floor(row / 3) * 3;
  const bc = Math.floor(col / 3) * 3;
  for (let r = br; r < br + 3; r++)
    for (let c = bc; c < bc + 3; c++) if (b[r][c] === num) return false;
  return true;
}

/** How many valid numbers could go in this cell (0 if filled). */
function candidateCount(b: Board, row: number, col: number): number {
  if (b[row][col] !== 0) return 0;
  let n = 0;
  for (let v = 1; v <= 9; v++) if (isValid(b, row, col, v)) n++;
  return n;
}

/* ── Solver ── */

export function solve(board: Board): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] !== 0) continue;
      for (let num = 1; num <= 9; num++) {
        if (!isValid(board, r, c, num)) continue;
        board[r][c] = num;
        if (solve(board)) return true;
        board[r][c] = 0;
      }
      return false;
    }
  }
  return true;
}

/** Count solutions, bail early at `limit`. */
function countSolutions(b: Board, limit = 2): number {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (b[r][c] !== 0) continue;
      let count = 0;
      for (let num = 1; num <= 9; num++) {
        if (!isValid(b, r, c, num)) continue;
        b[r][c] = num;
        count += countSolutions(b, limit - count);
        b[r][c] = 0;
        if (count >= limit) return count;
      }
      return count;
    }
  }
  return 1;
}

/* ── Generator ── */

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function fillBoard(b: Board): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (b[r][c] !== 0) continue;
      for (const num of shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])) {
        if (!isValid(b, r, c, num)) continue;
        b[r][c] = num;
        if (fillBoard(b)) return true;
        b[r][c] = 0;
      }
      return false;
    }
  }
  return true;
}

/**
 * Scores each filled cell by how safe it is to remove.
 * Cells whose value is more constrained (fewer candidates if emptied,
 * more filled neighbors) are prioritized — they're easiest to
 * re-derive so removing them rarely breaks uniqueness.
 */
function rankCellsForRemoval(puzzle: Board): [number, number][] {
  const cells: { r: number; c: number; score: number }[] = [];

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (puzzle[r][c] === 0) continue;

      // Temporarily empty the cell to count its candidates
      const saved = puzzle[r][c];
      puzzle[r][c] = 0;
      const cands = candidateCount(puzzle, r, c);
      puzzle[r][c] = saved;

      // Fewer candidates = more constrained = safer to remove
      // Add small random jitter to break ties and add variety
      cells.push({ r, c, score: -cands + Math.random() * 0.5 });
    }
  }

  cells.sort((a, b) => b.score - a.score);
  return cells.map(({ r, c }) => [r, c]);
}
let time = 0;
let time2 = 0;
/**
 * Generate a puzzle. Tries to hit the target givens count by:
 *  1. Ranking cells by removal safety (heuristic)
 *  2. Removing them one by one, checking uniqueness each time
 *  3. Re-ranking after each pass (board changed → scores changed)
 *  4. Stopping after 3 seconds no matter what
 */
export function generatePuzzle(difficulty: Difficulty): {
  puzzle: Board;
  solution: Board;
} {
  time = Date.now();
  const solution: Board = Array.from({ length: 9 }, () => Array(9).fill(0));
  fillBoard(solution);
  const puzzle = cloneBoard(solution);

  const target = GIVENS[difficulty];
  let filled = 81;
  const deadline = Date.now() + 3000; // 3s time cap

  for (let pass = 0; pass < 4000 && filled > target; pass++) {
    const order = rankCellsForRemoval(puzzle);

    for (const [r, c] of order) {
      if (filled <= target || Date.now() > deadline) break;
      if (puzzle[r][c] === 0) continue;

      const saved = puzzle[r][c];
      puzzle[r][c] = 0;

      if (countSolutions(cloneBoard(puzzle)) !== 1) {
        puzzle[r][c] = saved;
      } else {
        filled--;
      }
    }
  }
  console.log(
    "finished after x ms",
    Date.now() - time,
    "with y givens",
    filled,
  );
  return { puzzle, solution };
}

export type AsyncGenStep =
  | { type: "progress"; board: Board; checking: [number, number] | null }
  | { type: "done"; puzzle: Board; solution: Board };

/**
 * Async generator version of generatePuzzle that yields progress states.
 */
export function* generatePuzzleAsync(
  difficulty: Difficulty,
): Generator<AsyncGenStep, void, unknown> {
  time2 = Date.now();
  const solution: Board = Array.from({ length: 9 }, () => Array(9).fill(0));
  fillBoard(solution);
  const puzzle = cloneBoard(solution);

  const target = GIVENS[difficulty];
  let filled = 81;
  const deadline = Date.now() + 7000;

  yield { type: "progress", board: cloneBoard(puzzle), checking: null };

  for (let pass = 0; pass < 4000 && filled > target; pass++) {
    const order = rankCellsForRemoval(puzzle);

    for (const [r, c] of order) {
      if (filled <= target || Date.now() > deadline) break;
      if (puzzle[r][c] === 0) continue;

      yield { type: "progress", board: cloneBoard(puzzle), checking: [r, c] };

      const saved = puzzle[r][c];
      puzzle[r][c] = 0;

      if (countSolutions(cloneBoard(puzzle)) !== 1) {
        puzzle[r][c] = saved;
      } else {
        filled--;
      }
    }
  }
  console.log(
    "finished after x ms",
    Date.now() - time2,
    "with y givens",
    filled,
  );
  yield { type: "done", puzzle, solution };
}

/* ── Candidates (used by the UI) ── */

export function getCandidates(b: Board, row: number, col: number): Set<number> {
  if (b[row][col] !== 0) return new Set();
  const s = new Set<number>();
  for (let n = 1; n <= 9; n++) if (isValid(b, row, col, n)) s.add(n);
  return s;
}

export function getAllCandidates(b: Board): Set<number>[][] {
  return b.map((row, r) => row.map((_, c) => getCandidates(b, r, c)));
}

/* ── Benchmark ── */

export function runBenchmark(iterations = 1000) {
  const difficulties: Difficulty[] = ["easy", "medium", "hard"];

  console.log(
    `Starting benchmark for ${iterations} iterations per difficulty...`,
  );

  for (const diff of difficulties) {
    console.log(`\n--- ${diff.toUpperCase()} ---`);
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      if (i > 0 && i % 100 === 0) {
        console.log(
          `Progress: ${i} / ${iterations} (${((i / iterations) * 100).toFixed(1)}%)`,
        );
      }

      const start = Date.now();
      generatePuzzle(diff);
      const end = Date.now();
      times.push(end - start);
    }

    times.sort((a, b) => a - b);

    const sum = times.reduce((a, b) => a + b, 0);
    const avg = sum / times.length;
    const median = times[Math.floor(times.length / 2)];

    // Calculate mode (modulo average)
    const counts = new Map<number, number>();
    let mode = times[0];
    let maxCount = 0;

    for (const t of times) {
      const c = (counts.get(t) || 0) + 1;
      counts.set(t, c);
      if (c > maxCount) {
        maxCount = c;
        mode = t;
      }
    }

    console.log(`\nResults for ${diff} (${iterations} iterations):`);
    console.log(`Average: ${avg.toFixed(2)} ms`);
    console.log(`Median:  ${median} ms`);
    console.log(`Mode:    ${mode} ms (occurred ${maxCount} times)`);
    console.log(`Min:     ${times[0]} ms`);
    console.log(`Max:     ${times[times.length - 1]} ms`);
  }
}
