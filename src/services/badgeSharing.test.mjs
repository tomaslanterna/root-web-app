import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function module(path, dependencies = {}, globals = {}) {
  const exported = {};
  const code = ts.transpileModule(fs.readFileSync(new URL(path, import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { exports: exported, Intl, crypto, ...globals, require: key => {
    if (key in dependencies) return dependencies[key]; throw new Error(`Unexpected dependency ${key}`);
  } });
  return exported;
}
const appearance = module("../lib/badgeAppearance.ts");
const location = module("../lib/badgeLocation.ts");
const sample = { eventId: "event", title: "Fiesta real", eventDate: "2026-10-01T00:00:00Z", location: "Sala del Museo", department: "Montevideo", country: "UY", review: null, imageUrl: "events/flyer.webp" };
function sharing({ native = false, navigator = {}, cancelNative = false, flyerFails = false } = {}) {
  const calls = [], deleted = [], written = [];
  const ctx = new Proxy({ measureText: text => ({ width: text.length * 20 }) }, { get: (target, key) => key in target ? target[key] : (...args) => calls.push({ key, args, color: ctx.strokeStyle, width: ctx.lineWidth }), set: (target, key, value) => { target[key] = value; return true; } });
  const canvas = { getContext: () => ctx, toBlob: fn => fn(new Blob(["png"], { type: "image/png" })) };
  const api = module("./badgeSharing.ts", {
    "@capacitor/core": { Capacitor: { isNativePlatform: () => native } },
    "@capacitor/share": { Share: { canShare: async () => ({ value: true }), share: async () => { if (cancelNative) throw new Error("cancelled"); } } },
    "@capacitor/filesystem": { Directory: { Cache: "CACHE" }, Filesystem: { writeFile: async value => { written.push(value); return { uri: "cache://badge.png" }; }, deleteFile: async value => deleted.push(value) } },
    "./badges": { getBadgeFlyer: async id => { calls.push({ key: "flyer", args: [id] }); if (flyerFails) throw new Error("missing"); return new Blob(["real"]); }, getBadgeArtistImage: async (id, artist) => { calls.push({ key: "portrait", args: [id, artist] }); return new Blob(["real portrait"]); } },
    "@/lib/badgeAppearance": appearance,
    "@/lib/badgeLocation": location,
  }, { Blob, File, navigator, document: { fonts: { ready: Promise.resolve() }, createElement: () => canvas }, URL: { createObjectURL: () => "blob:official", revokeObjectURL: value => calls.push({ key: "revoke", args: [value] }) }, Image: class { naturalWidth = 600; naturalHeight = 800; decode() { return Promise.resolve(); } }, FileReader: class { readAsDataURL() { this.result = "data:image/png;base64,cG5n"; this.onload(); } } });
  return { api, calls, deleted, written, canvas };
}

test("location uses real optional fields and correctly labels countries outside Uruguay", () => {
  assert.equal(location.badgeLocation(sample), "Sala del Museo · Montevideo, Uruguay");
  assert.equal(location.badgeLocation({ location: "Club", country: "AR", department: "Buenos Aires" }), "Club · Buenos Aires, Argentina");
  assert.equal(location.badgeLocation({ location: "Club", department: null, country: null }), "Club");
});
test("opening identity survives SPA navigation but changes for a new native opening", () => {
  const opening = module("../lib/reviewOpening.ts");
  const first = opening.currentReviewOpening();
  assert.equal(opening.currentReviewOpening(), first);
  const next = opening.newReviewOpening();
  assert.notEqual(next, first); assert.equal(opening.currentReviewOpening(), next);
});
test("share card is 1080x1350 PNG with an official circular flyer and only one winner border", async () => {
  const { api, calls, canvas } = sharing();
  const file = await api.createBadgeCard({ ...sample, mostDanced: true, review: { generalRating: 5, comment: "private review", artistRatings: [{ rating: 1 }] } });
  assert.equal(file.type, "image/png"); assert.equal(canvas.width, 1080); assert.equal(canvas.height, 1350);
  assert.equal(calls.filter(c => c.key === "flyer").length, 1);
  const strokes = calls.filter(c => c.key === "stroke");
  assert.equal(strokes.length, 1); assert.equal(strokes[0].width, 70); assert.equal(strokes[0].color, "#D4FF00");
  assert.equal(calls.some(c => c.key === "fillText" && c.args[0] === "private review"), false);
  assert.equal(calls.some(c => c.key === "fillText" && c.args[0] === "Reseñar"), false);
  assert.equal(calls.some(c => c.key === "revoke"), true);
});
test("pending share card has Reseñar and no invented lime score arc; saved zero stays completed", async () => {
  let harness = sharing(); await harness.api.createBadgeCard(sample);
  assert.equal(harness.calls.some(c => c.key === "fillText" && c.args[0] === "Reseñar"), true);
  assert.equal(harness.calls.some(c => c.key === "stroke" && c.color === "#D4FF00"), false);
  harness = sharing(); await harness.api.createBadgeCard({ ...sample, review: { generalRating: 0 } });
  assert.equal(harness.calls.some(c => c.key === "fillText" && c.args[0] === "Reseñar"), false);
});
test("web sharing handles unsupported browsers and user cancellation honestly", async () => {
  let harness = sharing(); assert.equal(await harness.api.shareBadgeFile(new File([], "badge.png"), "Badge"), "unsupported");
  harness = sharing({ navigator: { canShare: () => true, share: async () => { throw { name: "AbortError" }; } } });
  assert.equal(await harness.api.shareBadgeFile(new File([], "badge.png"), "Badge"), "cancelled");
});
test("missing flyer reuses an existing official headliner portrait, never an invented photograph", async () => {
  const { api, calls } = sharing({ flyerFails: true });
  await api.createBadgeCard({ ...sample, headliner: { id: "real-dj", imageUrl: "artists/real.jpg" } });
  assert.deepEqual(calls.find(c => c.key === "portrait").args, ["event", "real-dj"]);
  await assert.rejects(api.createBadgeCard(sample));
});
test("native sharing uses cache only and removes its exact temporary file even after cancellation", async () => {
  const { api, written, deleted } = sharing({ native: true, cancelNative: true });
  await assert.rejects(api.shareBadgeFile(new File([], "badge.png"), "Badge"));
  assert.equal(written.length, 1); assert.equal(written[0].directory, "CACHE");
  assert.match(written[0].path, /^badge-shares\/[^/]+\.png$/);
  assert.equal(deleted[0].path, written[0].path); assert.equal(deleted[0].directory, "CACHE");
});
