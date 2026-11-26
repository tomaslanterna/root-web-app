import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createHash } from "node:crypto";
import ts from "typescript";
import vm from "node:vm";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");

function loadLib(platform) {
  const source = read("./appleSignIn.ts");
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  const calls = [];
  const module = { exports: {} };
  const plugin = {
    AppleSignIn: {
      initialize: async (options) => calls.push(["initialize", options]),
      signIn: async (options) => {
        calls.push(["signIn", options]);
        if (platform === "cancel") throw Object.assign(new Error("canceled"), { code: "SIGN_IN_CANCELED" });
        return { idToken: "id-token", authorizationCode: "code", givenName: "Ana", familyName: null, state: options.state };
      },
    },
    ErrorCode: { SignInCanceled: "SIGN_IN_CANCELED" },
    SignInScope: { Email: "EMAIL", FullName: "FULL_NAME" },
  };
  const capacitor = { Capacitor: { isNativePlatform: () => platform !== "web", getPlatform: () => (platform === "web" ? "web" : "ios") } };
  vm.runInNewContext(outputText, {
    module, exports: module.exports, crypto: globalThis.crypto, TextEncoder,
    process: { env: {} },
    require: (name) => (name === "@capacitor/core" ? capacitor : plugin),
  });
  return { lib: module.exports, calls };
}

test("iOS sends Apple the SHA-256 of the nonce and the backend the original nonce", async () => {
  const { lib, calls } = loadLib("ios");
  assert.equal(lib.isAppleSignInAvailable(), true);
  const input = await lib.signInWithApple();
  const sent = calls.find((c) => c[0] === "signIn")[1];
  assert.equal(sent.nonce, createHash("sha256").update(input.nonce).digest("hex"));
  assert.deepEqual([...sent.scopes], ["EMAIL", "FULL_NAME"]);
  assert.equal(input.identityToken, "id-token");
  assert.equal(input.authorizationCode, "code");
  assert.equal(input.givenName, "Ana");
  assert.equal(input.familyName, "");
  assert.equal(calls.some((c) => c[0] === "initialize"), false);
});

test("closing Apple's sheet is a cancellation, not an error", async () => {
  const { lib } = loadLib("cancel");
  await assert.rejects(lib.signInWithApple(), (error) => error.name === "AppleSignInCanceledError");
});

test("without a Services ID the web hides the Apple button", () => {
  const { lib } = loadLib("web");
  assert.equal(lib.isAppleSignInAvailable(), false);
});

test("login and register show Continue with Apple above Google", () => {
  for (const [page, googleTag] of [["../app/login/page.tsx", "<GoogleAuthWrapper"], ["../app/register/page.tsx", "<GoogleLogin"]]) {
    const source = read(page);
    const apple = source.indexOf("<AppleSignInButton");
    const google = source.lastIndexOf(googleTag);
    assert.ok(apple !== -1 && apple < google, `${page}: Apple button must come before Google`);
  }
});
