import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const register = read("./register/page.tsx");
const completeProfile = read("./complete-profile/page.tsx");
const settings = read("./settings/page.tsx");
const blockedPage = read("./settings/blocked/page.tsx");
const profile = read("./profile/[username]/page.tsx");
const post = read("./posts/[id]/page.tsx");
const login = read("./login/page.tsx");
const terms = read("../components/ui/TermsCheckbox.tsx");
const reportSheet = read("../components/ui/ReportSheet.tsx");
const comments = read("../components/ui/CommentSection.tsx");
const chat = read("../components/match/ChatConversation.tsx");
const useChat = read("../hooks/useChat.ts");
const useLogin = read("../hooks/useLogin.ts");
const termsLib = read("../lib/terms.ts");

test("el checkbox de términos enlaza a /terms y /privacy", () => {
  assert.match(terms, /href="\/terms"/);
  assert.match(terms, /href="\/privacy"/);
  assert.match(terms, /type="checkbox"/);
});

test("registrarse exige aceptar los términos, con un estado aparte de formData", () => {
  assert.match(register, /<TermsCheckbox checked=\{acceptedTerms\}/);
  assert.match(register, /const \[acceptedTerms, setAcceptedTerms\] = useState\(false\)/);
  const formData = register.slice(register.indexOf("useState({"), register.indexOf("});"));
  assert.doesNotMatch(formData, /acceptedTerms/, "acceptedTerms no puede ir en formData (rompe la validación de campos vacíos)");
  assert.match(register, /disabled=\{[^}]*!acceptedTerms\}/, "el botón queda deshabilitado sin tildar");
  assert.match(register, /acceptedTerms: true,\s*termsVersion: TERMS_VERSION/);
  // El checkbox va entre "Confirmar contraseña" y el error.
  const confirm = register.indexOf('name="confirmPassword"');
  const checkbox = register.indexOf("<TermsCheckbox");
  const error = register.indexOf("{error && (", confirm);
  assert.ok(confirm < checkbox && checkbox < error);
});

test("completar el perfil pide los términos a quien todavía no los aceptó", () => {
  assert.match(completeProfile, /termsPending && <TermsCheckbox/);
  assert.match(completeProfile, /acceptedTerms: true, termsVersion: TERMS_VERSION/);
  assert.match(termsLib, /!user\.termsAcceptedAt/);
  assert.match(useLogin, /needsProfileCompletion\(data\.user\) \? "\/complete-profile"/);
});

test("Ajustes tiene Usuarios bloqueados y Eliminar cuenta (debajo de Cerrar sesión, con ELIMINAR)", () => {
  assert.match(settings, /href="\/settings\/blocked"/);
  assert.ok(settings.indexOf("Cerrar sesión") < settings.indexOf(">Eliminar cuenta<"), "Eliminar cuenta va debajo de Cerrar sesión");
  assert.match(settings, /DELETE_CONFIRMATION_WORD = 'ELIMINAR'/);
  assert.match(settings, /confirmDisabled=\{!canDelete\}/);
  assert.match(settings, /variant="danger"/);
  assert.match(settings, /30 días/);
  assert.match(blockedPage, /Desbloquear/);
  assert.match(login, /Tu cuenta fue eliminada/);
});

test("el ⋯ del perfil solo aparece en perfiles ajenos y bloquear reemplaza el contenido", () => {
  const menu = profile.indexOf('aria-label="Más opciones"');
  assert.ok(menu > 0);
  const opening = profile.lastIndexOf("{!isMyProfile && (", menu);
  assert.ok(opening > 0 && menu - opening < 300, "el botón ⋯ está dentro de {!isMyProfile && (...)}");
  assert.match(profile, /Denunciar cuenta/);
  assert.match(profile, /Bloqueaste a esta cuenta/);
  assert.match(profile, /!isMyProfile && !isBlocked && \(/, "Seguir y Mensaje se ocultan si está bloqueado");
});

test("el chat directo tiene ⋯, denuncia por mantener presionado y el aviso de bloqueo", () => {
  assert.match(chat, /chatInfo\.type === "DIRECT"/);
  assert.match(chat, /LONG_PRESS_MS = 500/);
  assert.match(chat, /onContextMenu/);
  assert.match(chat, /No podés enviar mensajes a esta cuenta\./);
  assert.match(useChat, /status === 403 && [^\n]*=== "blocked"/);
});

test("posts y comentarios ajenos se pueden denunciar", () => {
  assert.match(post, /rightActions=\{!isMyPost && \(/);
  assert.match(post, /Denunciar publicación/);
  assert.match(comments, /comment\.authorId !== user\?\.id/);
  assert.match(comments, /Denunciar comentario/);
  assert.match(reportSheet, /Gracias\. Vamos a revisarlo en menos de 24 h\./);
});
