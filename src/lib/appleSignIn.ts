import { Capacitor } from "@capacitor/core";
import { AppleSignIn, ErrorCode, SignInScope } from "@capawesome/capacitor-apple-sign-in";
import type { AppleLoginInput } from "@/types/auth";

/**
 * Sign in with Apple:
 * - iOS (app): hoja nativa de Apple, no necesita configuración.
 * - Web y Android: flujo web de Apple (ventana emergente) con el Services ID. Solo aparece si está configurado
 *   NEXT_PUBLIC_APPLE_SERVICES_ID.
 *
 * En la ventana emergente, Apple devuelve la respuesta a la Return URL, que tiene que estar en el mismo dominio
 * que la página: por eso se usa <dominio actual>/auth/apple/callback (estoesroot.com, www.estoesroot.com o
 * root-web-app.vercel.app, todas registradas en el Services ID). NEXT_PUBLIC_APPLE_REDIRECT_URL la fuerza si hace falta.
 */
const SERVICES_ID = process.env.NEXT_PUBLIC_APPLE_SERVICES_ID?.trim() ?? "";
const FORCED_REDIRECT_URL = process.env.NEXT_PUBLIC_APPLE_REDIRECT_URL?.trim() ?? "";

function redirectUrl(): string {
  return FORCED_REDIRECT_URL || `${window.location.origin}/auth/apple/callback`;
}

export function isNativeIOS(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";
}

/** Si el botón "Continuar con Apple" se puede mostrar en esta plataforma. */
export function isAppleSignInAvailable(): boolean {
  if (isNativeIOS()) return true;
  return SERVICES_ID !== "";
}

/** La persona cerró la hoja de Apple: no es un error que haya que mostrar. */
export class AppleSignInCanceledError extends Error {
  constructor() {
    super("Apple sign-in canceled");
    this.name = "AppleSignInCanceledError";
  }
}

function randomValue(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** SHA-256 en hexadecimal: a Apple se le manda el hash y al backend el nonce original. */
export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

function isCanceled(error: unknown): boolean {
  const code = (error as { code?: string } | null)?.code;
  const message = String((error as { message?: string } | null)?.message ?? "").toLowerCase();
  return code === ErrorCode.SignInCanceled || message.includes("cancel");
}

/** Abre Sign in with Apple y devuelve lo que hay que mandarle al backend (/v1/auth/apple). */
export async function signInWithApple(): Promise<AppleLoginInput> {
  const nonce = randomValue();
  const nonceHash = await sha256Hex(nonce);
  const scopes = [SignInScope.Email, SignInScope.FullName];
  try {
    if (isNativeIOS()) {
      const result = await AppleSignIn.signIn({ scopes, nonce: nonceHash });
      return {
        identityToken: result.idToken,
        authorizationCode: result.authorizationCode,
        nonce,
        givenName: result.givenName ?? "",
        familyName: result.familyName ?? "",
      };
    }
    if (!SERVICES_ID) throw new Error("Sign in with Apple is not configured for this platform");
    await AppleSignIn.initialize({ clientId: SERVICES_ID });
    const state = randomValue();
    const result = await AppleSignIn.signIn({ scopes, nonce: nonceHash, state, redirectUrl: redirectUrl() });
    // El plugin no valida el state: se compara acá (protección CSRF).
    if (result.state !== state) throw new Error("Apple sign-in state mismatch");
    return {
      identityToken: result.idToken,
      authorizationCode: result.authorizationCode,
      nonce,
      givenName: result.givenName ?? "",
      familyName: result.familyName ?? "",
    };
  } catch (error) {
    if (isCanceled(error)) throw new AppleSignInCanceledError();
    throw error;
  }
}
