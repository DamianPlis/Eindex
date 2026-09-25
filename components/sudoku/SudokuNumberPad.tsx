import { forwardRef } from "react";
import s from "./Sudoku.module.css";
import EraserIcon from "@/icons/eraser.svg";

interface SudokuNumberPadProps {
  placeNumber: (n: number) => void;
  eraseCell: () => void;
}

export const SudokuNumberPad = forwardRef<HTMLDivElement, SudokuNumberPadProps>(
  ({ placeNumber, eraseCell }, ref) => {
    return (
      <div className={s.numberPad} ref={ref}>
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
    );
  },
);

SudokuNumberPad.displayName = "SudokuNumberPad";
