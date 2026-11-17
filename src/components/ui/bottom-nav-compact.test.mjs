import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const nav = fs.readFileSync(new URL("./BottomNav.tsx", import.meta.url), "utf8");

test("the mobile dock shrinks while scrolling down and grows back when scrolling up", () => {
  // same scroll state as the desktop capsule: down -> not visible (compact), up -> visible (full size)
  assert.match(nav, /if \(delta > 8\) \{\s*setIsVisible\(false\);/);
  assert.match(nav, /else if \(delta < -8\) \{\s*setIsVisible\(true\);/);
  // back at the top it always returns to its real size
  assert.match(nav, /currentScrollY <= 30\) \{\s*setIsVisible\(true\);/);
  assert.match(nav, /const isCompact = !isVisible;/);
});

test("the compact dock is lower, narrower and has smaller icons", () => {
  assert.match(nav, /isCompact\s*\?\s*"h-12 w-\[calc\(var\(--dock-items\)\*3\.25rem\+0\.75rem\)\]/);
  assert.match(nav, /: "h-16 w-full/);
  assert.match(nav, /isCompact \? "h-9" : "h-12"/);
  assert.equal([...nav.matchAll(/isCompact \? "size-\[22px\]" : "size-\[26px\]"/g)].length, 2, "icon and avatar both shrink");
  assert.match(nav, /"--dock-items": visibleMobileItems\.length/);
});

test("the dock animates its size and respects reduced motion", () => {
  assert.match(nav, /transition-\[width,height,box-shadow\] duration-300[^"]*motion-reduce:transition-none/);
});
