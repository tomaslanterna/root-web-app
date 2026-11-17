import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const chat = fs.readFileSync(new URL("./ChatList.tsx", import.meta.url), "utf8");
const search = fs.readFileSync(new URL("../search/page.tsx", import.meta.url), "utf8");

const boxOf = (source, anchor) => {
  const at = source.indexOf(anchor);
  const open = source.lastIndexOf("<div className=\"", at);
  return source.slice(open, source.indexOf("\">", open) + 2);
};

test("the chat search box is built like the global search box", () => {
  const chatBox = boxOf(chat, 'aria-label="Buscar conversaciones"');
  const globalBox = boxOf(search, 'aria-label="Buscar eventos, usuarios o comunidades"');
  for (const token of ["h-9", "md:h-10", "px-3", "rounded-xl", "bg-surface", "border-line", "focus-within:border-accent", "text-ink-3"]) {
    assert.ok(globalBox.includes(token), `global box lost ${token}`);
    assert.ok(chatBox.includes(token), `chat box differs from the global one: missing ${token}`);
  }
});

test("the chat search box cannot be squeezed by the flex column that holds the conversations", () => {
  // ChatList is a fixed-height flex column: without shrink-0 a long list squeezes the box from 36px to 18px.
  assert.match(boxOf(chat, 'aria-label="Buscar conversaciones"'), /\bshrink-0\b/);
});
