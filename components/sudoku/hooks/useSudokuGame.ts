import { useState, useEffect, useCallback, useRef } from "react";
import type { Board, Difficulty } from "@/lib/sudoku/sudoku";
import {
  cloneBoard,
  getAllCandidates,
  generatePuzzleAsync,
  validateBoard,
} from "@/lib/sudoku/sudoku";
import { initPool, takeFromPool } from "@/lib/sudoku/pool";
import { useKeyboardNavigation } from "./useKeyboardNavigation";
import { useGameTimer } from "./useGameTimer";

type GameStatus = "playing" | "solved" | "error" | null;

type FeedbackState = { toast: boolean; shaking: boolean; modal: boolean };

const FEEDBACK_CLEAR: FeedbackState = {
  toast: false,
  shaking: false,
  modal: false,
};

export function useSudokuGame() {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [initialPuzzle, setInitialPuzzle] = useState<Board | null>(null);
  const [solution, setSolution] = useState<Board | null>(null);
  const [board, setBoard] = useState<Board | null>(null);
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(
    null,
  );
  const [showCandidates, setShowCandidates] = useState(false);
  const [status, setStatus] = useState<GameStatus>(null);
  const [errorCells, setErrorCells] = useState<Set<string>>(new Set());
  const [gameId, setGameId] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [checkingCell, setCheckingCell] = useState<[number, number] | null>(
    null,
  );

  const [genTimeMs, setGenTimeMs] = useState<number | null>(null);
  const [genGivens, setGenGivens] = useState<number | null>(null);

  const [feedback, setFeedback] = useState<FeedbackState>(FEEDBACK_CLEAR);

  const activeGenRef = useRef<ReturnType<typeof requestAnimationFrame> | null>(
    null,
  );

  /* ── Timer ── */

  const timerShouldRun =
    status !== "solved" && !isGenerating && board !== null;
  const { seconds, isPaused, setIsPaused, togglePause, resetTimer } =
    useGameTimer({ shouldRun: timerShouldRun });

  /* ── Game generation ── */

  const applyPuzzle = useCallback(
    (entry: {
      puzzle: Board;
      solution: Board;
      elapsedMs: number;
      finalGivens: number;
    }) => {
      setInitialPuzzle(entry.puzzle);
      setSolution(entry.solution);
      setBoard(cloneBoard(entry.puzzle));
      setIsGenerating(false);
      setCheckingCell(null);
      setGenTimeMs(entry.elapsedMs);
      setGenGivens(entry.finalGivens);
      setGameId((id) => id + 1);
    },
    [],
  );

  const startNewGame = useCallback(
    (diff: Difficulty) => {
      if (activeGenRef.current) {
        cancelAnimationFrame(activeGenRef.current);
        activeGenRef.current = null;
      }

      setSelectedCell(null);
      setStatus(null);
      setErrorCells(new Set());
      setGenTimeMs(null);
      setGenGivens(null);
      setFeedback(FEEDBACK_CLEAR);
      resetTimer();

      const poolEntry = takeFromPool(diff);
      if (poolEntry) {
        applyPuzzle(poolEntry);
        return;
      }

      setIsGenerating(true);
      setCheckingCell(null);

      const gen = generatePuzzleAsync(diff);

      function nextStep() {
        const startTime = performance.now();
        let result = gen.next();

        while (!result.done && result.value.type === "progress") {
          if (performance.now() - startTime > 12) {
            setBoard(result.value.board);
            setCheckingCell(result.value.checking);
            activeGenRef.current = requestAnimationFrame(nextStep);
            return;
          }
          result = gen.next();
        }

        if (result.done) {
          setIsGenerating(false);
          setCheckingCell(null);
          return;
        }

        if (result.value.type === "done") {
          applyPuzzle(result.value);
        }
      }

      nextStep();
    },
    [applyPuzzle, resetTimer],
  );

  useEffect(() => {
    startNewGame(difficulty);
    initPool();
    return () => {
      if (activeGenRef.current) {
        cancelAnimationFrame(activeGenRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Cell interactions ── */

  const handleCellClick = useCallback(
    (r: number, c: number) => {
      if (isGenerating) return;
      if (!initialPuzzle || initialPuzzle[r][c] !== 0) return;
      setSelectedCell([r, c]);
      setStatus(null);
    },
    [initialPuzzle, isGenerating],
  );

  const placeNumber = useCallback(
    (num: number) => {
      if (isGenerating) return;
      if (!board || !selectedCell || !initialPuzzle) return;
      const [r, c] = selectedCell;
      if (initialPuzzle[r][c] !== 0) return;

      const newBoard = cloneBoard(board);
      newBoard[r][c] = num;
      setBoard(newBoard);
      setStatus(null);
      setErrorCells(new Set());
    },
    [board, selectedCell, initialPuzzle, isGenerating],
  );

  const eraseCell = useCallback(() => {
    placeNumber(0);
  }, [placeNumber]);

  /* ── Keyboard ── */

  useKeyboardNavigation({
    placeNumber,
    eraseCell,
    selectedCell,
    setSelectedCell,
    board,
    isGenerating,
  });

  /* ── Check & reset ── */

  const checkSolution = useCallback(() => {
    if (!board || !solution) return;

    const { errors, allFilled } = validateBoard(board, solution);
    setErrorCells(errors);

    if (errors.size === 0 && allFilled) {
      setStatus("solved");
      setFeedback({ toast: false, shaking: false, modal: true });
    } else {
      setStatus("error");
      setFeedback(FEEDBACK_CLEAR);
      setTimeout(() => {
        setFeedback({ toast: true, shaking: true, modal: false });
      }, 10);
    }
  }, [board, solution]);

  const resetBoard = useCallback(() => {
    if (!initialPuzzle) return;
    setBoard(cloneBoard(initialPuzzle));
    setStatus(null);
    setErrorCells(new Set());
    setFeedback(FEEDBACK_CLEAR);
  }, [initialPuzzle]);

  const changeDifficulty = useCallback(
    (diff: Difficulty) => {
      setDifficulty(diff);
      startNewGame(diff);
    },
    [startNewGame],
  );

  /* ── Derived ── */

  const candidates = board && showCandidates ? getAllCandidates(board) : null;

  return {
    difficulty,
    board,
    initialPuzzle,
    selectedCell,
    showCandidates,
    setShowCandidates,
    status,
    errorCells,
    seconds,
    gameId,
    isGenerating,
    checkingCell,
    genTimeMs,
    genGivens,
    feedback,
    setFeedback,
    isPaused,
    setIsPaused,
    togglePause,
    handleCellClick,
    placeNumber,
    eraseCell,
    checkSolution,
    resetBoard,
    changeDifficulty,
    startNewGame,
    candidates,
  };
}
