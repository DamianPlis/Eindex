// node scripts/performance-games.mjs [build|start]
// Isolated production fixture; no auth changes or backend connections.
import { cp, mkdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";

const root = process.cwd();
const fixture = path.join(root, ".data/performance-games");
await mkdir(fixture, { recursive: true });
await cp(path.join(root, "scripts/performance-games"), fixture, {
  recursive: true,
});
const args =
  process.argv[2] === "start"
    ? ["start", "-H", "127.0.0.1", "-p", "3107"]
    : ["build"];
const result = spawnSync(
  process.execPath,
  [path.join(root, "node_modules/next/dist/bin/next"), ...args],
  { cwd: fixture, stdio: "inherit" },
);
process.exit(result.status ?? 1);
