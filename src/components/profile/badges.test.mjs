import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const appearance = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(new URL("../../lib/badgeAppearance.ts", import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports: appearance });

function component(path, name, dependencies = {}) {
  const state = []; let cursor = 0;
  const exported = {};
  const jsx = (type, props) => ({ type, props });
  const react = { useCallback: fn => fn, useEffect: fn => fn(), useId: () => "test-id", useRef(initial) { const index = cursor++; if (!(index in state)) state[index] = { current: initial }; return state[index]; }, useState(initial) { const index = cursor++; if (!(index in state)) state[index] = typeof initial === "function" ? initial() : initial; return [state[index], value => { state[index] = typeof value === "function" ? value(state[index]) : value; }]; } };
  const compiled = ts.transpileModule(fs.readFileSync(new URL(path, import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  vm.runInNewContext(compiled, { exports: exported, queueMicrotask: fn => fn(), window: { addEventListener() {}, removeEventListener() {} }, require: key => {
    if (key === "react") return react;
    if (key === "react/jsx-runtime") return { jsx, jsxs: jsx };
    if (key === "@/lib/utils") return { cn: (...v) => v.filter(Boolean).join(" ") };
    if (key === "lucide-react") return new Proxy({}, { get: (_, key) => String(key) });
    if (key in dependencies) return dependencies[key];
    if (key === "next/link") return { default: "link" };
    if (key === "@/components/ui/Modal") return { ConfirmModal: "confirm", Modal: "modal" };
    if (key === "@/lib/badgePreview") return { badgePreview: (_, badges) => badges };
    if (key === "@/context/AuthContext") return { useAuth: () => ({ user: null, isLoading: false }) };
    if (key === "./ArtistRatings") return { ArtistRatings: "artistRatings" };
    if (key === "./BadgeShareDialog") return { BadgeShareDialog: "shareDialog" };
    if (key === "@/hooks/useBadgeShare") return { useBadgeShare: () => ({}) };
    if (key === "@/hooks/useReviewReminder") return { useEventCheckout: () => ({}) };
    if (key === "@/lib/badgeLocation") return { badgeLocation: b => b.location };
    if (key === "@/services/badges") return { badgeFlyerUrl: id => `/events/${id}/flyer`, badgeArtistImageUrl: (id, artist) => `/events/${id}/artists/${artist}` };
    throw new Error(`Unexpected dependency ${key}`);
  } });
  return props => { cursor = 0; return exported[name](props); };
}
function nodes(tree) {
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  if (!tree || typeof tree !== "object") return [];
  return [tree, ...nodes(tree.props?.children)];
}
const badge = { eventId: "event-a", title: "Una fiesta", imageUrl: "", confirmedAt: "2026-10-01T01:00:00Z", eventDate: "2026-10-01T00:00:00Z", location: "Montevideo", review: null };

test("zero is an explicit accessible option, separate from an absent rating", () => {
  const render = component("../ui/StarRating.tsx", "StarRating");
  let changed;
  let tree = render({ value: null, allowZero: true, onChange: value => { changed = value; } });
  let radios = nodes(tree).filter(n => n.props.role === "radio");
  assert.equal(radios.length, 6);
  assert.equal(radios.every(n => !n.props["aria-checked"]), true);
  assert.equal(radios[0].props.tabIndex, 0);
  radios[0].props.onClick(); assert.equal(changed, 0);
  tree = render({ value: 0, allowZero: true });
  radios = nodes(tree).filter(n => n.props.role === "radio");
  assert.equal(radios[0].props["aria-checked"], true);
  assert.equal(radios.slice(1).every(n => !n.props["aria-checked"]), true);
  const readonly = render({ value: 0, readonly: true });
  assert.equal(readonly.props["aria-label"], "0 de 5 estrellas");
  assert.equal(nodes(readonly).some(n => n.type === "button"), false);
});

test("stars support keyboard wrapping and reduced-motion styling", () => {
  const render = component("../ui/StarRating.tsx", "StarRating");
  let changed, selector;
  const radios = nodes(render({ value: 5, allowZero: true, onChange: value => { changed = value; } })).filter(n => n.props.role === "radio");
  const event = { key: "ArrowRight", preventDefault() {}, currentTarget: { closest: () => null, parentElement: { querySelector(value) { selector = value; return { focus() {} }; } } } };
  radios.at(-1).props.onKeyDown(event);
  assert.equal(changed, 0); assert.equal(selector, '[data-rating="0"]');
  assert.match(radios[0].props.className, /motion-safe:/);
});

test("single star starts at one, grows through five, animates interaction and becomes dotted at zero", () => {
  const render = component("../ui/StarRating.tsx", "StarRating");
  let changed;
  let tree = render({ value: null, appearance: "slider", label: "Evento", onChange: value => { changed = value; } });
  let slider = nodes(tree).find(n => n.props.type === "range");
  assert.equal(slider.props.min, 0); assert.equal(slider.props.max, 5); assert.equal(slider.props.step, 1);
  assert.equal(slider.props["aria-label"], "Evento");
  assert.equal(slider.props.value, 1);
  assert.equal(nodes(tree).filter(n => n.type === "Star").length, 1);
  assert.equal(nodes(tree).some(n => n.type === "button" || n.props.role === "radio"), false);
  slider.props.onPointerUp({ currentTarget: { value: "0" } }); assert.equal(changed, 0);
  slider.props.onChange({ currentTarget: { value: "3" } }); assert.equal(changed, 3);
  let previous = 0;
  for (let value = 1; value <= 5; value++) {
    tree = render({ value, appearance: "slider" });
    const star = nodes(tree).find(n => n.type === "Star");
    const scale = Number(star.props.style.transform.match(/scale\(([^)]+)/)[1]);
    assert.ok(scale > previous); previous = scale;
    assert.match(star.props.className, /fill-\[\#D4FF00\]/);
    assert.match(star.props.className, /motion-safe:transition/);
  }
  tree = render({ value: 3, appearance: "slider" });
  slider = nodes(tree).find(n => n.props.type === "range");
  assert.equal(slider.props.style["--rating-progress"], "60%");
  slider.props.onPointerDown(); tree = render({ value: 3, appearance: "slider" });
  assert.equal(nodes(tree).find(n => n.props.type === "range").props["data-active"], true);
  nodes(tree).find(n => n.props.type === "range").props.onPointerCancel();
  tree = render({ value: 0, appearance: "slider" });
  const empty = nodes(tree).find(n => n.type === "Star");
  assert.match(empty.props.className, /fill-transparent/);
  assert.equal(empty.props.strokeDasharray, "1.4 2.8");
  tree = render({ value: null, appearance: "slider", onChange: value => { changed = value; } });
  nodes(tree).find(n => n.props.type === "range").props.onKeyDown({ key: "Home" }); assert.equal(changed, 0);
  nodes(tree).find(n => n.props.type === "range").props.onKeyDown({ key: "Enter", preventDefault() {} }); assert.equal(changed, 1);
  tree = render({ value: 5, appearance: "slider", readonly: true, onChange: () => { throw new Error("locked"); } });
  slider = nodes(tree).find(n => n.props.type === "range");
  assert.equal(slider.props.disabled, true);
  slider.props.onChange({ currentTarget: { value: "0" } });
  assert.equal(nodes(tree).filter(n => n.type === "Star").length, 1);
});

test("review requires confirmation, cancellation preserves draft, saved zero is locked", async () => {
  const calls = [];
  const render = component("./EventReviewForm.tsx", "EventReviewForm", {
    "@/components/ui/Button": { Button: "button" },
    "@/components/ui/StarRating": { StarRating: "stars" },
    "@/hooks/useBadges": { useEventReview: () => ({ save: async input => { calls.push(input); return { ...badge, review: { generalRating: input.general_rating } }; }, isSaving: false, saveError: null }) },
  });
  let tree = render({ badge });
  assert.equal(nodes(tree).find(n => n.props.type === "submit").props.disabled, false);
  assert.equal(nodes(tree).find(n => n.type === "stars").props.value, 1);
  nodes(tree).find(n => n.type === "stars").props.onChange(0);
  tree = render({ badge });
  nodes(tree).find(n => n.type === "textarea").props.onChange({ target: { value: "  buena noche  " } });
  tree = render({ badge });
  assert.equal(nodes(tree).find(n => n.props.type === "submit").props.disabled, false);
  nodes(tree).find(n => n.type === "form").props.onSubmit({ preventDefault() {} });
  assert.equal(calls.length, 0);
  tree = render({ badge });
  nodes(tree).find(n => n.type === "confirm").props.onClose();
  tree = render({ badge });
  assert.equal(nodes(tree).find(n => n.type === "textarea").props.value, "  buena noche  ");
  assert.equal(nodes(tree).find(n => n.type === "confirm").props.isOpen, false);
  nodes(tree).find(n => n.type === "form").props.onSubmit({ preventDefault() {} });
  tree = render({ badge });
  await nodes(tree).find(n => n.type === "confirm").props.onConfirm();
  assert.equal(calls[0].general_rating, 0); assert.equal(calls[0].comment, "buena noche");
  tree = render({ badge });
  assert.equal(nodes(tree).some(n => n.props.role === "status"), true);
  const edit = component("./EventReviewForm.tsx", "EventReviewForm", {
    "@/components/ui/Button": { Button: "button" }, "@/components/ui/StarRating": { StarRating: "stars" },
    "@/hooks/useBadges": { useEventReview: () => ({ isSaving: false, saveError: null }) },
  })({ badge: { ...badge, review: { generalRating: 0, comment: "" } } });
  assert.equal(nodes(edit).find(n => n.type === "stars").props.value, 0);
  assert.equal(nodes(edit).find(n => n.props.type === "submit"), undefined);
  assert.equal(nodes(edit).find(n => n.type === "textarea").props.readOnly, true);
  assert.equal(nodes(edit).find(n => n.type === "stars").props.readonly, true);
});

test("badge collection shows true total, empty invitation and never exposes another user's review", () => {
  let page = { data: [], meta: { total: 0, hasMore: false } };
  let selectedId = null;
  let updated, closed = false;
  const render = component("./BadgeCollection.tsx", "BadgeCollection", {
    "@/components/ui/Button": { Button: "button" }, "@/components/ui/Modal": { Modal: "modal", ConfirmModal: "confirm" },
    "@/hooks/useBadges": { useBadgeCollection: () => ({ page, isLoading: false, error: null, update: badge => { updated = badge; } }), useBadgeLineup: () => ({}) },
    "@/hooks/useBadgeTransition": { useBadgeTransition: () => ({ eventId: selectedId, phase: selectedId ? "open" : "closed", open: id => { selectedId = id; }, close: () => { closed = true; } }) },
    "@/lib/badgeAppearance": { ...appearance, groupBadges: data => data.length ? [{ key: "2026-10", label: "Octubre 2026", badges: data }] : [] },
    "./EventBadgeArtwork": { EventBadgeArtwork: "artwork" }, "./BadgeDetail": { BadgeDetail: "detail" },
    "./BadgeDesignGuide": { BadgeDesignGuide: "designGuide" },
  });
  let tree = render({ username: "one", isOwner: true });
  assert.equal(nodes(tree).some(n => n.type === "h3" && n.props.children.includes("Tu colección empieza")), true);
  page = { data: [
    { ...badge, review: { generalRating: 0, comment: "personal" } },
    { ...badge, eventId: "event-b", headliner: { id: "dj", name: "DJ principal" }, steps: 12450, mostDanced: true },
    { ...badge, eventId: "event-c", headliner: { id: "unknown", name: " " }, steps: 0 },
  ], meta: { total: 20, hasMore: true } };
  tree = render({ username: "one", isOwner: false });
  assert.equal(nodes(tree).some(n => /grid-cols-3/.test(n.props.className || "")), true);
  assert.equal(nodes(tree).find(n => n.type === "artwork").props.compact, true);
  const open = nodes(tree).find(n => String(n.props["aria-label"] || "").startsWith("Ver insignia:"));
  assert.equal(nodes(open).filter(n => n.type === "span").length, 0);
  assert.equal(open.props.children.type, "artwork");
  assert.equal(nodes(tree).filter(n => n.type === "artwork").length, 3);
  assert.equal(nodes(tree).some(n => n.props.children === "Una fiesta"), false);
  assert.equal(nodes(tree).find(n => n.type === "designGuide").props.example.review, null);
  open.props.onClick({ currentTarget: { firstElementChild: {} } }); tree = render({ username: "one", isOwner: false });
  const detail = nodes(tree).find(n => n.type === "detail");
  assert.equal(detail.props.isOwner, false); assert.equal(detail.props.badge.review, null);
  detail.props.onSaved({ ...badge, review: { generalRating: 4 } });
  assert.equal(updated.review.generalRating, 4); assert.equal(closed, true);
  assert.equal(nodes(tree).some(n => n.type === "p" && n.props.children === "Cada insignia guarda un lugar, una fecha y una historia."), true);
  assert.equal(nodes(tree).some(n => n.type === "button" && n.props.children === "Cargar más insignias"), true);
  assert.equal(nodes(tree).some(n => n.type === "span" && n.props.children[0] === 20), true);
});

test("design guide is collapsed by default, explains all three states and never supplies fake badge data", () => {
  const render = component("./BadgeDesignGuide.tsx", "BadgeDesignGuide", { "./EventBadgeArtwork": { EventBadgeArtwork: "artwork" } });
  let tree = render({ example: badge });
  assert.equal(tree.type, "details"); assert.equal(tree.props.open, undefined);
  assert.deepEqual(nodes(tree).filter(n => n.type === "h3").map(n => n.props.children), ["Reseñada", "Sin reseñar", "La más bailada"]);
  const examples = nodes(tree).filter(n => n.type === "artwork");
  assert.equal(examples.every(n => n.props.badge === badge), true);
  assert.deepEqual(examples.map(n => n.props.illustration), ["reviewed", "unreviewed", "mostDanced"]);
  assert.equal(nodes(tree).some(n => n.type === "p" && n.props.children.includes("El arco refleja tu puntuación")), true);
  assert.equal(nodes(tree).some(n => n.type === "p" && n.props.children.includes("La corona y los laureles lima")), true);
  tree = render({});
  assert.equal(nodes(tree).some(n => n.type === "artwork"), false);
  assert.equal(nodes(tree).filter(n => n.type === "h3").length, 3);
});

test("circular artwork prioritizes the flyer, uses a fallback and treats zero as reviewed", () => {
  const render = component("./EventBadgeArtwork.tsx", "EventBadgeArtwork", {
    "next/image": { default: "image" },
    "@/lib/badgeAppearance": {
      badgeDJ: () => "Main DJ",
      badgeProgress: value => (value ?? 0) * 20,
      badgeRatingValue: value => value == null ? "—" : value.toFixed(1),
      badgeRingLabel: () => "Montevideo · Venue · 01.10.2026 · MAIN DJ",
      badgeStepValue: () => "12,5 K",
    },
  });
  const input = { badge: { ...badge, genre: "Electrónica", imageUrl: "https://example.test/event.jpg", headliner: { id: "dj", name: "Main DJ", imageUrl: "https://example.test/dj.jpg" } }, compact: true };
  let tree = render(input);
  assert.match(tree.props.className, /max-w-40/);
  assert.match(nodes(tree).find(n => n.props["data-badge-circle"] !== undefined).props.className, /aspect-square.*rounded-full/);
  assert.equal(nodes(tree).find(n => n.type === "image").props.src, "/events/event-a/flyer");
  assert.match(nodes(tree).find(n => n.type === "image").props.style.filter, /saturate/);
  assert.equal(nodes(tree).find(n => n.type === "image").props.style.opacity, .7);
  assert.equal(nodes(tree).some(n => n.props.children === "Reseñar"), true);
  assert.equal(nodes(tree).some(n => n.props.children === "12,5 K"), true);
  assert.equal(nodes(tree).some(n => n.props.children === "pasos esa noche"), true);
  assert.equal(nodes(tree).some(n => n.props.children === "Electrónica" || n.type === "BadgeCheck"), false);
  nodes(tree).find(n => n.type === "image").props.onError();
  tree = render(input);
  assert.equal(nodes(tree).find(n => n.type === "image").props.src, "/events/event-a/artists/dj");
  nodes(tree).find(n => n.type === "image").props.onError();
  tree = render(input);
  assert.equal(nodes(tree).some(n => n.type === "image"), false);
  input.badge.eventId = "event-b";
  tree = render({ badge: input.badge });
  assert.equal(nodes(tree).find(n => n.type === "image").props.src, "/events/event-b/flyer");
  tree = render({ badge: { ...input.badge, review: { generalRating: 0 }, mostDanced: true } });
  assert.equal(tree.props["data-reviewed"], true); assert.equal(tree.props["data-most-danced"], true);
  assert.equal(nodes(tree).some(n => n.type?.name === "MostDancedAccolade"), true);
  assert.equal(nodes(tree).some(n => n.type === "Crown"), false);
  assert.doesNotMatch(nodes(tree).find(n => n.props["data-badge-circle"] !== undefined).props.className, /rgba\(198,255,0/);
  assert.equal(nodes(tree).find(n => n.type === "image").props.style.filter, "none");
  assert.equal(nodes(tree).filter(n => n.type === "circle" && n.props.pathLength).length, 1);
  assert.equal(nodes(tree).find(n => n.type === "path").props.d, "M 18.5 73.8 A 39.5 39.5 0 1 1 81.5 73.8");
  assert.equal(nodes(tree).find(n => n.type === "text").props.textLength, undefined);
  const border = nodes(tree).find(n => n.type === "circle" && n.props.pathLength);
  assert.equal(border.props.strokeWidth, "1.55"); assert.equal(border.props.r, "45.8"); assert.equal(border.props.stroke, "#C6FF00");
  assert.equal(nodes(tree).some(n => n.props.children === "Reseñar"), false);
  tree = render({ badge: { ...input.badge, review: { generalRating: 4 }, mostDanced: false } });
  assert.equal(nodes(tree).some(n => n.type?.name === "MostDancedAccolade"), false);
  assert.equal(nodes(tree).find(n => n.type === "circle" && n.props.pathLength).props.strokeDashoffset, 20);
  assert.equal(nodes(tree).find(n => n.type === "circle" && n.props.pathLength).props.r, "45.8");
  tree = render({ badge: { ...input.badge, review: null, mostDanced: true } });
  assert.equal(tree.props["data-reviewed"], false); assert.equal(nodes(tree).find(n => n.type === "circle" && n.props.pathLength).props.strokeWidth, "1.55");
  assert.equal(nodes(tree).some(n => n.props.children === "Reseñar"), true);
  tree = render({ badge, illustration: "mostDanced" });
  assert.equal(tree.props["data-illustration"], "mostDanced");
  assert.equal(tree.props["data-reviewed"], true); assert.equal(tree.props["data-most-danced"], true);
  assert.equal(nodes(tree).some(n => n.type?.name === "MostDancedAccolade"), true);
  assert.equal(nodes(tree).some(n => n.props.children === "pasos esa noche"), false);
  assert.equal(badge.review, null); assert.equal(badge.mostDanced, undefined);
  tree = render({ badge });
  assert.equal(tree.props["data-reviewed"], false); assert.equal(tree.props["data-most-danced"], false);
});

test("most danced accolade is one scalable metallic SVG with a lime crown and narrow symmetric lime laurels", () => {
  const render = component("./EventBadgeArtwork.tsx", "MostDancedAccolade", {
    "next/image": { default: "image" },
    "@/lib/badgeAppearance": {
      badgeDJ: () => "DJ",
      badgeProgress: () => 0,
      badgeRatingValue: () => "—",
      badgeRingLabel: () => "Evento",
      badgeStepValue: () => "0",
    },
  });
  const tree = render({ id: "accolade-test", animate: true });
  assert.equal(tree.type, "svg");
  assert.equal(tree.props["data-badge-accolade"], true);
  assert.equal(tree.props["data-animate"], true);
  assert.equal(tree.props.viewBox, "0 0 124 128");
  assert.equal(nodes(tree).filter(n => n.type === "use").length, 28);
  assert.equal(nodes(tree).some(n => n.type === "path" && n.props.fill === "url(#accolade-test-lime)"), true);
  assert.equal(nodes(tree).filter(n => n.type === "path" && n.props.fill === "url(#accolade-test-lime)").length >= 2, true);
  assert.equal(nodes(tree).some(n => n.type === "linearGradient" && String(n.props.id).includes("gold")), false);
});

test("event, text and all selected DJ scores save together only after confirmation", async () => {
  const calls = [];
  const render = component("./EventReviewForm.tsx", "EventReviewForm", {
    "@/components/ui/Button": { Button: "button" }, "@/components/ui/StarRating": { StarRating: "stars" },
    "@/hooks/useBadges": { useEventReview: () => ({ save: async input => { calls.push(input); return badge; }, isSaving: false }) },
  });
  const props = { badge, lineup: { artists: [{ artistId: "a", artist: { name: "DJ A" } }, { artistId: "b", artist: { name: "DJ B" } }, { artistId: "c", artist: { name: "DJ C" } }] } };
  let tree = render(props);
  const artists = nodes(tree).find(n => n.type === "artistRatings");
  nodes(tree).find(n => n.type === "stars").props.onChange(4);
  artists.props.onChange("a", 0);
  artists.props.onChange("b", 3);
  tree = render(props); nodes(tree).find(n => n.type === "form").props.onSubmit({ preventDefault() {} });
  tree = render(props); await nodes(tree).find(n => n.type === "confirm").props.onConfirm();
  assert.equal(calls[0].general_rating, 4);
  assert.deepEqual(JSON.parse(JSON.stringify(calls[0].artist_ratings)), [{ artist_id: "a", rating: 0 }, { artist_id: "b", rating: 3 }, { artist_id: "c", rating: 1 }]);
});

test("lineup ratings start at one but never replace saved zero or historical missing scores", () => {
  const render = component("./ArtistRatings.tsx", "ArtistRatings", { "next/image": { default: "image" }, "@/components/ui/StarRating": { StarRating: "stars" } });
  const changed = [];
  let tree = render({ eventId: "event-a", ratings: { a: 0 }, lineup: { names: [], artists: [{ artistId: "a", isHeadliner: true, artist: { name: "DJ real", avatarUrl: "artists/photo.jpg" } }] }, onChange: (...values) => changed.push(values) });
  assert.equal(nodes(tree).find(n => n.type === "image").props.src, "/events/event-a/artists/a");
  assert.equal(nodes(tree).find(n => n.type === "stars").props.value, 0);
  nodes(tree).find(n => n.type === "stars").props.onChange(5);
  assert.deepEqual(changed, [["a", 5]]);
  tree = render({ eventId: "event-a", ratings: {}, lineup: { names: ["Nombre histórico"], artists: [] } });
  assert.equal(nodes(tree).some(n => n.type === "stars"), false);
  assert.equal(nodes(tree).some(n => n.props.children === "Nombre histórico"), true);
  tree = render({ eventId: "event-a", ratings: {}, lineup: { names: [], artists: [{ artistId: "example", artist: { name: "DJ 1", artistType: "DJ de ejemplo", isExample: true } }] } });
  assert.equal(nodes(tree).find(n => n.type === "stars").props.value, 1);
  assert.equal(nodes(tree).some(n => n.props.children === "DJ 1, DJ 2 y DJ 3 son ejemplos para probar tu reseña. No son el lineup oficial."), true);
  assert.equal(nodes(tree).some(n => n.type === "image"), false);
  tree = render({ eventId: "event-a", ratings: {}, readonly: true, lineup: { names: [], artists: [{ artistId: "unrated", artist: { name: "DJ without a score" } }] } });
  assert.equal(nodes(tree).find(n => n.type === "stars").props.value, null);
});

test("circle rating keeps five indicators and a separate, keyboard-accessible zero", () => {
  let changed;
  const render = component("../ui/StarRating.tsx", "StarRating");
  const tree = render({ value: 0, allowZero: true, appearance: "circles", onChange: value => { changed = value; } });
  const radios = nodes(tree).filter(n => n.props.role === "radio");
  assert.equal(radios.length, 6); assert.equal(radios.at(-1).props["aria-checked"], true);
  assert.equal(radios.at(-1).props.children, "0 estrellas");
  radios[3].props.onClick(); assert.equal(changed, 4);
});

test("detail reuses the complete badge visual and shows only registered lineup metadata", () => {
  const render = component("./BadgeDetail.tsx", "BadgeDetail", {
    "@/lib/badgeAppearance": { attendanceDate: () => "1 oct. 2026" },
    "./EventBadgeArtwork": { EventBadgeArtwork: "artwork" },
    "./EventReviewForm": { EventReviewForm: "reviewForm" },
  });
  const props = { badge, isOwner: true, moving: false, closing: false, lineupLoading: false, lineupError: false };
  let tree = render(props);
  assert.equal(nodes(tree).find(n => n.type === "artwork").props.badge, badge);
  assert.equal(nodes(tree).find(n => n.type === "artwork").props.celebrate, true);
  assert.equal(nodes(tree).find(n => n.type === "reviewForm").props.lineup, undefined);
  const actual = { ...badge, steps: 12450, review: { generalRating: 0 } };
  tree = render({ ...props, badge: actual, lineup: { artists: [{ artistId: "a", isHeadliner: true, artist: { name: "Artista registrado", artistType: "dj" } }], names: ["Nombre anterior"] } });
  assert.equal(nodes(tree).find(n => n.type === "reviewForm").props.lineup.artists[0].artist.name, "Artista registrado");
  assert.equal(nodes(tree).some(n => n.props.children === "Nombre anterior"), false);
  assert.equal(nodes(tree).some(n => n.props.role === "radio"), false);
  tree = render({ ...props, isOwner: false, lineup: { artists: [], names: ["Lineup original"] } });
  assert.equal(nodes(tree).some(n => n.props.children === "Lineup original"), true);
  assert.equal(nodes(tree).some(n => n.type === "reviewForm"), false);
  const login = nodes(tree).find(n => n.type === "link");
  assert.equal(login.props.href, "/login?next=%2Fevents%2Fevent-a%2Fsurvey");
  tree = render({ ...props, badge: { ...badge, source: "manual" } });
  assert.equal(nodes(tree).some(n => n.props.children === "Insignia asignada manualmente · No acredita asistencia por ubicación."), true);
  tree = render({ ...props, badge: { ...badge, source: "geofence" } });
  assert.equal(nodes(tree).some(n => n.props.children === "Insignia asignada manualmente · No acredita asistencia por ubicación."), false);
  tree = render({ ...props, badge: { ...badge, mostDanced: true } });
  assert.match(nodes(tree).find(n => n.type === "artwork").props.celebrate ? nodes(tree).find(n => typeof n.props.className === "string" && n.props.className.includes("20rem")).props.className : "", /20rem/);
});

test("a logged-in visitor cannot edit another user's review and gets no login prompt", () => {
  const render = component("./BadgeDetail.tsx", "BadgeDetail", {
    "@/context/AuthContext": { useAuth: () => ({ user: { id: "other-user" }, isLoading: false }) },
    "@/lib/badgeAppearance": { attendanceDate: () => "1 oct. 2026" },
    "./EventBadgeArtwork": { EventBadgeArtwork: "artwork" },
    "./EventReviewForm": { EventReviewForm: "reviewForm" },
  });
  const tree = render({ badge, isOwner: false, lineupLoading: false, lineupError: false });
  assert.equal(nodes(tree).some(n => n.type === "reviewForm" || n.type === "link"), false);
});

test("failed save keeps a multiline draft dirty instead of confirming or clearing it", async () => {
  let formState, saved = false;
  const render = component("./EventReviewForm.tsx", "EventReviewForm", {
    "@/components/ui/Button": { Button: "button" }, "@/components/ui/StarRating": { StarRating: "stars" },
    "@/hooks/useBadges": { useEventReview: () => ({ save: async () => { throw new Error("offline"); }, load: async () => { throw new Error("offline"); }, isSaving: false, saveError: { response: { status: 500 } } }) },
  });
  const props = { badge, onStateChange: value => { formState = value; }, onSaved: () => { saved = true; } };
  let tree = render(props);
  assert.equal(formState.dirty, false);
  const draft = "Primera línea\nSegunda línea";
  nodes(tree).find(n => n.type === "stars").props.onChange(0);
  nodes(tree).find(n => n.type === "textarea").props.onChange({ target: { value: draft } });
  tree = render(props); nodes(tree).find(n => n.type === "form").props.onSubmit({ preventDefault() {} }); tree = render(props);
  await nodes(tree).find(n => n.type === "confirm").props.onConfirm(); tree = render(props);
  assert.equal(formState.dirty, true); assert.equal(saved, false);
  assert.equal(nodes(tree).find(n => n.type === "textarea").props.value, draft);
  assert.equal(nodes(tree).find(n => n.type === "textarea").props.maxLength, 1000);
  assert.equal(nodes(tree).find(n => n.type === "textarea").props.placeholder, "¿Qué pasó esa noche? El momento, el tema, la gente...");
  assert.equal(nodes(tree).some(n => n.props.role === "alert"), true);
  assert.equal(nodes(tree).some(n => n.props.role === "status"), false);
});
