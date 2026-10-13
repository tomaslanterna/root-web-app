import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function getCommunitiesModule(apiHandlers = {}) {
  const exported = {};
  const mockApi = {
    get: async (url, config) => {
      if (apiHandlers.get) return apiHandlers.get(url, config);
      return { data: [] };
    },
    post: async (url, body, config) => {
      if (apiHandlers.post) return apiHandlers.post(url, body, config);
      return { data: body || {} };
    },
    put: async (url, body, config) => {
      if (apiHandlers.put) return apiHandlers.put(url, body, config);
      return { data: body || {} };
    },
    patch: async (url, body, config) => {
      if (apiHandlers.patch) return apiHandlers.patch(url, body, config);
      return { data: body || {} };
    },
    delete: async (url, config) => {
      if (apiHandlers.delete) return apiHandlers.delete(url, config);
      return { data: { success: true } };
    },
  };

  const code = fs.readFileSync(new URL("./communities.ts", import.meta.url), "utf8");
  const transpiled = ts.transpileModule(code, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;

  vm.runInNewContext(transpiled, {
    exports: exported,
    module: { exports: exported },
    require: (mod) => {
      if (mod === "@/lib/api") return { api: mockApi };
      return {};
    },
    localStorage: undefined,
    window: undefined,
    console,
  });

  return exported;
}

function resolveCommunityRole(community, user) {
  if (!user) {
    return {
      role: "GUEST",
      isRRPP: false,
      isMember: false,
      isGuest: true,
    };
  }

  const userRole = user.role?.toUpperCase();
  const isRRPP = Boolean(
    community?.canPublish ||
      userRole === "RRPP" ||
      userRole === "ADMIN" ||
      (community?.prOwnerId && community.prOwnerId === user.id) ||
      (community?.contact?.id && community.contact.id === user.id)
  );

  if (isRRPP) {
    return {
      role: "RRPP",
      isRRPP: true,
      isMember: true,
      isGuest: false,
    };
  }

  const isMember = Boolean(community?.isMember);
  if (isMember) {
    return {
      role: "MEMBER",
      isRRPP: false,
      isMember: true,
      isGuest: false,
    };
  }

  return {
    role: "GUEST",
    isRRPP: false,
    isMember: false,
    isGuest: true,
  };
}

test("Access Control & Roles resolution", async (t) => {
  await t.test("Unauthenticated user is treated as GUEST", () => {
    const roleState = resolveCommunityRole({ isMember: false, canPublish: false }, null);
    assert.equal(roleState.role, "GUEST");
    assert.equal(roleState.isGuest, true);
    assert.equal(roleState.isMember, false);
    assert.equal(roleState.isRRPP, false);
  });

  await t.test("Authenticated user not belonging to community is treated as GUEST", () => {
    const user = { id: "user-1", role: "USER" };
    const community = { isMember: false, canPublish: false, prOwnerId: "other" };
    const roleState = resolveCommunityRole(community, user);
    assert.equal(roleState.role, "GUEST");
    assert.equal(roleState.isGuest, true);
    assert.equal(roleState.isMember, false);
    assert.equal(roleState.isRRPP, false);
  });

  await t.test("Community member user is treated as MEMBER", () => {
    const user = { id: "user-1", role: "USER" };
    const community = { isMember: true, canPublish: false };
    const roleState = resolveCommunityRole(community, user);
    assert.equal(roleState.role, "MEMBER");
    assert.equal(roleState.isGuest, false);
    assert.equal(roleState.isMember, true);
    assert.equal(roleState.isRRPP, false);
  });

  await t.test("RRPP / Admin user is treated as RRPP (uppercase 'RRPP')", () => {
    const user = { id: "rrpp-1", role: "RRPP" };
    const community = { isMember: true, canPublish: true, prOwnerId: "rrpp-1" };
    const roleState = resolveCommunityRole(community, user);
    assert.equal(roleState.role, "RRPP");
    assert.equal(roleState.isGuest, false);
    assert.equal(roleState.isMember, true);
    assert.equal(roleState.isRRPP, true);
  });

  await t.test("RRPP user is treated as RRPP with lowercase 'rrpp'", () => {
    const user = { id: "rrpp-2", role: "rrpp" };
    const community = { isMember: false, canPublish: false };
    const roleState = resolveCommunityRole(community, user);
    assert.equal(roleState.role, "RRPP");
    assert.equal(roleState.isRRPP, true);
    assert.equal(roleState.isMember, true);
  });

  await t.test("Admin user is treated as RRPP with lowercase 'admin'", () => {
    const user = { id: "admin-1", role: "admin" };
    const community = { isMember: false, canPublish: false };
    const roleState = resolveCommunityRole(community, user);
    assert.equal(roleState.role, "RRPP");
    assert.equal(roleState.isRRPP, true);
    assert.equal(roleState.isMember, true);
  });
});

test("Community Services: Chat, Promoted Events and Members API Calls", async (t) => {
  const recordedCalls = [];
  const mod = getCommunitiesModule({
    get: async (url, config) => {
      recordedCalls.push({ method: "GET", url, config });
      if (url.includes("/chat-settings")) return { data: { mode: "broadcast_only" } };
      if (url.includes("/messages")) return { data: [{ id: "m1", content: "Test msg", senderRole: "RRPP" }] };
      if (url.includes("/members")) return { data: [{ id: "u1", name: "Alex RRPP", role: "RRPP" }] };
      if (url.includes("/promoted-events")) return { data: [{ id: "e1", title: "Afterlife" }] };
      if (url === "/v1/events") return { data: [{ id: "e1", title: "Afterlife" }, { id: "e2", title: "Time Warp" }] };
      return { data: [] };
    },
    post: async (url, body) => {
      recordedCalls.push({ method: "POST", url, body });
      if (url.includes("/messages/") && url.includes("/reactions")) {
        return { data: { messageId: "m1", reactions: [{ emoji: body.emoji, count: 1, users: ["u1"] }] } };
      }
      if (url.includes("/messages")) {
        return { data: { id: "m2", content: body.content, senderRole: "MEMBER" } };
      }
      return { data: body };
    },
    put: async (url, body) => {
      recordedCalls.push({ method: "PUT", url, body });
      if (url.includes("/chat-settings")) return { data: { mode: body.mode } };
      if (url.includes("/promoted-events")) return { data: [{ id: "e1" }, { id: "e2" }] };
      return { data: body };
    },
    delete: async (url) => {
      recordedCalls.push({ method: "DELETE", url });
      return { data: { success: true } };
    },
  });

  await t.test("Can retrieve community messages via API", async () => {
    const messages = await mod.getCommunityMessages("c1");
    assert.ok(Array.isArray(messages));
    assert.equal(messages.length, 1);
    assert.equal(messages[0].content, "Test msg");
    assert.ok(recordedCalls.some((c) => c.method === "GET" && c.url.includes("/v1/communities/c1/messages")));
  });

  await t.test("Can send community message via API", async () => {
    const msg = await mod.sendCommunityMessage("c1", "Hola comunidad");
    assert.equal(msg.content, "Hola comunidad");
    assert.ok(recordedCalls.some((c) => c.method === "POST" && c.url.includes("/v1/communities/c1/messages") && c.body.content === "Hola comunidad"));
  });

  await t.test("Can toggle emoji reactions on messages via API", async () => {
    const res = await mod.toggleMessageReaction("c1", "m1", "🔥");
    assert.equal(res.messageId, "m1");
    assert.ok(recordedCalls.some((c) => c.method === "POST" && c.url.includes("/reactions") && c.body.emoji === "🔥"));
  });

  await t.test("Can retrieve chat settings and update mode via API", async () => {
    const settings = await mod.getCommunityChatSettings("c1");
    assert.equal(settings.mode, "broadcast_only");

    const updated = await mod.updateCommunityChatMode("c1", "open_chat");
    assert.equal(updated.mode, "open_chat");
    assert.ok(recordedCalls.some((c) => c.method === "PUT" && c.url.includes("/chat-settings") && c.body.mode === "open_chat"));
  });

  await t.test("Can get platform events catalog and promoted events via API", async () => {
    const catalog = await mod.getPlatformEventsCatalog();
    assert.ok(Array.isArray(catalog));
    assert.equal(catalog.length, 2);

    const promoted = await mod.getCommunityPromotedEvents("c1");
    assert.ok(Array.isArray(promoted));
    assert.equal(promoted.length, 1);
  });

  await t.test("Can get members and kick a member via API", async () => {
    const members = await mod.getCommunityMembers("c1");
    assert.ok(Array.isArray(members));
    assert.equal(members.length, 1);

    const kickRes = await mod.removeCommunityMember("c1", "u2");
    assert.equal(kickRes.success, true);
    assert.ok(recordedCalls.some((c) => c.method === "DELETE" && c.url.includes("/v1/communities/c1/members/u2")));
  });
});
