import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const flow = fs.readFileSync(new URL("./KycFlow.tsx", import.meta.url), "utf8");

test("the KYC screen uses the design tokens, not hard-coded colors from the old style", () => {
  assert.doesNotMatch(flow, /#D4FF00(?!\\)|#14171F|#0B0D10|neutral-\d|rose-\d|bg-white\/10 text-white/, "old palette leaked back");
  assert.match(flow, /bg-bg text-ink/);
  assert.match(flow, /<Button/);
  assert.match(flow, /font-display/);
});

test("the KYC screen has a header with a back button and swipe back that returns to the profile", () => {
  assert.match(flow, /<SwipeBack onBack=\{goBack\}/);
  assert.match(flow, /aria-label="Volver al perfil"/);
  assert.match(flow, /router\.back\(\)/);
  assert.match(flow, /router\.replace\('\/profile'\)/);
});

test("leaving the screen turns the camera off even though React already cleared the video ref", () => {
  assert.match(flow, /streamRef\.current\?\.getTracks\(\)\.forEach\(track => track\.stop\(\)\)/);
  assert.match(flow, /streamRef\.current = stream/);
});

test("back is blocked while a verification is being processed or uploaded", () => {
  assert.match(flow, /const busy = step === 'PROCESSING' \|\| isUploadingFace \|\| isUploadingDoc/);
  assert.match(flow, /if \(busy\) return/);
});

test("the step card is centered on every step and the screen never scrolls", () => {
  // the screen is pinned to the viewport, whatever padding the root layout adds
  assert.match(flow, /<main className="fixed inset-0 [^"]*overflow-hidden"/);
  // one container centers the card for all steps
  assert.match(flow, /flex-1 min-h-0 [^"]*flex items-center justify-center/);
  // nothing forces a step taller than the screen
  assert.doesNotMatch(flow, /min-h-\[\d+px\]/);
  // the camera frames follow the screen height so they still fit on small phones
  assert.match(flow, /h-\[min\(16rem,32dvh\)\]/);
  assert.match(flow, /calc\(30dvh\*1\.58\)/);
  // the document behind is locked while the screen is mounted, and restored after
  assert.match(flow, /document\.documentElement\.style\.overflow = 'hidden'/);
  assert.match(flow, /document\.body\.style\.overflow = bodyOverflow/);
});
