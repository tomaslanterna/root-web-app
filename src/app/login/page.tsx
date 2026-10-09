"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Loader2, Mail, ChevronRight } from "lucide-react";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { useLogin } from "@/hooks/useLogin";
import Image from "next/image";
import { Capacitor } from "@capacitor/core";
import { GoogleSignIn } from "@capawesome/capacitor-google-sign-in";

interface GoogleAuthWrapperProps {
  onSuccess: (idToken: string) => void;
  onError: () => void;
  handleGoogleSuccess: (response: CredentialResponse) => void;
}
const subscribeNativePlatform = () => () => {};

function GoogleAuthWrapper({ onSuccess, onError, handleGoogleSuccess }: GoogleAuthWrapperProps) {
  const isNative = React.useSyncExternalStore(subscribeNativePlatform, () => Capacitor.isNativePlatform(), () => false);

  const handleNativeLogin = async () => {
    try {
      // Es obligatorio inicializar el plugin en JS antes de usarlo para evitar el EXC_BAD_ACCESS
      await GoogleSignIn.initialize({
        clientId:
          "964994558509-vbrduu76ftkdq80ms9f464ol3cujbgp3.apps.googleusercontent.com",
      });

      const result = await GoogleSignIn.signIn();

      if (result.idToken) {
        onSuccess(result.idToken);
      } else {
        onError();
      }
    } catch {
      onError();
    }
  };

  if (isNative) {
    return (
      <Button
        type="button"
        variant="outline"
        size="full"
        onClick={handleNativeLogin}
        className="w-full max-w-[340px] flex items-center justify-center gap-3 bg-white hover:bg-neutral-100 text-black border-transparent py-6 rounded-md font-medium"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Continuar con Google
      </Button>
    );
  }

  return (
    <GoogleLogin
      onSuccess={handleGoogleSuccess}
      onError={onError}
      useOneTap={false}
      shape="rectangular"
      theme="filled_black"
      size="large"
      text="signin_with"
      width="340"
    />
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { password: passwordLogin, google: googleLogin, error, setError, isLoading } = useLogin();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Por favor completa todos los campos.");
      return;
    }

    await passwordLogin.mutate({ email: email.trim(), password }).catch(() => undefined);
  };
  const googleAuthMutate = (idToken: string) => {
    setError("");
    void googleLogin.mutate(idToken).catch(() => undefined);
  };

  const handleGoogleSuccess = (credentialResponse: CredentialResponse) => {
    if (credentialResponse.credential) {
      googleAuthMutate(credentialResponse.credential);
    } else {
      setError("No se pudo obtener el token de Google.");
    }
  };

  const handleGoogleError = () => {
    setError("Falló la conexión con Google. Por favor intenta nuevamente.");
  };

  return (
    <div className="flex flex-col md:flex-row min-h-[100dvh] bg-obsidian text-white relative overflow-hidden">
      {/* Left Column (Image) - Desktop Only */}
      <div className="hidden md:block md:w-1/2 relative bg-black">
        <Image
          fill
          unoptimized
          src="https://images.unsplash.com/photo-1574169208507-84376144848b?q=80&w=2079&auto=format&fit=crop"
          alt="Root Web App"
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#0B0D10]" />

        <div className="absolute bottom-12 left-12 right-12 z-20">
          <h2 className="text-4xl font-black uppercase tracking-tight text-white mb-2">
            La escena <span className="text-[#D4FF00]">electrónica</span> en tus
            manos.
          </h2>
          <p className="text-neutral-300 font-medium max-w-md">
            Conectá con tu crew, descubrí los mejores eventos y encontrá tu
            próxima fiesta.
          </p>
        </div>
      </div>

      {/* Right Column (Form) */}
      <div className="flex-1 md:w-1/2 flex flex-col justify-center px-6 md:px-12 z-10 animate-fade-in relative max-w-md mx-auto w-full">
        {/* Background cinematic elements (mobile only) */}
        <div className="md:hidden absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-[#D4FF00]/10 to-transparent pointer-events-none opacity-50 blur-3xl" />
        <div className="md:hidden absolute bottom-0 right-0 w-3/4 h-3/4 bg-gradient-to-tl from-[#D4FF00]/5 to-transparent pointer-events-none opacity-30 blur-2xl rounded-full" />

        <div className="mb-10 text-center">
          <h1 className="text-4xl font-black tracking-tighter mb-2 text-white drop-shadow-md">
            root<span className="text-acid-lime">.</span>
          </h1>
          <p className="text-neutral-400 text-sm font-medium tracking-wide">
            Enter the Electronic Music Network
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-500 group-focus-within:text-acid-lime transition-colors">
                <Mail size={18} />
              </div>
              <input
                id="login-email"
                name="email"
                aria-label="Email"
                autoComplete="username"
                required
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#14171F]/80 backdrop-blur-md border border-white/10 rounded-2xl py-3.5 pl-11 pr-4 text-white placeholder:text-neutral-500 focus:outline-none focus:border-acid-lime/50 focus:ring-1 focus:ring-acid-lime/50 transition-all font-medium text-sm"
              />
            </div>
          </div>

          <div className="space-y-1">
            <PasswordInput
              id="login-password"
              name="password"
              aria-label="Contraseña"
              autoComplete="current-password"
              required
              placeholder="Contraseña"
              value={password}
              onChange={event => setPassword(event.target.value)}
            />
          </div>
          <div className="text-right">
            <Link href="/forgot-password" className="inline-block py-2 text-xs font-semibold text-acid-lime hover:underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-acid-lime rounded">
              He olvidado mi contraseña
            </Link>
          </div>

          {error && (
            <div role="alert" className="text-red-400 text-xs font-semibold px-2 text-center animate-fade-in">
              {error}
            </div>
          )}

          <div className="pt-4">
            <Button
              type="submit"
              variant="primary"
              size="full"
              disabled={isLoading}
              className="group py-4 rounded-2xl flex items-center justify-center gap-2 relative overflow-hidden"
            >
              {isLoading ? (
                <Loader2 size={20} className="animate-spin text-neutral-950" />
              ) : (
                <>
                  <span className="relative z-10 text-neutral-950 font-black">
                    ENTRAR
                  </span>
                  <ChevronRight
                    size={18}
                    className="relative z-10 text-neutral-950/80 group-hover:translate-x-1 transition-transform"
                  />
                </>
              )}
            </Button>
          </div>
        </form>

        <div className="my-6 flex items-center gap-4 before:flex-1 before:border-t before:border-white/10 after:flex-1 after:border-t after:border-white/10">
          <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">
            o
          </span>
        </div>

        <div className="flex justify-center [&>div]:w-full [&>div>div]:!w-full [&>div>div]:!flex [&>div>div]:!justify-center [&>div>div>iframe]:!max-w-full">
          <GoogleAuthWrapper
            onSuccess={googleAuthMutate}
            onError={handleGoogleError}
            handleGoogleSuccess={handleGoogleSuccess}
          />
        </div>

        <div className="mt-8 text-center">
          <p className="text-neutral-500 text-xs font-medium">
            ¿No tienes cuenta?{" "}
            <Link
              href="/register"
              className="text-acid-lime font-bold hover:underline underline-offset-4"
            >
              Regístrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
