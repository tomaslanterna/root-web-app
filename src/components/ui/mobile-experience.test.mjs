import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const attendance = fs.readFileSync(new URL("./EventAttendanceVote.tsx", import.meta.url), "utf8");
const refresh = fs.readFileSync(new URL("./PullToRefresh.tsx", import.meta.url), "utf8");
const events = fs.readFileSync(new URL("../../app/events/page.tsx", import.meta.url), "utf8");

test("active attendance can be cleared and the event selector includes Voy", () => {
  assert.match(attendance, /status === nextStatus \? null : nextStatus/);
  assert.match(attendance, /eventsApi\.clearRsvp/);
  assert.match(events, /id: "going", label: "Voy"/);
  assert.match(events, /event\.userRsvp === "going"/);
});

test("pull to refresh uses the pulsing root mark without a circular loader", () => {
  assert.match(refresh, /motion-safe:animate-pulse/);
  assert.match(refresh, />\s*r\s*</);
  assert.doesNotMatch(refresh, /rounded-full bg-\[#14171F\]/);
  assert.doesNotMatch(refresh, /Loader2|ArrowDown/);
});
