import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function runtime() {
  const slots = [];
  let cursor = 0;
  const covers = {};
  const compile = (path) => ts.transpileModule(fs.readFileSync(new URL(path, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(compile("../../lib/communityCovers.ts"), { exports: covers });
  const exported = {};
  vm.runInNewContext(compile("./CommunityCover.tsx"), { exports: exported, require: key => {
    if (key === "react") return { useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = initial;
      return [slots[index], value => { slots[index] = typeof value === "function" ? value(slots[index]) : value; }];
    } };
    if (key === "react/jsx-runtime") return { jsx: (type, props) => ({ type, props }) };
    if (key === "next/image") return { default: "image" };
    if (key === "@/lib/communityCovers") return covers;
    if (key === "@/lib/utils") return { cn: (...values) => values.filter(Boolean).join(" ") };
    throw new Error(`Unexpected dependency: ${key}`);
  } });
  return {
    covers,
    render(props = {}) {
      cursor = 0;
      return exported.CommunityCover({ category: "electrónica", sizes: "100vw", ...props });
    },
  };
}

test("broken custom cover falls back to party photo, then bundled art without a retry loop", () => {
  const r = runtime();
  const props = { coverImageUrl: "https://example.com/broken.jpg" };
  let image = r.render(props);
  assert.equal(image.props.src, props.coverImageUrl);
  assert.equal(image.props.alt, "");
  assert.equal(image.props.fill, true);
  image.props.onError();
  image = r.render(props);
  assert.equal(image.props.src, r.covers.getCommunityCoverSources(null, "electrónica")[0]);
  image.props.onError();
  image = r.render(props);
  assert.equal(image.props.src, r.covers.LOCAL_COMMUNITY_COVER);
  image.props.onError();
  assert.equal(r.render(props), null);
});

test("a changed cover URL can load even after an earlier URL failed", () => {
  const r = runtime();
  r.render({ coverImageUrl: "https://example.com/old.jpg" }).props.onError();
  const image = r.render({ coverImageUrl: "https://example.com/new.jpg", className: "opacity-75" });
  assert.equal(image.props.src, "https://example.com/new.jpg");
  assert.equal(image.props.className, "object-cover opacity-75");
});
