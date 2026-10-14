"use client";

import { useState } from "react";
import SudokuGame from "@/components/sudoku/SudokuGame";
import MandalaGame from "@/components/mandala/MandalaGame";
import { enMessages } from "@/lib/i18n/messages/en";

export default function Page() {
  const [game, setGame] = useState(null);
  function select(value) {
    window.gameMetrics.marks.push({
      name: value ?? "exit",
      at: performance.now(),
    });
    setGame(value);
  }
  async function replayPan() {
    const canvas = document.querySelector("canvas");
    if (!canvas) return;
    window.gameMetrics.marks.push({
      name: "synthetic-pinch-pan",
      at: performance.now(),
    });
    const { x, y } = canvas.getBoundingClientRect();
    const touch = (id, dx, dy) =>
      new Touch({
        identifier: id,
        target: canvas,
        clientX: x + dx,
        clientY: y + dy,
      });
    const send = (type, touches) =>
      canvas.dispatchEvent(
        new TouchEvent(type, {
          bubbles: true,
          cancelable: true,
          touches,
          changedTouches: touches,
        }),
      );
    send("touchstart", [touch(1, 180, 200), touch(2, 220, 200)]);
    send("touchmove", [touch(1, 150, 200), touch(2, 250, 200)]);
    await new Promise(requestAnimationFrame);
    send("touchend", []);
    send("touchstart", [touch(1, 200, 200)]);
    for (let i = 1; i <= 30; i++) {
      send("touchmove", [touch(1, 200 + i * 2, 200 + i)]);
      await new Promise(requestAnimationFrame);
    }
    send("touchend", []);
    window.gameMetrics.marks.push({
      name: "synthetic-pinch-pan-end",
      at: performance.now(),
    });
  }
  return (
    <>
      <nav>
        <button onClick={() => select("sudoku")}>Mount Sudoku</button>
        <button onClick={() => select("mandala")}>Mount Mandala</button>
        <button onClick={() => select(null)}>Leave game</button>
        <button onClick={replayPan}>Replay synthetic pinch and pan</button>
        <button onClick={() => window.saveGameMetrics()}>
          Save measurement
        </button>
      </nav>
      <p>
        Local production fixture: actual game components, no account or backend.
      </p>
      <output id="capture-status" />
      {game === "sudoku" && <SudokuGame messages={enMessages} />}
      {game === "mandala" && <MandalaGame messages={enMessages} />}
    </>
  );
}
