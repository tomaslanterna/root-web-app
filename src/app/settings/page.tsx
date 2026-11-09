'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { TopNav } from '@/components/ui/TopNav';
import { useAuth } from '@/context/AuthContext';
import { LogOut, ChevronRight, Zap, X, Bell, UserPen, Camera, Check, Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { usePushNotifications } from '@/context/PushNotificationsContext';
import { usersApi } from '@/services/users';
import { compressImageToJpeg } from '@/lib/compressImage';

export default function SettingsPage() {
  const { user, login, token, logout } = useAuth();
  const push = usePushNotifications();
  const [logoutError, setLogoutError] = useState<string>();
  const [loggingOut, setLoggingOut] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Edit Profile form states
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Upgrade form states
  const [role, setRole] = useState('INFLUENCER');
  const [socials, setSocials] = useState('');
  const [contact, setContact] = useState('');
  const [productora, setProductora] = useState('');

  const openEditProfile = () => {
    setName(user?.name || '');
    setUsername(user?.username || '');
    setAvatarUrl(user?.avatarUrl || '');
    setEditError(null);
    setShowEditModal(true);
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEditError(null);
    let compressed: File;
    try {
      compressed = await compressImageToJpeg(file, 512, 0.82);
    } catch {
      setEditError('No pudimos procesar esa imagen. Probá con otra foto.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setAvatarUrl(event.target.result);
      }
    };
    reader.readAsDataURL(compressed);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim()) {
      setEditError('El nombre y el usuario no pueden estar vacíos.');
      return;
    }
    setSavingProfile(true);
    setEditError(null);

    try {
      const sanitizedUsername = username.trim().toLowerCase().replace(/^@/, '');
      const payload = {
        name: name.trim(),
        username: sanitizedUsername,
        avatarUrl: avatarUrl || undefined,
      };

      const res = await usersApi.updateMe(payload);
      const updatedUser = { ...user, ...payload, ...res };

      if (user) {
        login(token || '', updatedUser);
      }
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setShowEditModal(false);
      }, 700);
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : 'Error al guardar los cambios.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    setLogoutError(undefined);
    try { await logout(); }
    catch (error) { setLogoutError(error instanceof Error ? error.message : 'No pudimos cerrar sesión.'); }
    finally { setLoggingOut(false); }
  };

  const handleUpgradeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Connect with backend API to process upgrade
    console.log("Upgrade requested:", { role, socials, contact, productora });
    setShowUpgradeModal(false);
  };

  return (
    <main className="relative flex min-h-[100dvh] flex-col bg-[radial-gradient(circle_at_top,rgba(212,255,0,0.06),transparent_32%),#0B0D10] pb-[calc(5rem+var(--root-safe-bottom))] text-white">
      <TopNav title="Configuración" showBack={true} />

      <div className="mx-auto mt-20 w-full max-w-xl flex-1 space-y-8 px-4 py-6">
        <section className="flex items-center gap-4 border-b border-white/10 pb-6">
          <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-[#171A20] text-xl font-bold">
            {user?.avatarUrl ? <Image src={user.avatarUrl} alt="" width={64} height={64} unoptimized className="size-full object-cover" /> : user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-semibold">{user?.name || 'Tu perfil'}</p>
            <p className="truncate text-sm text-neutral-400">@{user?.username || 'usuario'}</p>
          </div>
          {user?.isKycVerified && <ShieldCheck className="size-5 shrink-0 text-[#D4FF00]" aria-label="Identidad verificada" />}
        </section>

        <section>
          <p className="mb-2 label-mono text-neutral-500">Cuenta</p>
          <div className="divide-y divide-white/[0.07] border-y border-white/[0.07]">
          
          {/* Editar Perfil */}
          <button
            onClick={openEditProfile}
            className="flex min-h-16 w-full items-center justify-between py-3 text-left transition-colors hover:text-[#D4FF00] active:opacity-70"
          >
            <div className="flex items-center gap-3">
              <UserPen className="w-5 h-5 text-[#D4FF00]" />
              <div><span className="block font-semibold text-white">Editar perfil</span><span className="text-sm text-neutral-500">Foto, nombre y alias</span></div>
            </div>
            <ChevronRight className="w-5 h-5 text-neutral-500" />
          </button>

          {/* Upgrade */}
          <button
            onClick={() => setShowUpgradeModal(true)}
            className="flex min-h-16 w-full items-center justify-between py-3 text-left transition-colors hover:text-[#D4FF00] active:opacity-70"
          >
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-[#D4FF00]" />
              <div><span className="block font-semibold text-white">Perfil profesional</span><span className="text-sm text-neutral-500">RRPP, productora, DJ o influencer</span></div>
            </div>
            <ChevronRight className="w-5 h-5 text-neutral-500" />
          </button>

          </div>
        </section>

        <section>
          <p className="mb-2 label-mono text-neutral-500">Notificaciones</p>
          <div className="border-y border-white/[0.07] py-4">
            <div className="flex items-start gap-3"><Bell className="mt-0.5 size-5 shrink-0 text-[#D4FF00]" /><div className="flex-1"><h2 className="font-semibold">Mensajes y squads</h2><p className="mt-1 text-sm leading-relaxed text-neutral-400">Recibí avisos aunque la app esté cerrada.</p></div></div>
            {push.state === 'unsupported' ? <p className="mt-3 text-sm text-neutral-500">Disponible en la app instalada en Android.</p> : (
              <button type="button" disabled={push.isLoading || loggingOut} onClick={() => { void (push.state === 'enabled' ? push.disable() : push.enable()); }} className={`mt-4 min-h-11 rounded-full px-5 text-sm font-bold transition-colors disabled:opacity-50 ${push.state === 'enabled' ? 'border border-white/15 text-white' : 'bg-[#D4FF00] text-black'}`}>
                {push.isLoading ? 'Configurando…' : push.state === 'enabled' ? 'Desactivar' : 'Activar notificaciones'}
              </button>
            )}
            {push.state === 'enabled' && <p className="mt-3 text-sm text-[#D4FF00]" role="status">Activas en este dispositivo.</p>}
            {push.error && <p className="mt-3 text-sm text-red-400" role="alert">{push.error}</p>}
          </div>
        </section>

        <section>
          <p className="mb-2 label-mono text-neutral-500">Sesión</p>
          <div className="border-y border-white/[0.07]">
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex min-h-16 w-full items-center justify-between py-3 text-left active:opacity-70"
          >
            <div className="flex items-center gap-3">
              <LogOut className="w-5 h-5 text-red-500" />
              <span className="font-semibold text-red-500">{loggingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}</span>
            </div>
            <ChevronRight className="w-5 h-5 text-neutral-500" />
          </button>

          </div>
        </section>
        {logoutError && <p className="text-sm text-red-400" role="alert">{logoutError}</p>}
      </div>

      {/* Edit Profile Modal Overlay */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm animate-in fade-in duration-200 sm:items-center sm:p-4">
          <div className="max-h-[94dvh] w-full max-w-md overflow-y-auto rounded-t-[30px] border border-white/10 bg-[#111419] shadow-2xl animate-in slide-in-from-bottom-4 duration-300 sm:rounded-[30px]">
            <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-white/20 sm:hidden" />
            
            <div className="flex items-start justify-between px-5 pb-2 pt-5">
              <div>
                <span className="label-mono text-[#D4FF00]">Tu identidad</span>
                <h2 className="mt-1 text-2xl font-bold tracking-tight text-white">Editar perfil</h2>
                <p className="mt-1 text-sm text-neutral-400">Así te reconocen dentro de root.</p>
              </div>
              <button 
                onClick={() => setShowEditModal(false)} 
                className="flex size-11 items-center justify-center rounded-full bg-white/5 transition-colors hover:bg-white/10"
                aria-label="Cerrar edición"
              >
                <X className="w-5 h-5 text-neutral-400" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-5 px-5 pb-[calc(1.25rem+var(--root-safe-bottom))] pt-4 sm:pb-6">
              {/* Photo Avatar Preview & Change */}
              <div className="flex items-center gap-4 border-y border-white/[0.07] py-5">
                <div className="relative group">
                  <div className="flex size-24 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-neutral-900">
                    {avatarUrl ? (
                      <Image src={avatarUrl} alt="Avatar" width={96} height={96} unoptimized className="size-full object-cover" />
                    ) : (
                      <span className="text-2xl font-bold text-neutral-400">
                        {name ? name[0]?.toUpperCase() : 'U'}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 flex size-10 items-center justify-center rounded-full bg-[#D4FF00] text-black shadow-lg transition-transform hover:bg-[#c2ea00] active:scale-95"
                    title="Cambiar foto de perfil"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                </div>
                <div><p className="font-semibold">Foto de perfil</p><p className="mt-1 text-sm leading-relaxed text-neutral-400">Usá una imagen clara para que tu comunidad te reconozca.</p><button type="button" onClick={() => fileInputRef.current?.click()} className="mt-2 min-h-11 text-sm font-semibold text-[#D4FF00]">Elegir otra foto</button></div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-neutral-300">Nombre</label>
                <input
                  type="text"
                  required
                  placeholder="Tu nombre"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12 w-full rounded-xl border border-white/10 bg-[#0B0D10] px-4 text-sm text-white outline-none transition-colors focus:border-[#D4FF00]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-neutral-300">Alias</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 font-semibold text-sm">@</span>
                  <input
                    type="text"
                    required
                    placeholder="usuario"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.replace(/^@/, ''))}
                    className="h-12 w-full rounded-xl border border-white/10 bg-[#0B0D10] pl-8 pr-4 text-sm text-white outline-none transition-colors focus:border-[#D4FF00]"
                  />
                </div>
              </div>

              {editError && (
                <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-2.5">
                  {editError}
                </p>
              )}

              <div className="pt-2">
                <Button 
                  type="submit" 
                  variant="primary" 
                  disabled={savingProfile || saveSuccess} 
                  className="w-full py-4 text-xs flex items-center justify-center gap-2"
                >
                  {savingProfile ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Guardando…
                    </>
                  ) : saveSuccess ? (
                    <>
                      <Check className="w-4 h-4 text-black" />
                      ¡Guardado!
                    </>
                  ) : (
                    'Guardar Cambios'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upgrade Modal Overlay */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#14171F] border border-white/10 sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
            
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#0B0D10]/50">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-[#D4FF00]" />
                <h2 className="text-base font-black uppercase tracking-wider text-white">Upgrade de Perfil</h2>
              </div>
              <button onClick={() => setShowUpgradeModal(false)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                <X className="w-4 h-4 text-neutral-400" />
              </button>
            </div>

            <form onSubmit={handleUpgradeSubmit} className="p-5 space-y-5">
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Tipo de Cuenta</label>
                <div className="grid grid-cols-2 gap-2">
                  {['INFLUENCER', 'RRPP', 'PRODUCER', 'DJ'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setRole(type)}
                      className={`py-2 px-3 rounded-lg text-xs font-black uppercase tracking-wider border transition-all ${
                        role === type 
                          ? 'bg-[#D4FF00]/10 border-[#D4FF00] text-[#D4FF00]' 
                          : 'bg-white/5 border-transparent text-neutral-400 hover:bg-white/10'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Redes Sociales (Ej: IG, TikTok)</label>
                <input
                  type="text"
                  required
                  placeholder="@usuario"
                  value={socials}
                  onChange={(e) => setSocials(e.target.value)}
                  className="w-full bg-[#0B0D10] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#D4FF00]/50 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Contacto (WhatsApp / Email)</label>
                <input
                  type="text"
                  required
                  placeholder="+54 9 11..."
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  className="w-full bg-[#0B0D10] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#D4FF00]/50 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Productora a la que perteneces</label>
                <input
                  type="text"
                  placeholder="Opcional..."
                  value={productora}
                  onChange={(e) => setProductora(e.target.value)}
                  className="w-full bg-[#0B0D10] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#D4FF00]/50 transition-colors"
                />
              </div>

              <div className="pt-2">
                <Button type="submit" variant="primary" className="w-full py-4 text-xs">
                  Solicitar Upgrade
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
