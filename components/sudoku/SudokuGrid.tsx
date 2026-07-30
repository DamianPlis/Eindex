import type { Board } from "@/lib/sudoku/sudoku";
import s from "./Sudoku.module.css";
import shared from "@/components/GameShared.module.css";
import ResumeIcon from "@/icons/play_arrow_24dp_FFFFFF_FILL0_wght400_GRAD0_opsz24.svg";
import PauseIcon from "@/icons/pause_24dp_FFFFFF_FILL0_wght400_GRAD0_opsz24.svg";
import { AppMessages } from "@/lib/i18n/messages";

interface SudokuGridProps {
  board: Board | null;
  initialPuzzle: Board | null;
  selectedCell: [number, number] | null;
  checkingCell: [number, number] | null;
  errorCells: Set<string>;
  candidates: Set<number>[][] | null;
  isPaused: boolean;
  isGenerating: boolean;
  isShaking: boolean;
  gameId: number;
  handleCellClick: (r: number, c: number) => void;
  setIsShaking: (val: boolean) => void;
  setIsPaused: (val: boolean) => void;
  t: AppMessages["sudoku"];
}

export function SudokuGrid({
  board,
  initialPuzzle,
  selectedCell,
  checkingCell,
  errorCells,
  candidates,
  isPaused,
  isGenerating,
  isShaking,
  gameId,
  handleCellClick,
  setIsShaking,
  setIsPaused,
  t,
}: SudokuGridProps) {
  if (!board) return null;

  return (
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
  );
}
