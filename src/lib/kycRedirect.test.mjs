import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const exported = {};
const source = fs.readFileSync(new URL("./kycRedirect.ts", import.meta.url), "utf8");
vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports: exported, URL, URLSearchParams });
const k = exported;

test("/kyc?redirect= solo acepta rutas internas", () => {
  assert.equal(k.safeInternalPath("/afters/new?eventId=abc"), "/afters/new?eventId=abc");
  assert.equal(k.safeInternalPath("/events/submit"), "/events/submit");
  for (const bad of ["//evil.com", "/\\evil.com", "https://evil.com", "javascript:alert(1)", "evil.com", "", null, "/kyc", "/kyc?redirect=/x", "/a\nb"]) {
    assert.equal(k.safeInternalPath(bad), null, String(bad));
  }
});

test("el link a /kyc lleva la ruta de vuelta codificada", () => {
  assert.equal(k.kycHref("/afters/new?eventId=1"), "/kyc?redirect=%2Fafters%2Fnew%3FeventId%3D1");
  assert.equal(k.kycHref("//evil.com"), "/kyc");
  assert.equal(k.kycReturnPath("?redirect=%2Fevents%2Fsubmit"), "/events/submit");
  assert.equal(k.kycReturnPath("?redirect=%2F%2Fevil.com"), null);
});

test("gating: sin sesión va a login, sin verificar abre la hoja y verificado navega", () => {
  assert.equal(k.kycGateDecision(null), "login");
  assert.equal(k.kycGateDecision({ isKycVerified: false }), "verify");
  assert.equal(k.kycGateDecision({}), "verify");
  assert.equal(k.kycGateDecision({ isKycVerified: true }), "allow");
});
