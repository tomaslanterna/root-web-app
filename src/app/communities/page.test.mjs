import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

test("RRPP text is last in Explore, after pagination, and absent in My communities", () => {
  const slots = [];
  let cursor = 0;
  const exported = {};
  const jsx = (type, props) => ({ type, props });
  const compiled = ts.transpileModule(fs.readFileSync(new URL("./page.tsx", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(compiled, { exports: exported, require: key => {
    if (key === "react") return { useEffect() {}, useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = initial;
      return [slots[index], value => { slots[index] = typeof value === "function" ? value(slots[index]) : value; }];
    } };
    if (key === "react/jsx-runtime") return { jsx, jsxs: jsx };
    if (key === "lucide-react") return {};
    if (key === "@/components/communities/CommunityList") return { CommunityList: "list" };
    if (key === "@/components/ui/Button") return { Button: "button" };
    if (key === "@/hooks/useCommunities") return { useCommunityDirectory: () => ({ communities: [], meta: { total: 20, hasMore: true }, load: async () => {}, isLoading: false, error: null }) };
    if (key === "@/context/AuthContext") return { useAuth: () => ({ user: { id: "test-user" } }) };
    if (key === "next/link") return { default: "link" };
    throw new Error(`Unexpected dependency: ${key}`);
  } });
  const render = () => { cursor = 0; return exported.default(); };
  const main = tree => tree.props.children.find(child => child.type === "main");
  const children = main(render()).props.children;
  assert.equal(children.at(-1).type, "p");
  assert.equal(children.at(-1).props.children, "si sos RRPP y queres tener tu comunidad, contactanos!");
  assert.equal(children.at(-2).props.children.props.children[1], "Cargar más");
  children[0].props.children.find(tab => tab.props.children === "Mis comunidades").props.onClick();
  assert.equal(main(render()).props.children.at(-1), false);
});
