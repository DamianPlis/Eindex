import { useEffect } from "react";
import type { Board } from "@/lib/sudoku/sudoku";

interface UseKeyboardNavigationOptions {
  placeNumber: (num: number) => void;
  eraseCell: () => void;
  selectedCell: [number, number] | null;
  setSelectedCell: (cell: [number, number] | null) => void;
  board: Board | null;
  isGenerating: boolean;
}

export function useKeyboardNavigation({
  placeNumber,
  eraseCell,
  selectedCell,
  setSelectedCell,
  board,
  isGenerating,
}: UseKeyboardNavigationOptions) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (isGenerating) return;

      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= 9) {
        placeNumber(num);
        return;
      }

      if (e.key === "Backspace" || e.key === "Delete" || e.key === "0") {
        eraseCell();
        return;
      }

      if (e.key === "Escape") {
        setSelectedCell(null);
        return;
      }

      if (!selectedCell || !board) return;

      let [r, c] = selectedCell;
      switch (e.key) {
        case "ArrowUp":
          if (r > 0) r--;
          break;
        case "ArrowDown":
          if (r < 8) r++;
          break;
        case "ArrowLeft":
          if (c > 0) c--;
          break;
        case "ArrowRight":
          if (c < 8) c++;
          break;
        default:
          return;
      }
      e.preventDefault();
      setSelectedCell([r, c]);
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [placeNumber, eraseCell, selectedCell, setSelectedCell, board, isGenerating]);
}
