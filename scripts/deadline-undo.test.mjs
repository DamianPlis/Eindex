// Run with: node --test scripts/deadline-undo.test.mjs
// Load the actual TypeScript server actions with an isolated in-memory store.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
const root = fileURLToPath(new URL("..", import.meta.url));

function setup(deadlines) {
  let state = { deadlines: structuredClone(deadlines) };
  let uid = "test-user";
  const writes = [];
  const mocks = {
    "next/headers": {},
    "@/lib/session": { requireSession: async () => {
      if (!uid) throw new Error("Unauthenticated");
      return { uid };
    } },
    "@/lib/schedule/store": { updateUserState: async (_uid, mutate) => {
      const draft = structuredClone(state);
      mutate(draft);
      state = draft;
      return structuredClone(state);
    } },
    "@/lib/convex/dual-write": { shadowWriteToConvex: async (name, args) => {
      writes.push({ name, args });
    } },
  };
  const cache = new Map();
  function load(specifier, from = root) {
    if (specifier in mocks) return mocks[specifier];
    const file = path.resolve(specifier.startsWith("@/") ? root : from,
      specifier.replace(/^@\//, ""));
    if (cache.has(file)) return cache.get(file);
    const source = fs.readFileSync(file.endsWith(".ts") ? file : `${file}.ts`, "utf8");
    const compiled = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    const loaded = { exports: {} };
    cache.set(file, loaded.exports);
    new Function("require", "module", "exports", compiled)(
      (name) => load(name, path.dirname(file)), loaded, loaded.exports);
    return loaded.exports;
  }
  return {
    actions: load("@/app/(app)/actions"), writes,
    get state() { return state; },
    setUser(value) { uid = value; },
  };
}

const deadline = (id, status = "upcoming") => ({
  id, text: `Homework ${id}`, description: "Keep the full description", date: "2099-12-01", status,
});
function form(id) { const data = new FormData(); data.set("id", id); return data; }

test("remove and undo preserve every field and list position, including completed status", async () => {
  const original = [deadline("a"), deadline("b", "done"), deadline("c")];
  const app = setup(original);
  const undo = await app.actions.removeDeadlineAction(form("b"));
  assert.deepEqual(app.state.deadlines.map((d) => d.id), ["a", "c"]);
  await app.actions.undoDeadlineAction(undo);
  assert.deepEqual(app.state.deadlines, original);
  assert.equal(app.writes.at(-1).args.status, "done");
  assert.equal(app.writes.at(-1).args.deadlineId, "b");
});

test("undo completion calculates due status and preserves subsequent edits", async () => {
  const app = setup([{ ...deadline("a"), date: "2000-01-01", status: "expired" }]);
  const undo = await app.actions.markAsDoneDeadlineAction(form("a"));
  assert.equal(app.state.deadlines[0].status, "done");
  app.state.deadlines[0].description = "An edit from another tab";
  await app.actions.undoDeadlineAction(undo);
  assert.equal(app.state.deadlines[0].status, "expired");
  assert.equal(app.state.deadlines[0].description, "An edit from another tab");
  assert.equal(app.writes.at(-1).args.status, "expired");
});

test("multiple removals each have an undo; retries do not duplicate or overwrite", async () => {
  const app = setup([deadline("a"), deadline("b")]);
  const a = await app.actions.removeDeadlineAction(form("a"));
  const b = await app.actions.removeDeadlineAction(form("b"));
  await app.actions.undoDeadlineAction(b);
  await app.actions.undoDeadlineAction(a);
  app.state.deadlines[0].text = "New title";
  await app.actions.undoDeadlineAction(a);
  assert.deepEqual(app.state.deadlines.map((d) => d.id), ["a", "b"]);
  assert.equal(app.state.deadlines[0].text, "New title");
});

test("no-op actions do not claim a change or produce undo receipts", async () => {
  const app = setup([deadline("a", "done")]);
  assert.equal(await app.actions.markAsDoneDeadlineAction(form("a")), null);
  assert.equal(await app.actions.removeDeadlineAction(form("missing")), null);
  assert.equal(app.writes.length, 0);
});

test("undoing completion never resurrects a subsequently removed deadline", async () => {
  const app = setup([deadline("a")]);
  const undo = await app.actions.markAsDoneDeadlineAction(form("a"));
  await app.actions.removeDeadlineAction(form("a"));
  await assert.rejects(app.actions.undoDeadlineAction(undo), /no longer exists/);
  assert.deepEqual(app.state.deadlines, []);
});

test("undo requires the same signed-in user and validates restored content", async () => {
  const app = setup([deadline("a")]);
  const undo = await app.actions.removeDeadlineAction(form("a"));
  app.setUser("different-user");
  await assert.rejects(app.actions.undoDeadlineAction(undo), /Invalid/);
  app.setUser(null);
  await assert.rejects(app.actions.undoDeadlineAction(undo), /Unauthenticated/);
  app.setUser("test-user");
  await assert.rejects(app.actions.undoDeadlineAction({ ...undo, deadline: { ...undo.deadline, date: "bad" } }), /Invalid/);
  assert.deepEqual(app.state.deadlines, []);
});
