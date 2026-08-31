'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Loader2, Mail, Lock, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { authApi } from '@/services/auth';
import { useMutation } from '@/hooks/useMutation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const router = useRouter();

  const handleLoginSuccess = (data: any) => {
    login(data.token, data.user);
    if (!data.user.dob || !data.user.documentId || !data.user.country) {
      router.push('/complete-profile');
    } else {
      router.push('/feed');
    }
  };

  const { mutate: loginMutate } = useMutation(
    async (credentials: any) => {
      const response = await authApi.login(credentials);
      return response;
    },
    {
      onSuccess: handleLoginSuccess,
      onError: (err: any) => {
        if (err.response?.status === 401) {
          setError('Credenciales inválidas.');
        } else {
          setError('Ocurrió un error inesperado. Intenta de nuevo.');
        }
        setIsLoading(false);
      }
    }
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Por favor completa todos los campos.');
      return;
    }

    setIsLoading(true);
    loginMutate({ email, password });
  };

  const { mutate: googleAuthMutate } = useMutation(
    async (idToken: string) => {
      const response = await authApi.googleLogin(idToken);
      return response;
    },
    {
      onSuccess: handleLoginSuccess,
      onError: (err) => {
        console.error('Error in Google Auth:', err);
        setError('Falló la autenticación con Google. Por favor intenta nuevamente.');
      }
    }
  );

  const handleGoogleSuccess = (credentialResponse: CredentialResponse) => {
    if (credentialResponse.credential) {
      googleAuthMutate(credentialResponse.credential);
    } else {
      setError('No se pudo obtener el token de Google.');
    }
  };

  const handleGoogleError = () => {
    setError('Falló la conexión con Google. Por favor intenta nuevamente.');
  };

  return (
    <div className="flex flex-col min-h-[100dvh] bg-obsidian text-white relative overflow-hidden">
      {/* Background cinematic elements */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-[#D4FF00]/10 to-transparent pointer-events-none opacity-50 blur-3xl" />
      <div className="absolute bottom-0 right-0 w-3/4 h-3/4 bg-gradient-to-tl from-[#D4FF00]/5 to-transparent pointer-events-none opacity-30 blur-2xl rounded-full" />
      
      <div className="flex-1 flex flex-col justify-center px-6 z-10 animate-fade-in relative">
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
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#14171F]/80 backdrop-blur-md border border-white/10 rounded-2xl py-3.5 pl-11 pr-4 text-white placeholder:text-neutral-500 focus:outline-none focus:border-acid-lime/50 focus:ring-1 focus:ring-acid-lime/50 transition-all font-medium text-sm"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-500 group-focus-within:text-acid-lime transition-colors">
                <Lock size={18} />
              </div>
              <input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#14171F]/80 backdrop-blur-md border border-white/10 rounded-2xl py-3.5 pl-11 pr-4 text-white placeholder:text-neutral-500 focus:outline-none focus:border-acid-lime/50 focus:ring-1 focus:ring-acid-lime/50 transition-all font-medium text-sm"
              />
            </div>
          </div>

          {error && (
            <div className="text-red-400 text-xs font-semibold px-2 text-center animate-fade-in">
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
                  <span className="relative z-10 text-neutral-950 font-black">ENTRAR</span>
                  <ChevronRight size={18} className="relative z-10 text-neutral-950/80 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </div>
        </form>

        <div className="my-6 flex items-center gap-4 before:flex-1 before:border-t before:border-white/10 after:flex-1 after:border-t after:border-white/10">
          <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">o</span>
        </div>

        <div className="flex justify-center [&>div]:w-full [&>div>div]:!w-full [&>div>div]:!flex [&>div>div]:!justify-center [&>div>div>iframe]:!max-w-full">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            useOneTap={false}
            shape="rectangular"
            theme="filled_black"
            size="large"
            text="signin_with"
            width="340"
          />
        </div>

        <div className="mt-8 text-center">
          <p className="text-neutral-500 text-xs font-medium">
            ¿No tienes cuenta?{' '}
            <Link href="/register" className="text-acid-lime font-bold hover:underline underline-offset-4">
              Regístrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
