import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";

export async function POST(request) {
  const data = await request.text();
  if (data.length > 1000000) return new Response("Too large", { status: 413 });
  JSON.parse(data);
  const directory = path.resolve("../../docs/performance-evidence");
  await mkdir(directory, { recursive: true });
  await appendFile(path.join(directory, "07-browser.jsonl"), data + "\n");
  return new Response("Saved");
}
