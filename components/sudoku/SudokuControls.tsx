import type { Difficulty } from "@/lib/sudoku/sudoku";
import s from "./Sudoku.module.css";
import shared from "@/components/GameShared.module.css";
import ResumeIcon from "@/icons/play.svg";
import PauseIcon from "@/icons/pause.svg";
import UiShared from "@/components/ui/shared.module.css";
import type { AppMessages } from "@/lib/i18n/messages";

interface SudokuControlsProps {
  difficulty: Difficulty;
  showCandidates: boolean;
  seconds: number;
  isPaused: boolean;
  isGenerating: boolean;
  status: "playing" | "solved" | "error" | null;
  genTimeMs: number | null;
  genGivens: number | null;
  changeDifficulty: (diff: Difficulty) => void;
  checkSolution: () => void;
  resetBoard: () => void;
  setShowCandidates: (show: boolean | ((prev: boolean) => boolean)) => void;
  togglePause: () => void;
  t: AppMessages["sudoku"];
}

export function SudokuControls({
  difficulty,
  showCandidates,
  seconds,
  isPaused,
  isGenerating,
  status,
  genTimeMs,
  genGivens,
  changeDifficulty,
  checkSolution,
  resetBoard,
  setShowCandidates,
  togglePause,
  t,
}: SudokuControlsProps) {
  const fmtMins = String(Math.floor(seconds / 60)).padStart(2, "0");
  const fmtSecs = String(seconds % 60).padStart(2, "0");

  return (
    <>
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

      <div className={s.actionButtons}>
        <button className={UiShared.actionBtn} onClick={checkSolution}>
          {t.check}
        </button>
        <button className={shared.resetBtn} onClick={resetBoard}>
          {t.reset}
        </button>
      </div>

      <div className={s.candidatesToggle}>
        <button
          className={
            showCandidates ? s.candidatesToggleBtnActive : s.candidatesToggleBtn
          }
          onClick={() => setShowCandidates((v) => !v)}
        >
          {showCandidates ? t.hideCandidates : t.showCandidates}
        </button>
      </div>

      <div className={s.timerBar}>
        <span className={s.timerLabel}>{t.timer}:</span>
        <span>
          {fmtMins}:{fmtSecs}
        </span>
        <button
          onClick={togglePause}
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
    </>
  );
}
