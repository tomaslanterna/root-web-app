import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const api = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(new URL("./badgePreview.ts", import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports: api, process: { env: { NODE_ENV: "development" } } });
test("synthetic steps are limited to pocho's local manual badges and never mutate real steps", () => {
  const badges = [{ eventId: "9d15f159-f9cc-49ae-8785-c2c98699d659", source: "manual", mostDanced: false, steps: null }, { eventId: "another-event", mostDanced: false, steps: 4 }];
  const preview = api.badgePreview("pocho", badges);
  assert.equal(preview[0].mostDanced, true);
  assert.equal(preview[0].mostDancedPreview, true);
  assert.equal(preview[0].steps, 38500);
  assert.equal(preview[0].stepsPreview, true);
  assert.equal(badges[0].steps, null);
  assert.equal(preview[1], badges[1]);
  assert.equal(badges[0].mostDanced, false);
  assert.equal(api.badgePreview("mathi.mai", badges), badges);
  assert.equal(api.badgePreview("pocho", badges, false), badges);
  assert.equal(api.badgePreview("pocho", [{ ...badges[0], source: "geofence" }])[0].mostDanced, false);
  const real = { ...badges[0], steps: 25000, mostDanced: false };
  assert.equal(api.badgePreview("pocho", [real])[0], real);
  const another = { ...badges[0], eventId: "6b11d7e0-6461-477f-abc6-4eb3dd7f3088" };
  assert.equal(api.badgePreview("pocho", [another])[0].steps, 10400);
  assert.equal(api.badgePreview("pocho", [another])[0].mostDanced, false);
});
