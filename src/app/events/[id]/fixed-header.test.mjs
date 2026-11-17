import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const page = fs.readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

test("the event header (back and share) is fixed, not part of the poster that scrolls away", () => {
  const header = page.indexOf('<header className="fixed inset-x-0 top-0 z-40 pointer-events-none">');
  const poster = page.indexOf("{/* Póster */}");
  assert.ok(header !== -1, "a fixed header must exist");
  assert.ok(header < poster, "the header lives outside the poster");
  const headerBlock = page.slice(header, poster);
  assert.match(headerBlock, /aria-label="Volver"/);
  assert.match(headerBlock, /aria-label="Compartir evento"/);
  assert.match(headerBlock, /pt-\[calc\(1rem\+var\(--root-safe-top\)\)\]/, "it respects the safe area");
  // the buttons are no longer absolutely positioned inside the poster
  assert.doesNotMatch(page, /absolute top-\[calc\(1rem\+var\(--root-safe-top\)\)\]/);
  // clicks go through the empty part of the bar
  assert.equal([...headerBlock.matchAll(/pointer-events-auto/g)].length, 2);
});
