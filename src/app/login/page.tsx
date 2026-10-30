"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Loader2 } from "lucide-react";
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
        className="h-[52px] gap-2.5 bg-ink hover:bg-white text-bg border-transparent text-base"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
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
      theme="outline"
      size="large"
      text="continue_with"
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
    <div className="flex flex-col md:flex-row min-h-[100dvh] bg-bg text-ink relative overflow-hidden">
      {/* Columna de imagen: solo desktop */}
      <div className="hidden md:block md:w-1/2 relative bg-black">
        <Image
          fill
          unoptimized
          src="https://images.unsplash.com/photo-1574169208507-84376144848b?q=80&w=2079&auto=format&fit=crop"
          alt=""
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-bg" />
        <div className="absolute bottom-12 left-12 right-12 z-20">
          <h2 className="font-display text-5xl text-ink mb-3">
            La escena <span className="text-accent">electrónica</span> en tus manos
          </h2>
          <p className="text-ink-2 text-base max-w-md">
            Conectá con tu crew, descubrí los mejores eventos y encontrá tu próxima fiesta.
          </p>
        </div>
      </div>

      {/* Formulario */}
      <div className="flex-1 md:w-1/2 flex flex-col justify-center px-6 md:px-12 pt-[calc(5.5rem+var(--root-safe-top))] md:pt-0 pb-[var(--root-mobile-nav-clearance)] md:pb-0 animate-fade-in max-w-md mx-auto w-full">
        <div className="flex flex-col gap-3.5">
          <span aria-hidden="true" className="font-display size-14 rounded-card bg-accent text-on-accent flex items-center justify-center text-3xl">
            r
          </span>
          <h1 className="font-display text-[44px] m-0">root</h1>
          <p className="text-base leading-normal text-ink-2">
            La red de la música electrónica. Encontrá la fiesta, armá tu crew, salí.
          </p>
        </div>

        <div className="mt-8 flex flex-col [&>div]:w-full [&>div>div]:!w-full [&>div>div]:!flex [&>div>div]:!justify-center [&>div>div>iframe]:!max-w-full">
          <GoogleAuthWrapper
            onSuccess={googleAuthMutate}
            onError={handleGoogleError}
            handleGoogleSuccess={handleGoogleSuccess}
          />
        </div>

        <div className="my-6 flex items-center gap-3">
          <span className="flex-1 h-px bg-white/10" />
          <span className="label-mono text-ink-3">o con tu email</span>
          <span className="flex-1 h-px bg-white/10" />
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="login-email" className="text-sm font-semibold">
              Email
            </label>
            <input
              id="login-email"
              name="email"
              autoComplete="username"
              required
              type="email"
              placeholder="vos@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-[52px] px-3.5 rounded-control bg-surface border border-line-strong text-base text-ink placeholder:text-ink-3 focus:outline-none focus:border-accent focus:border-[1.5px] transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-baseline">
              <label htmlFor="login-password" className="text-sm font-semibold">
                Contraseña
              </label>
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-accent hover:text-accent-hover focus-visible:outline-2 focus-visible:outline-accent rounded"
              >
                ¿La olvidaste?
              </Link>
            </div>
            <PasswordInput
              id="login-password"
              name="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={event => setPassword(event.target.value)}
            />
          </div>

          {error && (
            <p role="alert" className="text-danger text-sm animate-fade-in">
              {error}
            </p>
          )}

          <Button
            type="submit"
            variant="primary"
            size="full"
            disabled={isLoading}
            className="mt-2 h-[52px] text-base"
          >
            {isLoading ? (
              <Loader2 size={20} className="animate-spin" aria-label="Ingresando" />
            ) : (
              "Iniciar sesión"
            )}
          </Button>
        </form>

        <p className="mt-5 text-center text-[15px] text-ink-2">
          ¿No tenés cuenta?{" "}
          <Link
            href="/register"
            className="font-semibold text-accent hover:text-accent-hover"
          >
            Creá una
          </Link>
        </p>
      </div>
    </div>
  );
}
