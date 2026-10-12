import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function runtime(failure) {
  const calls = [], exported = {};
  const post = async (...args) => { calls.push(args); if (failure) throw failure; return { data: { message: "Solicitud recibida" } }; };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(new URL("./auth.ts", import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports: exported, require: () => ({ api: { post } }) });
  return { api: exported.authApi, calls };
}
test("recovery services use public auth endpoints without identity overrides", async () => {
  const r = runtime();
  await r.api.requestPasswordReset("person@example.com");
  const reset = { token: "private-token", password: "Password123", confirmPassword: "Password123" };
  await r.api.resetPassword(reset);
  assert.equal(r.calls[0][0], "/v1/auth/forgot-password");
  assert.deepEqual(Object.keys(r.calls[0][1]), ["email"]);
  assert.equal(r.calls[1][0], "/v1/auth/reset-password"); assert.equal(r.calls[1][1], reset);
  assert.equal(r.calls[0][2].skipAuthRedirect, true); assert.equal(r.calls[1][2].skipAuthRedirect, true);
});
test("email/server failures propagate instead of being converted into success", async () => {
  const error = new Error("unavailable"); const r = runtime(error);
  await assert.rejects(r.api.requestPasswordReset("person@example.com"), error);
  await assert.rejects(r.api.resetPassword({ token: "invalid", password: "Password123", confirmPassword: "Password123" }), error);
});
