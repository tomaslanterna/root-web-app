import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
const compile = file => ts.transpileModule(fs.readFileSync(new URL(file, import.meta.url),"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const frames = {}; vm.runInNewContext(compile("../lib/badgeTransition.ts"),{exports:frames});

function runtime(reduced = false) {
  const slots=[], pending=[], handlers=new Map(), historyEntries=[{}]; let cursor=0, current, guard=true;
  const animations=[],timers=[];
  const react={
    useState(initial) { const i=cursor++; if(!(i in slots)) slots[i]=initial; return[slots[i],value=>{slots[i]=typeof value==="function"?value(slots[i]):value;}]; },
    useRef(initial) { const i=cursor++; if(!(i in slots)) slots[i]={current:initial}; return slots[i]; },
    useCallback(fn,deps) { const i=cursor++; if(!slots[i] || deps.some((v,j)=>v!==slots[i].deps[j])) slots[i]={fn,deps}; return slots[i].fn; },
    useEffect(fn,deps) { const i=cursor++; if(!slots[i] || deps.some((v,j)=>v!==slots[i].deps[j])) {pending.push(()=>{slots[i]?.dispose?.();slots[i]={deps,dispose:fn()};});} },
  };
  react.useLayoutEffect=react.useEffect;
  const history={get state(){return historyEntries.at(-1);},pushState(value){historyEntries.push(value);},back(){historyEntries.pop();handlers.get("popstate")?.();}};
  const api={};
  vm.runInNewContext(compile("./useBadgeTransition.ts"),{exports:api,require:key=>key==="react"?react:frames,window:{history,innerHeight:800,location:{href:"http://localhost/profile/one"},matchMedia:()=>({matches:reduced}),setTimeout:(fn,delay)=>{timers.push({fn,delay});return timers.length;},clearTimeout:()=>{},addEventListener:(name,fn)=>handlers.set(name,fn),removeEventListener:name=>handlers.delete(name)}});
  const render=()=>{cursor=0;current=api.useBadgeTransition(()=>guard);return current;};
  const flush=()=>{while(pending.length) pending.shift()();};
  const source={getBoundingClientRect:()=>({left:10,top:350,width:90,height:90})};
  const layout=(top=80)=>{current.heroRef.current={getBoundingClientRect:()=>({left:60,top,width:180,height:180})};current.movingRef.current={style:{},animate(keyframes,options){let resolve;const finished=new Promise(done=>{resolve=done;}); const a={keyframes,options,finished,finish:resolve,cancel(){}}; animations.push(a);return a;}};};
  render();flush();
  return{render,flush,layout,animations,timers,source,history,historyEntries,handlers,setGuard:v=>{guard=v;},get current(){return current;}};
}

test("shared element moves only with transform, reverses and preserves the source position", () => {
  const source={left:10,top:350,width:90,height:90},target={left:60,top:80,width:180,height:180};
  const open=frames.badgeTransitionFrames(source,target,true),close=frames.badgeTransitionFrames(source,target,false);
  assert.equal(open[0].transform,"translate(-50px, 270px) scale(0.5)"); assert.equal(close[1].transform,open[0].transform);
  assert.deepEqual(Object.keys(open[0]),["transform"]);
});
test("opening prevents repeated activation, uses 320ms and Back is guarded before inverse close", async () => {
  const r=runtime();r.current.open("a",r.source);r.current.open("b",r.source);
  r.render();r.layout();r.flush();assert.equal(r.current.eventId,"a");assert.equal(r.historyEntries.length,2);
  assert.equal(r.animations[0].options.duration,320);
  r.animations[0].finish();await Promise.resolve();r.render();r.flush();assert.equal(r.current.phase,"open");
  r.setGuard(false);r.history.back();r.render();r.flush();assert.equal(r.current.phase,"open");assert.equal(r.historyEntries.length,2);
  r.setGuard(true);r.history.back();r.render();r.layout();r.flush();assert.equal(r.current.phase,"closing");
  r.animations.at(-1).finish();await Promise.resolve();r.render();r.flush();assert.equal(r.current.eventId,null);assert.equal(r.historyEntries.length,1);
});
test("reduced motion skips shared animation and returns directly to the collection", () => {
  const r=runtime(true);r.current.open("a",r.source);r.render();r.flush();assert.equal(r.current.phase,"open");assert.equal(r.animations.length,0);
  r.current.close();r.render();r.flush();assert.equal(r.current.eventId,null);assert.equal(r.historyEntries.length,1);
});

test("closing a scrolled detail uses a short fade instead of flying from outside the viewport", async () => {
  const r=runtime();r.current.open("a",r.source);r.render();r.layout();r.flush();
  r.animations[0].finish();await Promise.resolve();r.render();r.flush();
  r.current.close();r.render();r.layout(-250);r.flush();
  assert.equal(r.animations.length,1);assert.equal(r.timers.at(-1).delay,160);
  r.timers.at(-1).fn();r.render();r.flush();assert.equal(r.current.eventId,null);
});
