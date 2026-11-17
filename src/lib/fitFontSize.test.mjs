import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const api = {};
vm.runInNewContext(
  ts.transpileModule(fs.readFileSync(new URL("./fitFontSize.ts", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText,
  { exports: api },
);

test("keeps the base size when it already fits", () => {
  assert.equal(api.largestFittingSize(22, 14, 0.5, () => true), 22);
});

test("lowers the size just enough for the text to fit", () => {
  // the text needs 8.5 px per size unit: 190 px of room fit 22 -> 21.5 is the first size that fits
  const width = (size) => size * 8.8;
  assert.equal(api.largestFittingSize(22, 14, 0.5, (size) => width(size) <= 190), 21.5);
  assert.equal(api.largestFittingSize(28, 14, 0.5, (size) => width(size) <= 190), 21.5);
});

test("never goes below the minimum", () => {
  assert.equal(api.largestFittingSize(22, 14, 0.5, () => false), 14);
});

test("two titles measured together end up with one common size", () => {
  const needs = { featured: 8.0, section: 9.5 }; // px of width per font-size unit
  const room = 180;
  const fitsBoth = (size) => Object.values(needs).every((k) => k * size <= room);
  const common = api.largestFittingSize(22, 14, 0.5, fitsBoth);
  assert.ok(needs.section * common <= room && needs.featured * common <= room);
  assert.ok(needs.section * (common + 0.5) > room, "the wider title decides the size for both");
});
