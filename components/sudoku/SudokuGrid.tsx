import type { Board } from "@/lib/sudoku/sudoku";
import s from "./Sudoku.module.css";
import shared from "@/components/GameShared.module.css";
import ResumeIcon from "@/icons/play.svg";
import PauseIcon from "@/icons/pause.svg";
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
          row.map((val, c) => (
            <SudokuCell
              key={`${r}-${c}`}
              row={r}
              col={c}
              value={val}
              initialValue={initialPuzzle?.[r]?.[c]}
              selectedCell={selectedCell}
              checkingCell={checkingCell}
              hasError={errorCells.has(`${r}-${c}`)}
              candidates={candidates?.[r]?.[c]}
              isGenerating={isGenerating}
              onClick={handleCellClick}
            />
          )),
        )}
      </div>
    </div>
  );
}

function SudokuCell({
  row,
  col,
  value,
  initialValue,
  selectedCell,
  checkingCell,
  hasError,
  candidates,
  isGenerating,
  onClick,
}: {
  row: number;
  col: number;
  value: number;
  initialValue?: number;
  selectedCell: [number, number] | null;
  checkingCell: [number, number] | null;
  hasError: boolean;
  candidates?: Set<number>;
  isGenerating: boolean;
  onClick: (row: number, col: number) => void;
}) {
  const isGiven = initialValue !== undefined ? initialValue !== 0 : value !== 0;
  const isSelected = selectedCell?.[0] === row && selectedCell?.[1] === col;
  const isHighlighted =
    selectedCell &&
    !isSelected &&
    (selectedCell[0] === row ||
      selectedCell[1] === col ||
      (Math.floor(selectedCell[0] / 3) === Math.floor(row / 3) &&
        Math.floor(selectedCell[1] / 3) === Math.floor(col / 3)));
  const classes = [
    isGiven ? s.cellGiven : s.cell,
    isSelected ? s.cellSelected : "",
    isHighlighted ? s.cellHighlighted : "",
    hasError ? s.cellError : "",
    !isGiven && value !== 0 ? s.cellUserFilled : "",
    checkingCell?.[0] === row && checkingCell?.[1] === col
      ? s.cellChecking
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={classes}
      role="gridcell"
      aria-label={`Row ${row + 1}, Column ${col + 1}`}
      onClick={() => onClick(row, col)}
      tabIndex={isGiven || isGenerating ? -1 : 0}
      style={
        !isGenerating ? { animationDelay: `${(row + col) * 30}ms` } : undefined
      }
    >
      {value !== 0 ? (
        isGiven && !isGenerating ? (
          <span
            className={s.givenNumber}
            style={{ animationDelay: `${(row + col) * 30 + 200}ms` }}
          >
            {value}
          </span>
        ) : (
          value
        )
      ) : candidates && candidates.size > 0 ? (
        <div className={s.candidates}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <span key={n} className={s.candidateNum}>
              {candidates.has(n) ? n : ""}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
