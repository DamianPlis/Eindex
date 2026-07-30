import { useState, useEffect, useCallback, useRef } from "react";
import type { Board, Difficulty } from "@/lib/sudoku/sudoku";
import {
  cloneBoard,
  getAllCandidates,
  generatePuzzleAsync,
} from "@/lib/sudoku/sudoku";
import { initPool, takeFromPool } from "@/lib/sudoku/pool";

export type GameStatus = "playing" | "solved" | "error" | null;

export function useSudokuGame() {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [initialPuzzle, setInitialPuzzle] = useState<Board | null>(null);
  const [solution, setSolution] = useState<Board | null>(null);
  const [board, setBoard] = useState<Board | null>(null);
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [showCandidates, setShowCandidates] = useState(false);
  const [status, setStatus] = useState<GameStatus>(null);
  const [errorCells, setErrorCells] = useState<Set<string>>(new Set());
  const [seconds, setSeconds] = useState(0);
  const [gameId, setGameId] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [checkingCell, setCheckingCell] = useState<[number, number] | null>(null);

  const [genTimeMs, setGenTimeMs] = useState<number | null>(null);
  const [genGivens, setGenGivens] = useState<number | null>(null);

  const [showToast, setShowToast] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeGenRef = useRef<ReturnType<typeof requestAnimationFrame> | null>(null);

  const startNewGame = useCallback((diff: Difficulty) => {
    if (activeGenRef.current) {
      cancelAnimationFrame(activeGenRef.current);
      activeGenRef.current = null;
    }

    setSelectedCell(null);
    setStatus(null);
    setErrorCells(new Set());
    setSeconds(0);
    setGenTimeMs(null);
    setGenGivens(null);
    setShowToast(false);
    setIsShaking(false);
    setShowModal(false);
    setIsPaused(false);

    const poolEntry = takeFromPool(diff);
    if (poolEntry) {
      setInitialPuzzle(poolEntry.puzzle);
      setSolution(poolEntry.solution);
      setBoard(cloneBoard(poolEntry.puzzle));
      setIsGenerating(false);
      setCheckingCell(null);
      setGenTimeMs(poolEntry.elapsedMs);
      setGenGivens(poolEntry.finalGivens);
      setGameId((id) => id + 1);
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
        setInitialPuzzle(result.value.puzzle);
        setSolution(result.value.solution);
        setBoard(cloneBoard(result.value.puzzle));
        setIsGenerating(false);
        setCheckingCell(null);
        setGenTimeMs(result.value.elapsedMs);
        setGenGivens(result.value.finalGivens);
        setGameId((id) => id + 1);
      }
    }

    nextStep();
  }, []);

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

  useEffect(() => {
    if (status === "solved" || isGenerating || !board || isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status, board, isGenerating, isPaused]);

  const handleCellClick = useCallback((r: number, c: number) => {
    if (isGenerating) return;
    if (!initialPuzzle || initialPuzzle[r][c] !== 0) return;
    setSelectedCell([r, c]);
    setStatus(null);
  }, [initialPuzzle, isGenerating]);

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

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (isGenerating) return;
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= 9) {
        placeNumber(num);
      } else if (e.key === "Backspace" || e.key === "Delete" || e.key === "0") {
        eraseCell();
      } else if (e.key === "Escape") {
        setSelectedCell(null);
      } else if (selectedCell && board) {
        let [r, c] = selectedCell;
        if (e.key === "ArrowUp" && r > 0) r--;
        else if (e.key === "ArrowDown" && r < 8) r++;
        else if (e.key === "ArrowLeft" && c > 0) c--;
        else if (e.key === "ArrowRight" && c < 8) c++;
        else return;
        e.preventDefault();
        setSelectedCell([r, c]);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [placeNumber, eraseCell, selectedCell, board, isGenerating]);

  const checkSolution = useCallback(() => {
    if (!board || !solution) return;
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

    setErrorCells(errors);

    if (errors.size === 0 && allFilled) {
      setStatus("solved");
      setShowModal(true);
    } else {
      setStatus("error");
      setIsShaking(false);
      setShowToast(false);
      setTimeout(() => {
        setIsShaking(true);
        setShowToast(true);
      }, 10);
    }
  }, [board, solution]);

  const resetBoard = useCallback(() => {
    if (!initialPuzzle) return;
    setBoard(cloneBoard(initialPuzzle));
    setStatus(null);
    setErrorCells(new Set());
    setShowToast(false);
    setIsShaking(false);
  }, [initialPuzzle]);

  const changeDifficulty = useCallback((diff: Difficulty) => {
    setDifficulty(diff);
    startNewGame(diff);
  }, [startNewGame]);

  const togglePause = useCallback(() => {
    setIsPaused((p) => !p);
  }, []);

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
    showToast,
    setShowToast,
    isShaking,
    setIsShaking,
    isPaused,
    setIsPaused,
    togglePause,
    showModal,
    setShowModal,
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
