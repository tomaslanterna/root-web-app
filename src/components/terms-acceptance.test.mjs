import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import vm from "node:vm";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");

function loadTerms() {
  const { outputText } = ts.transpileModule(read("../lib/terms.ts"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const module = { exports: {} };
  vm.runInNewContext(outputText, {
    module, exports: module.exports,
    require: () => ({ isFullName: (name) => typeof name === "string" && name.trim().split(/\s+/).length >= 2 }),
  });
  return module.exports;
}

const complete = { name: "Ana Paz", dob: "1995-05-05", documentId: "12345678", country: "UY" };

test("perfil completo sin términos: hoja, no formulario", () => {
  const terms = loadTerms();
  assert.equal(terms.needsProfileCompletion({ ...complete }), false);
  assert.equal(terms.needsTermsAcceptance({ ...complete }), true);
  assert.equal(terms.needsTermsAcceptance({ ...complete, termsAcceptedAt: "2026-11-26T10:00:00Z" }), false);
});

test("perfil incompleto: va a /complete-profile (que trae su propio checkbox), sin hoja", () => {
  const terms = loadTerms();
  const googleUser = { name: "Ana", dob: null, documentId: null, country: null };
  assert.equal(terms.needsProfileCompletion(googleUser), true);
  assert.equal(terms.needsTermsAcceptance(googleUser), false);
});

test("la hoja no se puede descartar: solo aceptar o cerrar sesión", () => {
  const sheet = read("./TermsAcceptanceSheet.tsx");
  assert.match(sheet, /dismissible=\{false\}/);
  assert.match(sheet, /Aceptar y continuar/);
  assert.match(sheet, /logout\(\)/);
  assert.match(sheet, /href="\/terms"/);
  assert.match(sheet, /href="\/privacy"/);
  // Se oculta en los textos legales para poder leerlos, y en complete-profile.
  const skip = new Function(`return ${sheet.match(/TERMS_SHEET_SKIP = (\/.*\/);/)[1]}`)();
  for (const path of ["/terms", "/privacy", "/complete-profile", "/login"]) assert.ok(skip.test(path), path);
  for (const path of ["/events", "/events/123", "/profile/ana", "/termsx"]) assert.ok(!skip.test(path), path);
});

test("BottomSheet no dismissible: sin X, sin cierre por fondo, Escape, atrás ni arrastre", () => {
  const sheet = read("./ui/BottomSheet.tsx");
  assert.match(sheet, /const requestClose = dismissible \? onClose : noop;/);
  assert.match(sheet, /useNativeBackHandler\(isOpen, requestClose\)/);
  assert.match(sheet, /onClick=\{requestClose\}/);
  assert.match(sheet, /\{dismissible && \(\s*<button/);
  assert.match(sheet, /if \(dismissible && \(finalCalculatedHeight/);
});

test("la hoja está montada en el layout y la de géneros espera a los términos", () => {
  assert.match(read("../app/layout.tsx"), /<TermsAcceptanceSheet \/>/);
  assert.match(read("./InterestsPrompt.tsx"), /!pendingTerms/);
});
