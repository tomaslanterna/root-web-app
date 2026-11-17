import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const page = fs.readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

// Valores que existen en events.department para eventos de Uruguay.
const URUGUAY = new Set(["Montevideo", "Punta del Este", "Canelones", "Rocha", "Colonia"]);

test("the location suggestions are only places in Uruguay", () => {
  const block = page.match(/const citySuggestions = \[([\s\S]*?)\];/);
  assert.ok(block, "citySuggestions must exist");
  const places = [...block[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  assert.ok(places.length > 0);
  for (const place of places) {
    assert.ok(URUGUAY.has(place), `${place} is not a stored Uruguayan department`);
  }
  assert.ok(!places.includes("Buenos Aires"));
  assert.ok(!places.includes("Maldonado"), "Maldonado matches no event: that coast is stored as Punta del Este");
});

test("the location list uses the whole bottom sheet instead of a fixed cap", () => {
  const sheet = page.slice(page.indexOf("{/* BottomSheet de Filtros Móvil */}"));
  assert.match(sheet, /bodyClassName="flex flex-col"/);
  assert.doesNotMatch(sheet, /max-h-56/);
  assert.match(sheet, /min-h-0 flex-1 space-y-1\.5 overflow-y-auto/);
});

test("the voy! chip shows an x to clear it while selected", () => {
  const chip = page.slice(page.indexOf("{/* Filtro 1: voy! */}"), page.indexOf("{/* Filtro 2: ¿Cuándo? */}"));
  assert.match(chip, /showGoingOnly && \(/);
  assert.match(chip, /setShowGoingOnly\(false\)/);
  assert.match(chip, /aria-label="Quitar filtro voy!"/);
  assert.match(chip, /aria-pressed=\{showGoingOnly\}/);
});

test("both section titles are measured together so they always share one font size", () => {
  assert.match(page, /useMatchedFontSize\(\s*featuredTitleRef,\s*sectionTitleRef,/);
  assert.match(page, /ref=\{featuredTitleRef\}/);
  assert.match(page, /ref=\{sectionTitleRef\}/);
});
