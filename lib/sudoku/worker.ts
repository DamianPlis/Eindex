import type { Difficulty } from "./sudoku";
import { generatePuzzleWorker } from "./sudoku";

self.onmessage = (e: MessageEvent<{ difficulty: Difficulty }>) => {
  const { difficulty } = e.data;
  
  // Generate the puzzle synchronously (since we're off the main thread)
  const result = generatePuzzleWorker(difficulty);
  
  // Send the result back to the main thread
  self.postMessage({ difficulty, ...result });
};
