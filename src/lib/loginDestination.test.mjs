import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const api = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(new URL("./loginDestination.ts", import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports: api, URLSearchParams });

test("login returns only to a valid internal badge review and rejects redirects", () => {
  const review = "/events/6b11d7e0-6461-477f-abc6-4eb3dd7f3088/survey";
  assert.equal(api.loginDestination(`?next=${encodeURIComponent(review)}`), review);
  for (const next of ["", "https://evil.example", "//evil.example", "/events/not-an-id/survey", `${review}?next=https://evil.example`, `${review}/../..`]) {
    assert.equal(api.loginDestination(`?next=${encodeURIComponent(next)}`), "/feed");
  }
});
