import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const exported = {};
const source = fs.readFileSync(new URL("./eventPath.ts", import.meta.url), "utf8");
vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports: exported });
const p = exported;
const id = "32e6703c-8063-4913-a836-b10493dc2b63";

test("el link usa el slug y, si no vino, el id", () => {
  assert.equal(p.eventPath({ id, slug: "danzeria-presenta-greggio" }), "/events/danzeria-presenta-greggio");
  assert.equal(p.eventPath({ id, slug: "danzeria-presenta-greggio" }, "afters"), "/events/danzeria-presenta-greggio/afters");
  assert.equal(p.eventPath({ id }), `/events/${id}`);
  assert.equal(p.eventPath({ id, slug: "  " }, "crews"), `/events/${id}/crews`);
  assert.equal(p.eventPath({ id, slug: null }), `/events/${id}`);
});

test("distingue un UUID de un slug", () => {
  assert.equal(p.isEventUuid(id), true);
  assert.equal(p.isEventUuid(id.toUpperCase()), true);
  assert.equal(p.isEventUuid("danzeria-presenta-greggio"), false);
  assert.equal(p.isEventUuid(""), false);
  assert.equal(p.isEventUuid(undefined), false);
});

test("con el UUID en la URL, la cambia por la del slug y conserva la sección, el query y el hash", () => {
  const event = { id, slug: "danzeria-presenta-greggio" };
  assert.equal(p.canonicalEventUrl(`/events/${id}`, id, event, "?origin=/events#afters"), "/events/danzeria-presenta-greggio?origin=/events#afters");
  assert.equal(p.canonicalEventUrl(`/events/${id}/crews`, id, event), "/events/danzeria-presenta-greggio/crews");
  assert.equal(p.canonicalEventUrl("/events/Danzeria-Presenta-Greggio", "Danzeria-Presenta-Greggio", event), "/events/danzeria-presenta-greggio");
});

test("no toca la URL si ya está con el slug, si no hay slug o si es otra ruta", () => {
  assert.equal(p.canonicalEventUrl("/events/danzeria-presenta-greggio", "danzeria-presenta-greggio", { id, slug: "danzeria-presenta-greggio" }), null);
  assert.equal(p.canonicalEventUrl(`/events/${id}`, id, { id }), null);
  assert.equal(p.canonicalEventUrl("/feed", id, { id, slug: "x" }), null);
  assert.equal(p.canonicalEventUrl(`/events/${id}extra`, id, { id, slug: "x" }), null);
});
