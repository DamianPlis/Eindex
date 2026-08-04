/**
 * Sudoku — generate, solve, candidates.
 * Board: 9×9 number[][] where 0 = empty.
 */

export type Board = number[][];
export type Difficulty = "easy" | "medium" | "hard";

const GIVENS: Record<Difficulty, number> = {
  easy: 38,
  medium: 30,
  hard: 25,
};
const TIME_CAP = 3000;

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

/* ── Solver ── */

function solve(board: Board): boolean {
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

function tryRemoveCell(puzzle: Board, r: number, c: number): boolean {
  if (puzzle[r][c] === 0) return false;
  const saved = puzzle[r][c];
  puzzle[r][c] = 0;
  if (countSolutions(cloneBoard(puzzle)) !== 1) {
    puzzle[r][c] = saved;
    return false;
  }
  return true;
}

/**
 * Generate a puzzle with NO time cap — keeps going until it hits the
 * target givens. Yields periodically so the caller can avoid blocking
 * the main thread. Used by the background pool.
 */
/**
 * Synchronous puzzle generator specifically meant to be run inside a Web Worker.
 * It loops until it hits the target givens. Since it's off the main thread,
 * it runs at full speed without needing to yield.
 */
export function generatePuzzleWorker(difficulty: Difficulty): {
  puzzle: Board;
  solution: Board;
  elapsedMs: number;
  finalGivens: number;
} {
  const TOTAL_START = Date.now();
  const target = GIVENS[difficulty];
  const ITERATION_LIMIT = 300;

  while (true) {
    const solution: Board = Array.from({ length: 9 }, () => Array(9).fill(0));
    fillBoard(solution);
    const puzzle = cloneBoard(solution);

    let filled = 81;
    let iterations = 0;

    for (let pass = 0; pass < 10000 && filled > target; pass++) {
      const order = shuffle(
        Array.from(
          { length: 81 },
          (_, i) => [Math.floor(i / 9), i % 9] as [number, number],
        ),
      );

      for (const [r, c] of order) {
        if (filled <= target || iterations >= ITERATION_LIMIT) break;
        if (puzzle[r][c] === 0) continue;

        iterations++;

        if (tryRemoveCell(puzzle, r, c)) {
          filled--;
        }
      }

      if (iterations >= ITERATION_LIMIT) break;
    }

    if (filled <= target) {
      const elapsed = Date.now() - TOTAL_START;
      return { puzzle, solution, elapsedMs: elapsed, finalGivens: filled };
    }

    // console.log(
    //   `[sudoku worker] ${difficulty} hit iteration limit (${ITERATION_LIMIT}), restarting...`,
    // );
  }
}

export type AsyncGenStep =
  | { type: "progress"; board: Board; checking: [number, number] | null }
  | {
      type: "done";
      puzzle: Board;
      solution: Board;
      elapsedMs: number;
      finalGivens: number;
    };

/**
 * Async generator version — yields progress states so the UI can
 * animate cell removal in real-time.
 */
export function* generatePuzzleAsync(
  difficulty: Difficulty,
): Generator<AsyncGenStep, void, unknown> {
  const start = Date.now();
  const solution: Board = Array.from({ length: 9 }, () => Array(9).fill(0));
  fillBoard(solution);
  const puzzle = cloneBoard(solution);

  const target = GIVENS[difficulty];
  let filled = 81;
  const deadline = Date.now() + TIME_CAP;

  yield { type: "progress", board: cloneBoard(puzzle), checking: null };

  for (let pass = 0; pass < 4000 && filled > target; pass++) {
    const order = shuffle(
      Array.from(
        { length: 81 },
        (_, i) => [Math.floor(i / 9), i % 9] as [number, number],
      ),
    );

    for (const [r, c] of order) {
      if (filled <= target || Date.now() > deadline) break;
      if (puzzle[r][c] === 0) continue;

      yield { type: "progress", board: cloneBoard(puzzle), checking: [r, c] };

      if (tryRemoveCell(puzzle, r, c)) {
        filled--;
      }
    }
  }
  const elapsed = Date.now() - start;
  // console.log(
  //   `[sudoku] ${difficulty} async generated in ${elapsed}ms — ${filled} givens`,
  // );
  yield {
    type: "done",
    puzzle,
    solution,
    elapsedMs: elapsed,
    finalGivens: filled,
  };
}

/* ── Validation ── */

export function validateBoard(
  board: Board,
  solution: Board,
): { errors: Set<string>; allFilled: boolean } {
  const errors = new Set<string>();
  let allFilled = true;

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] === 0) {
        allFilled = false;
      } else if (board[r][c] !== solution[r][c]) {
        errors.add(`${r}-${c}`);
      }
    }
  }

  return { errors, allFilled };
}

/* ── Candidates (used by the UI) ── */

function getCandidates(b: Board, row: number, col: number): Set<number> {
  if (b[row][col] !== 0) return new Set();
  const s = new Set<number>();
  for (let n = 1; n <= 9; n++) if (isValid(b, row, col, n)) s.add(n);
  return s;
}

export function getAllCandidates(b: Board): Set<number>[][] {
  return b.map((row, r) => row.map((_, c) => getCandidates(b, r, c)));
}
