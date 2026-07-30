"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import type { AppMessages } from "@/lib/i18n/messages";
import { Toast } from "@/components/ui/Toast";
import s from "./Sudoku.module.css";
import shared from "@/components/GameShared.module.css";
import { useSudokuGame } from "./hooks/useSudokuGame";
import { SudokuGrid } from "./SudokuGrid";
import { SudokuControls } from "./SudokuControls";
import { SudokuNumberPad } from "./SudokuNumberPad";

interface Props {
  messages: AppMessages;
}

export default function SudokuGame({ messages }: Props) {
  const t = messages.sudoku;
  const router = useRouter();
  const numberPadRef = useRef<HTMLDivElement>(null);

  const game = useSudokuGame();
  const {
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
  } = game;

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
      <div className={shared.header}>
        <h2 className={shared.title}>{t.title}</h2>
        <p className={shared.subtitle}>{t.subtitle}</p>
      </div>
      
      <div className={s.container}>
        <SudokuControls
          difficulty={difficulty}
          showCandidates={showCandidates}
          seconds={seconds}
          isPaused={isPaused}
          isGenerating={isGenerating}
          status={status}
          genTimeMs={genTimeMs}
          genGivens={genGivens}
          changeDifficulty={changeDifficulty}
          checkSolution={checkSolution}
          resetBoard={resetBoard}
          setShowCandidates={setShowCandidates}
          togglePause={togglePause}
          t={t}
        />

        <SudokuGrid
          board={board}
          initialPuzzle={initialPuzzle}
          selectedCell={selectedCell}
          checkingCell={checkingCell}
          errorCells={errorCells}
          candidates={candidates}
          isPaused={isPaused}
          isGenerating={isGenerating}
          isShaking={isShaking}
          gameId={gameId}
          handleCellClick={handleCellClick}
          setIsShaking={setIsShaking}
          setIsPaused={setIsPaused}
          t={t}
        />

        <SudokuNumberPad
          ref={numberPadRef}
          placeNumber={placeNumber}
          eraseCell={eraseCell}
        />

        <Toast
          message={t.hasErrors}
          type="error"
          isVisible={showToast}
          onClose={() => setShowToast(false)}
        />

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
