import { useState, useEffect, useRef, useCallback } from "react";

interface UseGameTimerOptions {
  shouldRun: boolean;
}

export function useGameTimer({ shouldRun }: UseGameTimerOptions) {
  const [seconds, setSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!shouldRun || isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [shouldRun, isPaused]);

  const togglePause = useCallback(() => {
    setIsPaused((p) => !p);
  }, []);

  const resetTimer = useCallback(() => {
    setSeconds(0);
    setIsPaused(false);
  }, []);

  return { seconds, isPaused, setIsPaused, togglePause, resetTimer };
}
