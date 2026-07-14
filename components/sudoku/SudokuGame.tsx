"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Board, Difficulty } from "@/lib/sudoku/sudoku";
import {
  cloneBoard,
  getAllCandidates,
  generatePuzzleAsync,
} from "@/lib/sudoku/sudoku";
import { initPool, takeFromPool } from "@/lib/sudoku/pool";
import type { AppMessages } from "@/lib/i18n/messages";
import { Toast } from "@/components/ui/Toast";
import s from "./Sudoku.module.css";
import shared from "@/components/GameShared.module.css";
import EraserIcon from "@/icons/ink_eraser_24dp_FFFFFF_FILL0_wght400_GRAD0_opsz24.svg";
import PauseIcon from "@/icons/pause_24dp_FFFFFF_FILL0_wght400_GRAD0_opsz24.svg";
import ResumeIcon from "@/icons/play_arrow_24dp_FFFFFF_FILL0_wght400_GRAD0_opsz24.svg";

interface Props {
  messages: AppMessages;
}

type GameStatus = "playing" | "solved" | "error" | null;

export default function SudokuGame({ messages }: Props) {
  const t = messages.sudoku;
  const router = useRouter();

  // ── Game state ──
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
  const [seconds, setSeconds] = useState(0);
  const [gameId, setGameId] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [checkingCell, setCheckingCell] = useState<[number, number] | null>(
    null,
  );

  const [genTimeMs, setGenTimeMs] = useState<number | null>(null);
  const [genGivens, setGenGivens] = useState<number | null>(null);

  // ── Error toast + shake state ──
  const [showToast, setShowToast] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  // ── Pause state ──
  const [isPaused, setIsPaused] = useState(false);

  // ── Congrats modal state ──
  const [showModal, setShowModal] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeGenRef = useRef<ReturnType<typeof requestAnimationFrame> | null>(
    null,
  );
  const numberPadRef = useRef<HTMLDivElement>(null);

  // ── New game ──
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

    // Scroll to number pad so it's fully visible on mobile (after a short delay to allow render)
    setTimeout(() => {
      numberPadRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }, 150);

    // Try the pool first — instant puzzle if available
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

    // Pool empty — fall back to async generator with animation
    setIsGenerating(true);
    setCheckingCell(null);

    const gen = generatePuzzleAsync(diff);

    function nextStep() {
      const startTime = performance.now();
      let result = gen.next();

      // Batch generator steps within ~12ms to keep UI responsive and fast
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

  // Initialize on mount
  useEffect(() => {
    startNewGame(difficulty);
    initPool(); // start pre-generating puzzles in the background
    return () => {
      if (activeGenRef.current) {
        cancelAnimationFrame(activeGenRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Timer
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

  // ── Input handling ──
  const handleCellClick = (r: number, c: number) => {
    if (isGenerating) return;
    if (!initialPuzzle || initialPuzzle[r][c] !== 0) return; // can't select givens
    setSelectedCell([r, c]);
    setStatus(null);
  };

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

  // Keyboard input
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
        // Arrow keys
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

  // ── Check solution ──
  const checkSolution = () => {
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
      // ── Solved! ──
      setStatus("solved");
      setShowModal(true);
    } else {
      // ── Errors ──
      setStatus("error");

      // Re-trigger shake and toast by resetting state briefly
      setIsShaking(false);
      setShowToast(false);
      setTimeout(() => {
        setIsShaking(true);
        setShowToast(true);
      }, 10);
    }
  };

  // ── Reset ──
  const resetBoard = () => {
    if (!initialPuzzle) return;
    setBoard(cloneBoard(initialPuzzle));
    setStatus(null);
    setErrorCells(new Set());
    setShowToast(false);
    setIsShaking(false);
  };

  // ── Difficulty change ──
  const changeDifficulty = (diff: Difficulty) => {
    setDifficulty(diff);
    startNewGame(diff);
  };

  // ── Computed candidates ──
  const candidates = board && showCandidates ? getAllCandidates(board) : null;

  // ── Timer formatting ──
  const fmtMins = String(Math.floor(seconds / 60)).padStart(2, "0");
  const fmtSecs = String(seconds % 60).padStart(2, "0");

  if (!board) {
    return (
      <div className={s.container}>
        <div className={shared.header}>
          <h2 className={shared.title}>{t.title}</h2>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className={shared.header}>
        <h2 className={shared.title}>{t.title}</h2>
        <p className={shared.subtitle}>{t.subtitle}</p>
      </div>
      <div className={s.container}>
        {/* Difficulty selector */}
        <div className={s.controls}>
          <div className={s.difficultyGroup}>
            {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
              <button
                key={d}
                className={
                  difficulty === d ? s.difficultyBtnActive : s.difficultyBtn
                }
                onClick={() => changeDifficulty(d)}
              >
                {t[d]}
              </button>
            ))}
          </div>
        </div>

        {/* Bottom actions */}
        <div className={s.actionButtons}>
          <button className={shared.actionBtn} onClick={checkSolution}>
            {t.check}
          </button>
          <button className={shared.resetBtn} onClick={resetBoard}>
            {t.reset}
          </button>
        </div>

        {/* Candidates toggle */}
        <div className={s.candidatesToggle}>
          <button
            className={
              showCandidates
                ? s.candidatesToggleBtnActive
                : s.candidatesToggleBtn
            }
            onClick={() => setShowCandidates((v) => !v)}
          >
            {showCandidates ? t.hideCandidates : t.showCandidates}
          </button>
        </div>

        {/* Timer + Gen time */}
        <div className={s.timerBar}>
          <span className={s.timerLabel}>{t.timer}:</span>
          <span>
            {fmtMins}:{fmtSecs}
          </span>
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={s.pauseBtn}
            aria-label={isPaused ? t.resume : t.pause}
            disabled={isGenerating || status === "solved"}
          >
            {isPaused ? (
              <ResumeIcon width="18" height="18" fill="currentColor" />
            ) : (
              <PauseIcon width="18" height="18" fill="currentColor" />
            )}
          </button>
          {genTimeMs !== null && !isGenerating && (
            <span className={s.genTimeBadge}>
              {genTimeMs >= 1000
                ? `${(genTimeMs / 1000).toFixed(1)}s`
                : `${genTimeMs}ms`}
              {genGivens !== null && ` · ${genGivens} ${t.clues}`}
            </span>
          )}
        </div>

        {/* Grid */}
        <div
          className={`${s.gridWrapper} ${isShaking ? s.gridShake : ""}`}
          onAnimationEnd={() => setIsShaking(false)}
        >
          {isPaused && (
            <div className={s.pausedOverlay}>
              <div className={s.pausedContent}>
                <button
                  onClick={() => setIsPaused(false)}
                  className={shared.buttonPrimary}
                >
                  <ResumeIcon width="48" height="48" fill="currentColor" />
                </button>
                <h3 className={s.pausedText}>
                  {t.paused}{" "}
                  <div className="flex items-center justify-center">
                    <PauseIcon width="24" height="24" fill="currentColor" />
                  </div>
                </h3>
              </div>
            </div>
          )}
          <div
            key={gameId}
            className={s.grid}
            role="grid"
            aria-label="Sudoku grid"
            style={{ visibility: isPaused ? "hidden" : "visible" }}
          >
            {board.map((row, r) =>
              row.map((val, c) => {
                const isGiven = initialPuzzle
                  ? initialPuzzle[r][c] !== 0
                  : val !== 0;
                const isChecking =
                  checkingCell?.[0] === r && checkingCell?.[1] === c;
                const isSelected =
                  selectedCell?.[0] === r && selectedCell?.[1] === c;
                const isHighlighted =
                  selectedCell &&
                  !isSelected &&
                  (selectedCell[0] === r ||
                    selectedCell[1] === c ||
                    (Math.floor(selectedCell[0] / 3) === Math.floor(r / 3) &&
                      Math.floor(selectedCell[1] / 3) === Math.floor(c / 3)));
                const hasError = errorCells.has(`${r}-${c}`);
                const cellCandidates = candidates?.[r]?.[c];
                const showCellCandidates =
                  cellCandidates && cellCandidates.size > 0 && val === 0;

                const classes = [
                  isGiven ? s.cellGiven : s.cell,
                  isSelected ? s.cellSelected : "",
                  isHighlighted ? s.cellHighlighted : "",
                  hasError ? s.cellError : "",
                  !isGiven && val !== 0 ? s.cellUserFilled : "",
                  isChecking ? s.cellChecking : "",
                ]
                  .filter(Boolean)
                  .join(" ");

                return (
                  <div
                    key={`${r}-${c}`}
                    className={classes}
                    role="gridcell"
                    aria-label={`Row ${r + 1}, Column ${c + 1}`}
                    onClick={() => handleCellClick(r, c)}
                    tabIndex={isGiven || isGenerating ? -1 : 0}
                    style={
                      !isGenerating
                        ? { animationDelay: `${(r + c) * 30}ms` }
                        : undefined
                    }
                  >
                    {val !== 0 ? (
                      isGiven && !isGenerating ? (
                        <span
                          className={s.givenNumber}
                          style={{ animationDelay: `${(r + c) * 30 + 200}ms` }}
                        >
                          {val}
                        </span>
                      ) : (
                        val
                      )
                    ) : showCellCandidates ? (
                      <div className={s.candidates}>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                          <span key={n} className={s.candidateNum}>
                            {cellCandidates.has(n) ? n : ""}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              }),
            )}
          </div>
        </div>

        {/* Number pad */}
        <div className={s.numberPad} ref={numberPadRef}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <button key={n} className={s.numBtn} onClick={() => placeNumber(n)}>
              {n}
            </button>
          ))}
          <button
            className={s.numBtnErase}
            onClick={eraseCell}
            aria-label="Erase"
          >
            <EraserIcon fill="currentColor" />
          </button>
        </div>

        {/* Error toast */}
        <Toast
          message={t.hasErrors}
          type="error"
          isVisible={showToast}
          onClose={() => setShowToast(false)}
        />

        {/* Congratulations modal */}
        {showModal && (
          <div className={s.modalOverlay} onClick={() => setShowModal(false)}>
            <div className={s.modalCard} onClick={(e) => e.stopPropagation()}>
              <div className={s.modalEmoji}>🎉</div>
              <h3 className={s.modalTitle}>{t.congratsTitle}</h3>
              <p className={s.modalSubtitle}>
                {t.congratsTime} {fmtMins}:{fmtSecs} · {t[difficulty]}
              </p>
              <div className={s.modalActions}>
                <button
                  className={s.modalPrimaryBtn}
                  onClick={() => {
                    setShowModal(false);
                    startNewGame(difficulty);
                  }}
                >
                  {t.playAgain}
                </button>
                <button
                  className={s.modalSecondaryBtn}
                  onClick={() => router.push("/")}
                >
                  {t.backToApp}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
