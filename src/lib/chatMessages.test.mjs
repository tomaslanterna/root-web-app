import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
const source = fs.readFileSync(new URL("./chatMessages.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const exportsObject = {};
vm.runInNewContext(compiled, { exports: exportsObject });
const { mergeChatMessages } = exportsObject;
const message = (id, status, timestamp = "2026-10-02T15:00:00.000Z") => ({
  id, status, timestamp, chat_id: "chat-1", sender_id: "sender", content: "hola", type: "text", metadata: null,
});

test("socket confirmation and HTTP response reconcile the same optimistic UUID", () => {
  let messages = mergeChatMessages([message("id-1", "sending")], [message("id-1", "delivered")]);
  messages = mergeChatMessages(messages, [message("id-1", "sent")]);
  assert.equal(messages.length, 1);
  assert.equal(messages[0].status, "delivered");
});
test("late snapshots and repeat events do not undo read receipts or duplicate messages", () => {
  const messages = mergeChatMessages([message("id-1", "read")], [message("id-1", "delivered"), message("id-1", "sent")]);
  assert.equal(messages.length, 1);
  assert.equal(messages[0].status, "read");
});
test("reconnection merges missing history with live events in stable nanosecond order", () => {
  const messages = mergeChatMessages(
    [message("z", "sent", "2026-10-02T15:00:00.001Z"), message("new", "sent", "2026-10-02T15:00:01Z")],
    [message("a", "sent", "2026-10-02T15:00:00.001900Z"), message("z", "delivered", "2026-10-02T15:00:00.001Z")],
  );
  assert.deepEqual(Array.from(messages, (m) => m.id), ["z", "a", "new"]);
  assert.equal(messages[0].status, "delivered");
});
test("equal timestamps break ties by message ID", () => {
  assert.deepEqual(Array.from(mergeChatMessages([message("b", "sent")], [message("a", "sent")]), (m) => m.id), ["a", "b"]);
});
