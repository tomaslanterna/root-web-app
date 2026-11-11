import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const attendance = fs.readFileSync(new URL("./EventAttendanceVote.tsx", import.meta.url), "utf8");
const refresh = fs.readFileSync(new URL("./PullToRefresh.tsx", import.meta.url), "utf8");
const rootLogo = fs.readFileSync(new URL("./RootLogo.tsx", import.meta.url), "utf8");
const events = fs.readFileSync(new URL("../../app/events/page.tsx", import.meta.url), "utf8");

test("active attendance can be cleared and voy! is a standalone selectable filter", () => {
  assert.match(attendance, /status === nextStatus \? null : nextStatus/);
  assert.match(attendance, /eventsApi\.clearRsvp/);
  assert.match(events, /aria-pressed=\{showGoingOnly\}/);
  assert.match(events, /setShowGoingOnly/);
  assert.match(events, />\s*voy!\s*</);
  assert.match(events, /showGoingOnly\s*\? events\.filter\(\(event\) => event\.userRsvp === "going"\)/);
  assert.doesNotMatch(events, /id: "going", label: "Voy"/);
});

test("pull to refresh uses the pulsing root mark without a circular loader", () => {
  assert.match(refresh, /motion-safe:animate-pulse/);
  assert.match(refresh, /<RootMark/);
  assert.match(rootLogo, />\s*r\s*</);
  assert.doesNotMatch(refresh, /rounded-full bg-\[#14171F\]/);
  assert.doesNotMatch(refresh, /Loader2|ArrowDown/);
});
