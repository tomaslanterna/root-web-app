import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function load(file) {
  const exported = {};
  const source = fs.readFileSync(new URL(file, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  vm.runInNewContext(compiled, { exports: exported, require: () => ({}), URL, URLSearchParams, Intl, Date });
  return exported;
}

const a = load("./afters.ts");
// Lo que viene del vm es de otro realm: se compara como JSON.
const plain = (value) => JSON.parse(JSON.stringify(value));
// Montevideo es UTC-3 todo el año.
const mvd = (iso) => new Date(`${iso}-03:00`);
const after = (id, local) => ({ id, startsAt: mvd(local).toISOString() });

test("los afters se agrupan por noche (de 12:00 a 12:00) y se ordenan por hora", () => {
  const now = mvd("2026-11-27T22:00:00"); // viernes 27, 22 h
  const nights = a.groupAftersByNight(
    [
      after("sab-0700", "2026-11-28T07:00:00"),
      after("dom-0630", "2026-11-29T06:30:00"),
      after("sab-0600", "2026-11-28T06:00:00"),
      after("sab-2330", "2026-11-28T23:30:00"), // sábado de noche: ya es la noche siguiente
    ],
    now,
  );
  assert.deepEqual(plain(nights.map((n) => n.key)), ["2026-11-27", "2026-11-28"]);
  assert.deepEqual(plain(nights[0].afters.map((x) => x.id)), ["sab-0600", "sab-0700"]);
  assert.deepEqual(plain(nights[1].afters.map((x) => x.id)), ["sab-2330", "dom-0630"]);
  assert.equal(nights[0].isTonight, true);
  assert.equal(nights[1].isTonight, false);
  assert.match(nights[0].label, /^Esta noche · Vie 27 → sáb 28$/);
  assert.equal(nights[1].label, "Sáb 28 → dom 29");
});

test("de madrugada, lo de esa mañana sigue siendo 'esta noche'", () => {
  const now = mvd("2026-11-28T04:00:00");
  const [night] = a.groupAftersByNight([after("x", "2026-11-28T06:00:00")], now);
  assert.equal(night.key, "2026-11-27");
  assert.equal(night.isTonight, true);
});

test("un after en curso de una noche anterior va con esta noche (no se duplica el grupo)", () => {
  const now = mvd("2026-11-28T13:00:00"); // ya es la noche del sábado
  const nights = a.groupAftersByNight([after("viejo", "2026-11-28T07:00:00"), after("nuevo", "2026-11-29T06:00:00")], now);
  assert.equal(nights.length, 1);
  assert.deepEqual(plain(nights[0].afters.map((x) => x.id)), ["viejo", "nuevo"]);
});

test("la franja 'Afters de esta noche' se ve de 18:00 a 12:00", () => {
  assert.equal(a.isAftersStripTime(mvd("2026-11-27T17:59:00")), false);
  assert.equal(a.isAftersStripTime(mvd("2026-11-27T18:00:00")), true);
  assert.equal(a.isAftersStripTime(mvd("2026-11-28T03:00:00")), true);
  assert.equal(a.isAftersStripTime(mvd("2026-11-28T11:59:00")), true);
  assert.equal(a.isAftersStripTime(mvd("2026-11-28T12:00:00")), false);
});

test("tonightRange va de ahora a las próximas 12:00 de Montevideo", () => {
  const evening = mvd("2026-11-27T21:00:00");
  assert.deepEqual(plain(a.tonightRange(evening)), { from: evening.toISOString(), until: mvd("2026-11-28T12:00:00").toISOString() });
  const dawn = mvd("2026-11-28T05:00:00");
  assert.equal(a.tonightRange(dawn).until, mvd("2026-11-28T12:00:00").toISOString());
});

test("la hora elegida se ubica después del inicio de la fiesta", () => {
  const party = mvd("2026-11-28T23:30:00");
  assert.equal(a.startsAtFor("06:00", party).toISOString(), mvd("2026-11-29T06:00:00").toISOString());
  assert.equal(a.startsAtFor("23:45", party).toISOString(), mvd("2026-11-28T23:45:00").toISOString());
  assert.equal(a.startsAtFor("25:00", party), null);
  const shortcuts = a.startShortcuts(mvd("2026-11-29T07:00:00"));
  assert.deepEqual(plain(shortcuts.map((s) => s.label)), ["Al cierre · 07:00", "05:00", "06:00", "06:30"]);
  assert.deepEqual(plain(a.startShortcuts(null).map((s) => s.label)), ["05:00", "06:00", "06:30"]);
});

test("textos de acceso y de gente", () => {
  assert.equal(a.accessLabel("ticket", "$300"), "Entrada $300");
  assert.equal(a.accessLabel("approval"), "Con aprobación");
  assert.equal(a.attendanceText({ access: "approval", acceptedCount: 12, goingCount: 0, capacity: 30 }), "12/30");
  assert.equal(a.attendanceText({ access: "free", acceptedCount: 0, goingCount: 21, capacity: null }), "21 van");
  assert.equal(a.spotsLeft({ access: "approval", acceptedCount: 30, goingCount: 0, capacity: 30 }), 0);
});
