import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const page = fs.readFileSync(new URL("./[id]/page.tsx", import.meta.url), "utf8");
const header = fs.readFileSync(
  new URL("../../components/communities/CommunityHeader.tsx", import.meta.url),
  "utf8",
);
const infoPanel = fs.readFileSync(
  new URL("../../components/communities/CommunityInfoPanel.tsx", import.meta.url),
  "utf8",
);
const membersList = fs.readFileSync(
  new URL("../../components/communities/MembersList.tsx", import.meta.url),
  "utf8",
);
const broadcastChannel = fs.readFileSync(
  new URL("../../components/communities/BroadcastChannel.tsx", import.meta.url),
  "utf8",
);
const profilePage = fs.readFileSync(
  new URL("../profile/[username]/page.tsx", import.meta.url),
  "utf8",
);

test("community detail keeps only channel and wall as independent tabs", () => {
  const tabsBlock = page.match(/const TABS:[\s\S]*?\];/)?.[0] ?? "";

  assert.match(tabsBlock, /label: "Canal"/);
  assert.match(tabsBlock, /label: "Muro"/);
  assert.doesNotMatch(tabsBlock, /label: "Eventos"/);
  assert.doesNotMatch(tabsBlock, /label: "Miembros"/);
});

test("community header exposes back and info without brand, save, or share actions", () => {
  assert.match(page, /<CommunityHeader/);
  assert.match(header, /aria-label="Volver"/);
  assert.match(header, /aria-haspopup="dialog"/);
  assert.doesNotMatch(header, /Bookmark|Share2|>root</);
  assert.doesNotMatch(page, /Hero Cover|community\.category|<h1/);
});

test("community information panel owns events, members, and existing actions", () => {
  assert.match(page, /<CommunityInfoPanel/);
  assert.match(infoPanel, /<PromotedEvents/);
  assert.match(infoPanel, /<MembersList/);
  assert.match(infoPanel, /Esta comunidad todavía no agregó una descripción/);
  assert.match(infoPanel, /onChangeMembership/);
  assert.match(infoPanel, /onToggleMuted/);
  assert.match(infoPanel, /onContact/);
  assert.match(infoPanel, /CommunityModeration/);
});

test("each community member links to the existing profile route", () => {
  assert.match(membersList, /from=communities&returnTo=/);
  assert.match(membersList, /encodeURIComponent\(currentCommunityUrl\)/);
  assert.match(membersList, /aria-label=\{`Ver perfil de \$\{member\.name\}`\}/);
});

test("profiles opened from a community expose a safe return action", () => {
  assert.match(profilePage, /fromCommunities/);
  assert.match(profilePage, /requestedReturnTo\?\.startsWith\("\/"\)/);
  assert.match(profilePage, /!requestedReturnTo\.startsWith\("\/\/"\)/);
  assert.match(profilePage, /router\.replace\(communityReturnTo\)/);
  assert.match(profilePage, /aria-label=\{fromCommunities \? "Volver a la comunidad" : "Volver"\}/);
});

test("community chat stays inside the responsive app column", () => {
  assert.match(broadcastChannel, /data-testid="community-chat"/);
  assert.match(broadcastChannel, /w-full min-w-0 max-w-full/);
  assert.match(broadcastChannel, /data-testid="community-chat-footer"/);
  assert.match(broadcastChannel, /left-1\/2/);
  assert.match(broadcastChannel, /max-w-md/);
  assert.match(broadcastChannel, /-translate-x-1\/2/);
  assert.match(broadcastChannel, /md:max-w-\[1360px\]/);
  assert.doesNotMatch(broadcastChannel, /fixed bottom-0 inset-x-0/);
});

test("broadcast-only chat renders one notice instead of a disabled composer", () => {
  assert.match(broadcastChannel, /data-testid="broadcast-only-notice"/);
  assert.equal(
    broadcastChannel.match(/Solo el administrador puede enviar mensajes en este canal\./g)?.length,
    1,
  );
  assert.match(broadcastChannel, /isInputDisabled \? \(/);
  assert.match(broadcastChannel, /\) : \(\s*<form onSubmit=\{handleSend\}/);
});
