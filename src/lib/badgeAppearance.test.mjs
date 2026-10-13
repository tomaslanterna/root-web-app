import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
const api = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(new URL("./badgeAppearance.ts", import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports: api });

test("arc represents saved zero, integer and future fractional scores without exceeding 0–100", () => {
  for (const [rating, percent] of [[null,0],[0,0],[1,20],[4.5,90],[5,100],[8,100],[-2,0],[NaN,0]]) assert.equal(api.badgeProgress(rating),percent);
});

test("badge captions contain only the registered headliner and compact steps with a decimal comma", () => {
  assert.equal(api.badgeSteps(10400), "10,4 k pasos");
  assert.equal(api.badgeSteps(12450), "12,5 k pasos");
  assert.equal(api.badgeSteps(0), "0,0 k pasos");
  for (const missing of [null, undefined, NaN, -1]) assert.equal(api.badgeSteps(missing), "— pasos");
  assert.equal(api.badgeStepValue(38500), "38,5 K");
  assert.equal(api.badgeStepValue(null), "—");
  assert.equal(api.badgeRatingValue(4.5), "4.5");
  assert.equal(api.badgeRatingValue(null), "—");
  assert.equal(api.badgeDJ({ headliner: { name: " ARGY " }, title: "KEY - ARGY" }), "ARGY");
  assert.equal(api.badgeDJ({ headliner: { name: " " }, title: "Name of event" }), "DJ no informado");
  assert.equal(api.badgeDJ({ headliner: null, title: "KEY - ARGY" }), "ARGY");
  assert.equal(api.badgeDJ({ headliners: [{ name: " " }, { name: "Main DJ" }] }), "Main DJ");
});
test("badge ring metadata uses locality, venue, dotted date and main DJ", () => {
  const badge = { department: null, location: "OPEN PARK", eventDate: "2027-01-04T23:59:00Z", title: "KEY - MISS MONIQUE", headliner: { name: "MISS MONIQUE" } };
  assert.equal(api.badgeRingLabel(badge), "Punta del Este · OPEN PARK · 04.01.2027 · MISS MONIQUE");
  assert.equal(api.badgeRingLabel({ ...badge, department: "Rocha", location: "Arena", headliner: { name: "DJ Sur" } }), "Rocha · Arena · 04.01.2027 · DJ Sur");
  assert.equal(api.badgeRingDate("invalid"), "FECHA PENDIENTE");
});
test("months use actual attendance and Montevideo calendar, merge pagination boundaries and preserve server order", () => {
  const data = [
    {eventId:"a",confirmedAt:"2027-01-20T00:00:00Z",eventDate:"2026-11-01T00:00:00Z"},
    {eventId:"b",confirmedAt:"2027-01-10T00:00:00Z"},
    {eventId:"c",confirmedAt:"2027-01-01T01:00:00Z"},
    {eventId:"d",confirmedAt:"2026-12-01T20:00:00Z"},
  ];
  const groups = api.groupBadges(data);
  assert.equal(groups.length,2); assert.equal(groups[0].key,"2027-01"); assert.equal(groups[0].label,"Enero de 2027");
  assert.deepEqual(Array.from(groups[1].badges,b=>b.eventId),["c","d"]);
  assert.equal(groups[1].key,"2026-12"); assert.equal(api.groupBadges([]).length,0);
});
