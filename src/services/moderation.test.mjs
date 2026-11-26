import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

/** Carga un service con un `api` falso que registra cada llamada (método, url, cuerpo). */
function runtime(file, exportName, responses = {}, failure) {
  const calls = [], exported = {};
  const handler = (method) => async (url, body) => {
    // Copia sin el prototipo del contexto vm, para comparar con deepStrictEqual.
    calls.push({ method, url, body: body === undefined ? undefined : JSON.parse(JSON.stringify(body)) });
    if (failure) throw failure;
    return { data: responses[`${method} ${url}`] };
  };
  const api = { get: handler("GET"), post: handler("POST"), put: handler("PUT"), delete: handler("DELETE") };
  const source = ts.transpileModule(fs.readFileSync(new URL(file, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  vm.runInNewContext(source, { exports: exported, require: () => ({ api }) });
  return { mod: exportName ? exported[exportName] : exported, calls };
}

test("deleteAccount borra la cuenta propia con DELETE /v1/users/me", async () => {
  const r = runtime("./users.ts", "usersApi");
  assert.equal(await r.mod.deleteAccount(), undefined);
  assert.deepEqual(r.calls, [{ method: "DELETE", url: "/v1/users/me", body: undefined }]);
});

test("blockUser y unblockUser usan el alias escapado en /v1/users/{username}/block", async () => {
  const r = runtime("./users.ts", "usersApi");
  await r.mod.blockUser("dj ana/1");
  await r.mod.unblockUser("dj ana/1");
  assert.deepEqual(r.calls.map((c) => [c.method, c.url]), [
    ["POST", "/v1/users/dj%20ana%2F1/block"],
    ["DELETE", "/v1/users/dj%20ana%2F1/block"],
  ]);
});

test("getBlockedUsers devuelve data y tolera una respuesta vacía", async () => {
  const blocked = [{ id: "u1", name: "Ana Pérez", username: "ana", avatarUrl: null, blockedAt: "2026-11-26T10:00:00Z" }];
  const r = runtime("./users.ts", "usersApi", { "GET /v1/users/me/blocks": { data: blocked } });
  assert.deepEqual(await r.mod.getBlockedUsers(), blocked);
  const empty = runtime("./users.ts", "usersApi", { "GET /v1/users/me/blocks": {} });
  // El [] se crea dentro del contexto vm: se compara como JSON para no depender de su prototipo.
  assert.equal(JSON.stringify(await empty.mod.getBlockedUsers()), "[]");
});

test("createReport manda solo los campos del contrato y omite un detalle vacío", async () => {
  const r = runtime("./reports.ts", null, { "POST /v1/reports": { id: "rep-1" } });
  const result = await r.mod.createReport({ targetType: "message", targetId: "m1", reason: "abuse", details: "   " });
  assert.deepEqual(result, { id: "rep-1" });
  assert.equal(r.calls[0].url, "/v1/reports");
  assert.deepEqual(r.calls[0].body, { targetType: "message", targetId: "m1", reason: "abuse" });
  await r.mod.createReport({ targetType: "user", targetId: "u1", reason: "other", details: "  me insulta  " });
  assert.deepEqual(r.calls[1].body, { targetType: "user", targetId: "u1", reason: "other", details: "me insulta" });
});

test("los errores del backend (403 blocked, 422, 500) llegan a quien llama", async () => {
  const error = Object.assign(new Error("blocked"), { response: { status: 403, data: { error: "blocked" } } });
  const users = runtime("./users.ts", "usersApi", {}, error);
  await assert.rejects(users.mod.deleteAccount(), error);
  await assert.rejects(users.mod.blockUser("ana"), error);
  await assert.rejects(users.mod.getBlockedUsers(), error);
  const reports = runtime("./reports.ts", null, {}, error);
  await assert.rejects(reports.mod.createReport({ targetType: "post", targetId: "p1", reason: "spam" }), error);
});
