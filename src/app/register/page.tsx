'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { 
  Loader2, 
  Mail, 
  Lock, 
  ChevronRight, 
  User, 
  AtSign, 
  CalendarDays, 
  CreditCard,
  CheckCircle2,
  XCircle,
  MapPin,
  ChevronLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { api } from '@/lib/api';
import { useMutation } from '@/hooks/useMutation';
import { useAuth } from '@/context/AuthContext';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    alias: '',
    dob: '',
    documentId: '',
    country: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Alias validation state
  const [aliasStatus, setAliasStatus] = useState<'idle' | 'loading' | 'valid' | 'invalid'>('idle');

  const router = useRouter();
  const { login } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    if (name === 'alias') {
      setAliasStatus('idle'); // Reset validation when user types
    }
  };

  const handleValidateAlias = async () => {
    if (!formData.alias) return;
    
    setAliasStatus('loading');
    
    try {
      const res = await api.get(`/v1/users/check-username?username=${formData.alias}`);
      if (res.data.available) {
        setAliasStatus('valid');
      } else {
        setAliasStatus('invalid');
      }
    } catch (err) {
      setAliasStatus('idle');
    }
  };

  const { mutate: googleAuthMutate } = useMutation(
    async (idToken: string) => {
      const response = await api.post('/v1/auth/google', { idToken });
      return response.data;
    },
    {
      onSuccess: (data) => {
        login(data.token, data.user);
        router.push('/feed');
      },
      onError: (err) => {
        console.error('Error in Google Auth:', err);
        setError('Falló el registro con Google. Por favor intenta nuevamente.');
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

  const { mutate: registerMutate } = useMutation(
    async (registerData: any) => {
      const response = await api.post('/v1/auth/register', registerData);
      return response.data;
    },
    {
      onSuccess: () => {
        // Automatically redirect to login after successful registration
        router.push('/login');
      },
      onError: (err: any) => {
        if (err.response?.status === 409) {
          setError('El correo electrónico o alias ya está en uso.');
        } else if (err.response?.status === 400) {
          setError('Los datos ingresados no son válidos.');
        } else {
          setError('Ocurrió un error inesperado al registrarse.');
        }
        setIsLoading(false);
      }
    }
  );

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (Object.values(formData).some((val) => val === '')) {
      setError('Por favor, completa todos los campos.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    if (!/^\d{7,}$/.test(formData.documentId)) {
      setError('El documento debe contener solo números y tener más de 6 cifras.');
      return;
    }

    const today = new Date();
    const dobDate = new Date(formData.dob);
    let age = today.getFullYear() - dobDate.getFullYear();
    const m = today.getMonth() - dobDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) {
      age--;
    }

    if (dobDate > today) {
      setError('La fecha de nacimiento no puede ser en el futuro.');
      return;
    }
    
    if (age < 18) {
      setError('Debes ser mayor de 18 años para registrarte.');
      return;
    }

    if (aliasStatus !== 'valid') {
      setError('Por favor, valida tu alias antes de continuar.');
      return;
    }

    setIsLoading(true);
    
    // API expects name, username, email, password, dob, documentId
    registerMutate({
      name: formData.name,
      username: formData.alias,
      email: formData.email,
      password: formData.password,
      dob: formData.dob,
      documentId: formData.documentId,
      country: formData.country
    });
  };

  // Determine border color for alias input
  const getAliasBorderColor = () => {
    if (aliasStatus === 'valid') return 'border-green-500 focus:border-green-500 focus:ring-green-500/50';
    if (aliasStatus === 'invalid') return 'border-red-500 focus:border-red-500 focus:ring-red-500/50';
    return 'border-white/10 focus:border-acid-lime/50 focus:ring-acid-lime/50';
  };

  return (
    <div className="flex flex-col min-h-[100dvh] bg-obsidian text-white relative overflow-hidden">
      {/* Background cinematic elements fixed during scroll */}
      <div className="fixed top-0 left-0 w-full h-1/2 bg-gradient-to-b from-[#D4FF00]/10 to-transparent pointer-events-none opacity-50 blur-3xl z-0" />
      <div className="fixed bottom-0 right-0 w-3/4 h-3/4 bg-gradient-to-tl from-[#D4FF00]/5 to-transparent pointer-events-none opacity-30 blur-2xl rounded-full z-0" />
      
      <div className="flex-1 flex flex-col px-6 py-12 z-10 animate-fade-in relative">
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 p-2 rounded-full hover:bg-white/10 transition-colors active:scale-95 z-20"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>

        <div className="mb-8 text-center mt-4">
          <h1 className="text-3xl font-black tracking-tighter mb-2 text-white drop-shadow-md">
            Crear cuenta<span className="text-acid-lime">.</span>
          </h1>
          <p className="text-neutral-400 text-sm font-medium tracking-wide">
            Únete a la red
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          {/* Email */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-500 group-focus-within:text-acid-lime transition-colors">
              <Mail size={18} />
            </div>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              className="w-full bg-[#14171F]/80 backdrop-blur-md border border-white/10 rounded-2xl py-3.5 pl-11 pr-4 text-white placeholder:text-neutral-500 focus:outline-none focus:border-acid-lime/50 focus:ring-1 focus:ring-acid-lime/50 transition-all font-medium text-sm"
            />
          </div>

          {/* Nombre */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-500 group-focus-within:text-acid-lime transition-colors">
              <User size={18} />
            </div>
            <input
              type="text"
              name="name"
              placeholder="Nombre completo"
              value={formData.name}
              onChange={handleChange}
              className="w-full bg-[#14171F]/80 backdrop-blur-md border border-white/10 rounded-2xl py-3.5 pl-11 pr-4 text-white placeholder:text-neutral-500 focus:outline-none focus:border-acid-lime/50 focus:ring-1 focus:ring-acid-lime/50 transition-all font-medium text-sm"
            />
          </div>

          {/* Alias */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-500 group-focus-within:text-acid-lime transition-colors">
              <AtSign size={18} />
            </div>
            <input
              type="text"
              name="alias"
              placeholder="Alias (Username)"
              value={formData.alias}
              onChange={handleChange}
              className={cn(
                "w-full bg-[#14171F]/80 backdrop-blur-md border rounded-2xl py-3.5 pl-11 pr-[100px] text-white placeholder:text-neutral-500 focus:outline-none focus:ring-1 transition-all font-medium text-sm",
                getAliasBorderColor()
              )}
            />
            
            {/* Alias Validation Icon */}
            <div className="absolute inset-y-0 right-[85px] flex items-center pointer-events-none">
              {aliasStatus === 'valid' && <CheckCircle2 size={16} className="text-green-500 animate-fade-in" />}
              {aliasStatus === 'invalid' && <XCircle size={16} className="text-red-500 animate-fade-in" />}
            </div>

            {/* Validate Button */}
            <div className="absolute inset-y-0 right-0 pr-1.5 flex items-center">
              <button
                type="button"
                onClick={handleValidateAlias}
                disabled={!formData.alias || aliasStatus === 'loading'}
                className="bg-white/5 hover:bg-white/10 disabled:opacity-50 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-2 rounded-xl transition-colors border border-white/10 flex items-center gap-1.5"
              >
                {aliasStatus === 'loading' ? (
                  <Loader2 size={14} className="animate-spin text-acid-lime" />
                ) : (
                  'Validar'
                )}
              </button>
            </div>
          </div>
          
          {aliasStatus === 'invalid' && (
            <p className="text-red-400 text-xs px-2 animate-fade-in">Este alias ya está en uso.</p>
          )}

          {/* Date of Birth & ID Document (Row) */}
          <div className="flex gap-3">
            <div className="relative group flex-1">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-500 group-focus-within:text-acid-lime transition-colors">
                <CalendarDays size={18} />
              </div>
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                className="w-full bg-[#14171F]/80 backdrop-blur-md border border-white/10 rounded-2xl py-3.5 pl-11 pr-4 text-white placeholder:text-neutral-500 focus:outline-none focus:border-acid-lime/50 focus:ring-1 focus:ring-acid-lime/50 transition-all font-medium text-sm [color-scheme:dark]"
              />
            </div>
            
            <div className="relative group flex-1">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-500 group-focus-within:text-acid-lime transition-colors">
                <CreditCard size={18} />
              </div>
              <input
                type="text"
                name="documentId"
                placeholder="DNI / Pasaporte"
                value={formData.documentId}
                onChange={handleChange}
                className="w-full bg-[#14171F]/80 backdrop-blur-md border border-white/10 rounded-2xl py-3.5 pl-11 pr-4 text-white placeholder:text-neutral-500 focus:outline-none focus:border-acid-lime/50 focus:ring-1 focus:ring-acid-lime/50 transition-all font-medium text-sm"
              />
            </div>
          </div>
          
          {/* Country */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-500 group-focus-within:text-acid-lime transition-colors">
              <MapPin size={18} />
            </div>
            <select
              name="country"
              value={formData.country}
              onChange={handleChange as any}
              className="w-full bg-[#14171F]/80 backdrop-blur-md border border-white/10 rounded-2xl py-3.5 pl-11 pr-4 text-white placeholder:text-neutral-500 focus:outline-none focus:border-acid-lime/50 focus:ring-1 focus:ring-acid-lime/50 transition-all font-medium text-sm appearance-none"
            >
              <option value="" disabled className="text-neutral-500">Selecciona tu país</option>
              <option value="AR">Argentina</option>
              <option value="BO">Bolivia</option>
              <option value="BR">Brasil</option>
              <option value="CL">Chile</option>
              <option value="CO">Colombia</option>
              <option value="CR">Costa Rica</option>
              <option value="EC">Ecuador</option>
              <option value="SV">El Salvador</option>
              <option value="GT">Guatemala</option>
              <option value="HN">Honduras</option>
              <option value="MX">México</option>
              <option value="NI">Nicaragua</option>
              <option value="PA">Panamá</option>
              <option value="PY">Paraguay</option>
              <option value="PE">Perú</option>
              <option value="DO">República Dominicana</option>
              <option value="UY">Uruguay</option>
              <option value="VE">Venezuela</option>
              <option value="ES">España</option>
              <option value="US">Estados Unidos</option>
            </select>
          </div>

          {/* Passwords */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-500 group-focus-within:text-acid-lime transition-colors">
              <Lock size={18} />
            </div>
            <input
              type="password"
              name="password"
              placeholder="Contraseña"
              value={formData.password}
              onChange={handleChange}
              className="w-full bg-[#14171F]/80 backdrop-blur-md border border-white/10 rounded-2xl py-3.5 pl-11 pr-4 text-white placeholder:text-neutral-500 focus:outline-none focus:border-acid-lime/50 focus:ring-1 focus:ring-acid-lime/50 transition-all font-medium text-sm"
            />
          </div>

          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-500 group-focus-within:text-acid-lime transition-colors">
              <Lock size={18} />
            </div>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirmar Contraseña"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full bg-[#14171F]/80 backdrop-blur-md border border-white/10 rounded-2xl py-3.5 pl-11 pr-4 text-white placeholder:text-neutral-500 focus:outline-none focus:border-acid-lime/50 focus:ring-1 focus:ring-acid-lime/50 transition-all font-medium text-sm"
            />
          </div>

          {error && (
            <div className="text-red-400 text-xs font-semibold px-2 text-center animate-fade-in">
              {error}
            </div>
          )}

          <div className="pt-6">
            <Button
              type="submit"
              variant="primary"
              size="full"
              disabled={isLoading || aliasStatus === 'invalid'}
              className="group py-4 rounded-2xl flex items-center justify-center gap-2 relative overflow-hidden disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 size={20} className="animate-spin text-neutral-950" />
              ) : (
                <>
                  <span className="relative z-10 text-neutral-950 font-black">REGISTRARSE</span>
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
            text="signup_with"
            width="340"
          />
        </div>

        <div className="mt-8 mb-4 text-center">
          <p className="text-neutral-500 text-xs font-medium">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="text-acid-lime font-bold hover:underline underline-offset-4">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
