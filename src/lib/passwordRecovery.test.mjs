import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const exported = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(new URL("./passwordRecovery.ts", import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports: exported, TextEncoder });
test("reset validates confirmation, Unicode character count and bcrypt byte limit", () => {
  const validate = exported.resetPasswordValidation;
  assert.equal(validate("Password123", "Password123"), "");
  assert.equal(validate("🙂".repeat(8), "🙂".repeat(8)), "");
  for (const value of ["short", " ".repeat(8), "a".repeat(73), "🙂".repeat(19)]) assert.ok(validate(value, value));
  assert.match(validate("Password123", "Password124"), /no coinciden/);
});
test("rate limits and unavailable recovery never report an email delivered", () => {
  assert.equal(exported.recoveryError(null), "");
  assert.match(exported.recoveryError({ response: { status: 503 } }), /no está disponible/);
  assert.match(exported.recoveryError({ response: { status: 429 } }), /demasiados intentos/);
  assert.match(exported.recoveryError({ response: { status: 400 } }), /inválido o venció/);
  assert.match(exported.recoveryError({ response: { status: 500 } }), /No pudimos/);
});
