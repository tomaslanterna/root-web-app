import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const card = read("./AfterCard.tsx");
const cover = read("./AfterCover.tsx");
const bits = read("./AfterBits.tsx");
const section = read("./EventAftersSection.tsx");
const feed = read("./AftersFeed.tsx");
const types = read("../../types/afters.ts");
const menu = read("../ui/QuickActionMenu.tsx");
const gate = read("../../context/KycGateContext.tsx");
const sheet = read("../kyc/KycRequiredSheet.tsx");
const gateScreen = read("../kyc/KycGateScreen.tsx");
const newAfter = read("./NewAfterScreen.tsx");
const submitPage = read("../../app/events/submit/page.tsx");
const eventsPage = read("../../app/events/page.tsx");
const eventDetail = read("../../app/events/[id]/page.tsx");
const afterPage = read("../../app/afters/[id]/page.tsx");
const settings = read("../../app/settings/page.tsx");

test("AfterCard y AfterRow nunca muestran la dirección (los listados ni la reciben)", () => {
  for (const source of [card, cover, bits]) assert.doesNotMatch(source, /address/i);
  const summary = types.slice(types.indexOf("export interface AfterSummary"), types.indexOf("export interface AfterFollowedGoing"));
  assert.doesNotMatch(summary, /address/i, "AfterSummary no tiene campo de dirección");
  assert.match(card, /export function AfterCard/);
  assert.match(card, /export function AfterRow/);
});

test("el detalle solo muestra la dirección si el backend la mandó", () => {
  assert.match(afterPage, /after\.addressVisible && after\.address \?/);
  assert.match(afterPage, /La dirección exacta la ves cuando te aceptan/);
});

test("los botones de subir un after y mandar un evento pasan por requireKyc (no navegan directo)", () => {
  assert.match(section, /requireKyc\(\(\) => router\.push\(`\/afters\/new\?eventId=/);
  assert.doesNotMatch(section, /href=\{?[`"]\/afters\/new/);
  assert.match(feed, /requireKyc\(\(\) => router\.push\("\/events\/submit"\)\)/);
  assert.match(feed, /requireKyc\(\(\) => router\.push\("\/afters\/new"\)\)/);
  assert.match(eventsPage, /requireKyc\(\(\) => router\.push\("\/afters\/new"\)\)/);
  // En el menú +, los dos nuevos piden KYC; los de antes siguen.
  assert.match(menu, /href: "\/afters\/new", needsKyc: true, isNew: true/);
  assert.match(menu, /href: "\/events\/submit", needsKyc: true, isNew: true/);
  assert.match(menu, /href: "\/create\/post"/);
  assert.match(menu, /href: "\/communities"/);
  assert.match(menu, /if \(action\.needsKyc\) requireKyc\(\(\) => router\.push\(action\.href\)\)/);
  assert.doesNotMatch(menu, /<Link/);
});

test("sin verificación se abre la hoja; con kyc_required del backend también", () => {
  assert.match(gate, /else if \(decision === "verify"\) setIsOpen\(true\)/);
  assert.match(gate, /if \(!isKycRequiredError\(error\)\) return false;\s*setIsOpen\(true\)/);
  assert.match(sheet, /Verificá tu identidad/);
  assert.match(sheet, /Para subir afters o mandarnos eventos necesitás tener tu identidad verificada\./);
  assert.match(sheet, /Verificar ahora/);
  assert.match(sheet, /Ahora no/);
  assert.match(sheet, /kycHref\(/);
});

test("entrar por URL sin verificar muestra la hoja en lugar del formulario", () => {
  assert.match(gateScreen, /if \(user\.isKycVerified\) return <>\{children\}<\/>/);
  assert.match(gateScreen, /<KycRequiredSheet isOpen/);
  assert.match(newAfter, /<KycGateScreen[^>]*>\s*<AfterForm/);
  assert.match(submitPage, /<KycGateScreen[^>]*>\s*<EventSubmissionForm/);
});

test("eventos: filtro Afters, franja de esta noche y CTA, sin mezclar afters en la grilla", () => {
  assert.match(eventsPage, /aria-pressed=\{showAfters\}/);
  assert.match(eventsPage, /showTonightStrip && \(\s*<TonightAftersStrip/);
  assert.match(eventsPage, /\{showAfters \? \(\s*<AftersFilterResults/);
  assert.match(eventsPage, /<SubmitEventCta \/>/);
  const grid = eventsPage.slice(eventsPage.indexOf('key="grid"'), eventsPage.indexOf('key="grid"') + 600);
  assert.doesNotMatch(grid, /After/);
});

test("el detalle del evento usa event.afters (sin otro request) y suma el chip", () => {
  assert.match(eventDetail, /<EventAftersSection event=\{event\} afters=\{event\.afters\}/);
  assert.match(eventDetail, /href=\{`#\$\{AFTERS_ANCHOR\}`\}/);
  assert.doesNotMatch(eventDetail, /aftersApi/);
});

test("configuración tiene la fila de Mandanos tu evento", () => {
  assert.match(settings, /href="\/events\/submissions"/);
  assert.match(settings, /Mandanos tu evento/);
});
