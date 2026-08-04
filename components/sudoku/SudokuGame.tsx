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

  const fmtMins = String(Math.floor(game.seconds / 60)).padStart(2, "0");
  const fmtSecs = String(game.seconds % 60).padStart(2, "0");

  if (!game.board) {
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
          difficulty={game.difficulty}
          showCandidates={game.showCandidates}
          seconds={game.seconds}
          isPaused={game.isPaused}
          isGenerating={game.isGenerating}
          status={game.status}
          genTimeMs={game.genTimeMs}
          genGivens={game.genGivens}
          changeDifficulty={game.changeDifficulty}
          checkSolution={game.checkSolution}
          resetBoard={game.resetBoard}
          setShowCandidates={game.setShowCandidates}
          togglePause={game.togglePause}
          t={t}
        />

        <SudokuGrid
          board={game.board}
          initialPuzzle={game.initialPuzzle}
          selectedCell={game.selectedCell}
          checkingCell={game.checkingCell}
          errorCells={game.errorCells}
          candidates={game.candidates}
          isPaused={game.isPaused}
          isGenerating={game.isGenerating}
          isShaking={game.feedback.shaking}
          gameId={game.gameId}
          handleCellClick={game.handleCellClick}
          setIsShaking={(v) =>
            game.setFeedback((prev) => ({ ...prev, shaking: v }))
          }
          setIsPaused={game.setIsPaused}
          t={t}
        />

        <SudokuNumberPad
          ref={numberPadRef}
          placeNumber={game.placeNumber}
          eraseCell={game.eraseCell}
        />

        <Toast
          message={t.hasErrors}
          type="error"
          isVisible={game.feedback.toast}
          onClose={() =>
            game.setFeedback((prev) => ({ ...prev, toast: false }))
          }
        />

        {game.feedback.modal && (
          <div
            className={s.modalOverlay}
            onClick={() =>
              game.setFeedback((prev) => ({ ...prev, modal: false }))
            }
          >
            <div className={s.modalCard} onClick={(e) => e.stopPropagation()}>
              <div className={s.modalEmoji}>🎉</div>
              <h3 className={s.modalTitle}>{t.congratsTitle}</h3>
              <p className={s.modalSubtitle}>
                {t.congratsTime} {fmtMins}:{fmtSecs} · {t[game.difficulty]}
              </p>
              <div className={s.modalActions}>
                <button
                  className={s.modalPrimaryBtn}
                  onClick={() => {
                    game.setFeedback((prev) => ({ ...prev, modal: false }));
                    game.startNewGame(game.difficulty);
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

