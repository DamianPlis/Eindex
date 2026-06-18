/**
 * Sudoku puzzle generator, solver, and candidate calculator.
 *
 * Board format: 9×9 number[][] where 0 = empty cell.
 */

export type Board = number[][];
export type Difficulty = "easy" | "medium" | "hard";

/** How many cells to leave filled (givens) per difficulty. */
const GIVENS: Record<Difficulty, number> = {
  easy: 38,
  medium: 30,
  hard: 25,
};

/* ────────────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────────────── */

function emptyBoard(): Board {
  return Array.from({ length: 9 }, () => Array(9).fill(0));
}

export function cloneBoard(board: Board): Board {
  return board.map((row) => [...row]);
}

/** Checks whether placing `num` at (row, col) violates Sudoku rules. */
function isValid(board: Board, row: number, col: number, num: number): boolean {
  // Row check
  for (let c = 0; c < 9; c++) {
    if (board[row][c] === num) return false;
  }
  // Column check
  for (let r = 0; r < 9; r++) {
    if (board[r][col] === num) return false;
  }
  // 3×3 box check
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if (board[r][c] === num) return false;
    }
  }
  return true;
}

/* ────────────────────────────────────────────────────
   Solver (backtracking)
   ──────────────────────────────────────────────────── */

/** Solves `board` in place. Returns true if a solution exists. */
export function solve(board: Board): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] !== 0) continue;

      // Try numbers in shuffled order for variety during generation
      for (let num = 1; num <= 9; num++) {
        if (!isValid(board, r, c, num)) continue;
        board[r][c] = num;
        if (solve(board)) return true;
        board[r][c] = 0;
      }
      return false; // backtrack
    }
  }
  return true; // all cells filled
}

/** Counts the number of solutions (stops at 2 to save time). */
function countSolutions(board: Board, limit = 2): number {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] !== 0) continue;
      let count = 0;
      for (let num = 1; num <= 9; num++) {
        if (!isValid(board, r, c, num)) continue;
        board[r][c] = num;
        count += countSolutions(board, limit - count);
        board[r][c] = 0;
        if (count >= limit) return count;
      }
      return count;
    }
  }
  return 1; // board is fully solved
}

/* ────────────────────────────────────────────────────
   Generator
   ──────────────────────────────────────────────────── */

/** Fisher-Yates shuffle. */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Generates a fully-solved random board. */
function generateFullBoard(): Board {
  const board = emptyBoard();
  fillBoard(board);
  return board;
}

/** Fills the board using backtracking with shuffled candidates for randomness. */
function fillBoard(board: Board): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] !== 0) continue;
      const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
      for (const num of nums) {
        if (!isValid(board, r, c, num)) continue;
        board[r][c] = num;
        if (fillBoard(board)) return true;
        board[r][c] = 0;
      }
      return false;
    }
  }
  return true;
}

/**
 * Generates a Sudoku puzzle.
 *
 * @returns An object with the puzzle (with blanks) and the full solution.
 */
export function generatePuzzle(difficulty: Difficulty): {
  puzzle: Board;
  solution: Board;
} {
  const solution = generateFullBoard();
  const puzzle = cloneBoard(solution);

  const givens = GIVENS[difficulty];
  const totalCells = 81;
  let toRemove = totalCells - givens;

  // Create a shuffled list of all cell positions
  const positions = shuffle(
    Array.from({ length: 81 }, (_, i) => [Math.floor(i / 9), i % 9] as [number, number]),
  );

  for (const [r, c] of positions) {
    if (toRemove <= 0) break;
    if (puzzle[r][c] === 0) continue;

    const saved = puzzle[r][c];
    puzzle[r][c] = 0;

    // Ensure the puzzle still has a unique solution
    const check = cloneBoard(puzzle);
    if (countSolutions(check) !== 1) {
      puzzle[r][c] = saved; // put it back
    } else {
      toRemove--;
    }
  }

  return { puzzle, solution };
}

/* ────────────────────────────────────────────────────
   Candidates
   ──────────────────────────────────────────────────── */

/**
 * Returns the set of valid candidate numbers for a given cell.
 * Returns an empty set if the cell is already filled.
 */
export function getCandidates(board: Board, row: number, col: number): Set<number> {
  if (board[row][col] !== 0) return new Set();

  const candidates = new Set<number>();
  for (let num = 1; num <= 9; num++) {
    if (isValid(board, row, col, num)) {
      candidates.add(num);
    }
  }
  return candidates;
}

/**
 * Returns a full 9×9 grid of candidate sets.
 */
export function getAllCandidates(board: Board): Set<number>[][] {
  return board.map((row, r) =>
    row.map((_, c) => getCandidates(board, r, c)),
  );
}
