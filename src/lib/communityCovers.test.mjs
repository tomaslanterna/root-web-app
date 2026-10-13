import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const exported = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(new URL("./communityCovers.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, { exports: exported });
const { getCommunityCoverSources: sources, LOCAL_COMMUNITY_COVER: localCover } = exported;

test("missing covers select party imagery with accent/case-insensitive categories", () => {
  assert.equal(sources(null, " ELECTRÓNICA ")[0], sources("", "electronica")[0]);
  assert.notEqual(sources("", "electrónica")[0], sources("", "cachengue")[0]);
  for (const category of [null, undefined, "reggaetón", "general", "unknown"]) {
    const result = sources("  ", category);
    assert.equal(result.length, 2);
    assert.match(result[0], /^https:\/\/images\.unsplash\.com\//);
    assert.equal(result[1], localCover);
  }
  assert.ok(fs.existsSync(new URL(`../../public${localCover}`, import.meta.url)));
});

test("custom images remain first; duplicate defaults aren't retried", () => {
  assert.equal(sources(" https://example.com/own.jpg ", "electrónica")[0], "https://example.com/own.jpg");
  const defaultSource = sources(null, "electrónica")[0];
  assert.equal(sources(defaultSource, "electrónica").length, 2);
});
