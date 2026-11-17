import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const page = fs.readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

test("the tickets section and the buy button only render when the event has a ticket_url", () => {
  assert.match(page, /const hasTicketUrl = Boolean\(event\.ticketUrl\?\.trim\(\)\)/);
  const section = page.indexOf('id="tickets-section"');
  const button = page.indexOf("Conseguir ticket");
  const guard = page.lastIndexOf("{hasTicketUrl && (", section);
  const wall = page.indexOf("{/* Muro */}");
  assert.ok(guard !== -1 && section - guard < 80, "the section must open right inside the guard");
  assert.ok(section < button && button < wall, "the button lives inside the section");
  assert.ok(page.lastIndexOf(")}", wall) > button, "the guard must close after the button and before the wall");
});

test("the buy button opens the event's own ticket_url and never a generic search", () => {
  assert.match(page, /event\?\.ticketUrl\?\.trim\(\)/);
  assert.doesNotMatch(page, /passline\.com\/sitio/);
  assert.doesNotMatch(page, /affiliateUrl/);
});
