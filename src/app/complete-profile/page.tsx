'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { useMutation } from '@/hooks/useMutation';
import { api } from '@/lib/api';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { TopNav } from '@/components/ui/TopNav';

export default function CompleteProfilePage() {
  const { user, login, token } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    username: '',
    documentId: '',
    dob: '',
    country: '',
  });

  const [aliasStatus, setAliasStatus] = useState<'idle' | 'loading' | 'valid' | 'invalid'>('idle');
  const [error, setError] = useState('');

  // Initialize form with existing user data if any
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        documentId: user.documentId || '',
        dob: user.dob || '',
        country: user.country || '',
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === 'username') {
      setAliasStatus('idle');
    }
  };

  const handleValidateAlias = async () => {
    if (!formData.username) return;
    setAliasStatus('loading');
    
    try {
      if (formData.username === user?.username) {
         setAliasStatus('valid');
         return;
      }
      const res = await api.get(`/v1/users/check-username?username=${formData.username}`);
      if (res.data.available) {
        setAliasStatus('valid');
      } else {
        setAliasStatus('invalid');
      }
    } catch (err: any) {
      setAliasStatus('idle');
    }
  };

  const { mutate: updateProfile, isLoading } = useMutation(
    async (data: typeof formData) => {
      const response = await api.put('/v1/users/me', data);
      return response.data;
    },
    {
      onSuccess: (updatedUser) => {
        if (token) {
          login(token, updatedUser);
        }
        router.push('/feed');
      },
      onError: (err: any) => {
        if (err.response?.status === 409) {
          setError('Ese alias ya está en uso. Por favor elige otro.');
          setAliasStatus('invalid');
        } else {
          setError('Ocurrió un error al guardar los datos. Intenta nuevamente.');
        }
      }
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.username || !formData.documentId || !formData.dob) {
      setError('Todos los campos son obligatorios.');
      return;
    }

    if (aliasStatus === 'invalid') {
      setError('Por favor elige un alias válido.');
      return;
    }

    updateProfile(formData);
  };

  return (
    <main className="min-h-screen bg-[#0B0D10] flex flex-col text-white pb-20">
      <TopNav title="Completar Perfil" showBack={false} />
      
      <div className="flex-1 flex flex-col items-center justify-center p-6 mt-16">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-black uppercase tracking-tight text-white">Casi listos</h1>
            <p className="text-sm text-neutral-400 font-medium">
              Te faltan algunos datos para completar tu registro mediante Google.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-500">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p className="text-xs font-semibold">{error}</p>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400 ml-1">Alias (Username)</label>
              <div className="relative flex gap-2">
                <input
                  type="text"
                  name="username"
                  placeholder="Tu alias"
                  value={formData.username}
                  onChange={handleChange}
                  className={`w-full bg-[#14171F]/80 backdrop-blur-md rounded-2xl py-3.5 px-4 flex-1 text-white placeholder:text-neutral-500 focus:outline-none transition-colors border ${
                    aliasStatus === 'invalid' 
                      ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500/50' 
                      : 'border-white/10 focus:border-[#D4FF00]/50 focus:ring-1 focus:ring-[#D4FF00]/50'
                  }`}
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleValidateAlias}
                  disabled={aliasStatus === 'loading' || !formData.username}
                  className="bg-[#14171F] border-white/10 hover:border-white/20 hover:bg-[#1A1D24] text-white shrink-0 px-3"
                >
                  {aliasStatus === 'loading' ? (
                    <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />
                  ) : aliasStatus === 'valid' ? (
                    <CheckCircle2 className="w-4 h-4 text-[#D4FF00]" />
                  ) : aliasStatus === 'invalid' ? (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  ) : (
                    <span className="text-xs font-bold uppercase tracking-wider">Validar</span>
                  )}
                </Button>
              </div>
              {aliasStatus === 'valid' && (
                 <p className="text-[10px] text-[#D4FF00] ml-1 mt-1 font-semibold">¡Alias disponible!</p>
              )}
              {aliasStatus === 'invalid' && (
                 <p className="text-[10px] text-red-500 ml-1 mt-1 font-semibold">Ese alias ya está en uso.</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400 ml-1">Cédula de Identidad</label>
              <input
                type="text"
                name="documentId"
                placeholder="Ej. 12345678"
                value={formData.documentId}
                onChange={handleChange}
                className="w-full bg-[#14171F]/80 backdrop-blur-md rounded-2xl py-3.5 px-4 text-white placeholder:text-neutral-500 focus:outline-none border border-white/10 focus:border-[#D4FF00]/50 focus:ring-1 focus:ring-[#D4FF00]/50 transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400 ml-1">Fecha de Nacimiento</label>
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                className="w-full bg-[#14171F]/80 backdrop-blur-md rounded-2xl py-3.5 px-4 text-white placeholder:text-neutral-500 focus:outline-none border border-white/10 focus:border-[#D4FF00]/50 focus:ring-1 focus:ring-[#D4FF00]/50 transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400 ml-1">País</label>
              <select
                name="country"
                value={formData.country}
                onChange={handleChange as any}
                className="flex h-12 w-full rounded-xl bg-[#14171F] border border-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#D4FF00]/50 focus:border-[#D4FF00]/50 transition-colors disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
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

            <Button
              type="submit"
              disabled={isLoading || aliasStatus === 'invalid'}
              className="w-full bg-[#D4FF00] text-black hover:bg-[#B3D600] font-black uppercase tracking-wider h-12 rounded-xl mt-4 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Guardar y Continuar'}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
