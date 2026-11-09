import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

test("community directory removes discovery filters and keeps the two useful scopes", () => {
  assert.doesNotMatch(source, /aria-label="Filtros"/);
  assert.doesNotMatch(source, /<select[^>]+country/);
  assert.match(source, /"explore", "mine"/);
  assert.match(source, /"Las tuyas" : "Descubrir"/);
});

test("RRPP and admins receive the create-community flow", () => {
  assert.match(source, /\["RRPP", "ADMIN"\]/);
  assert.match(source, /useCreateCommunity/);
  assert.match(source, /aria-label="Crear comunidad"/);
  assert.match(source, /Vas a quedar como RRPP y primer integrante/);
});
