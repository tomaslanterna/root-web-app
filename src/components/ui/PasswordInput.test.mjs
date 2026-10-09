import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function runtime() {
  const slots = [], effects = [];
  let cursor = 0, focused = 0, selection = [];
  const document = { activeElement: null };
  const input = { value: "Password123", selectionStart: 3, selectionEnd: 5,
    focus(options) { focused++; assert.equal(options.preventScroll, true); document.activeElement = input; },
    setSelectionRange(start, end) { selection = [start, end]; },
  };
  const react = {
    useState(initial) { const index = cursor++; if (!(index in slots)) slots[index] = initial; return [slots[index], value => { slots[index] = typeof value === "function" ? value(slots[index]) : value; }]; },
    useRef(initial) { const index = cursor++; if (!(index in slots)) slots[index] = { current: initial }; return slots[index]; },
    useLayoutEffect(fn) { effects.push(fn); },
  };
  const jsx = (type, props) => ({ type, props });
  const exported = {};
  const compiled = ts.transpileModule(fs.readFileSync(new URL("./PasswordInput.tsx", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(compiled, { exports: exported, document, require: key => key === "react" ? react : key === "react/jsx-runtime" ? { jsx, jsxs: jsx } : key === "@/lib/utils" ? { cn: (...values) => values.filter(Boolean).join(" ") } : { Eye: "eye", EyeOff: "eye-off", Lock: "lock" } });
  const render = (props = {}) => {
    cursor = 0; effects.length = 0;
    const tree = exported.PasswordInput({ id: "password", value: input.value, autoComplete: "current-password", ...props });
    const field = tree.props.children.find(item => item.type === "input");
    field.props.ref.current = input;
    effects.forEach(fn => fn());
    return { field: field.props, button: tree.props.children.find(item => item.type === "button").props };
  };
  return { render, input, document, get focused() { return focused; }, get selection() { return selection; } };
}

test("eye toggles without submitting, changing text, autocomplete, focus or cursor", () => {
  const r = runtime(); r.document.activeElement = r.input;
  let view = r.render();
  assert.equal(view.field.type, "password"); assert.equal(view.button.type, "button");
  assert.equal(view.button["aria-label"], "Mostrar contraseña"); assert.equal(view.button["aria-pressed"], false);
  let prevented = false; view.button.onPointerDown({ preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  view.button.onClick(); view = r.render();
  assert.equal(view.field.type, "text"); assert.equal(view.field.value, "Password123");
  assert.equal(view.field.autoComplete, "current-password"); assert.equal(view.button["aria-label"], "Ocultar contraseña");
  assert.equal(view.button["aria-controls"], "password"); assert.equal(view.button["aria-pressed"], true);
  assert.deepEqual(r.selection, [3, 5]); assert.equal(r.focused, 1); assert.match(view.field.className, /pr-14/);
  view.button.onClick(); view = r.render(); assert.equal(view.field.type, "password");
});

test("keyboard toggle preserves button focus; disabled field disables the eye", () => {
  const r = runtime(); let view = r.render();
  r.document.activeElement = { type: "button" }; view.button.onClick(); view = r.render();
  assert.equal(view.field.type, "text"); assert.equal(r.focused, 0);
  view = r.render({ disabled: true, autoComplete: "new-password" });
  assert.equal(view.button.disabled, true); assert.equal(view.field.disabled, true); assert.equal(view.field.autoComplete, "new-password");
});
