'use client';

import React, { useState } from 'react';
import { TopNav } from '@/components/ui/TopNav';
import { useAuth } from '@/context/AuthContext';
import { LogOut, ChevronRight, Zap, X, Bell } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { usePushNotifications } from '@/context/PushNotificationsContext';

export default function SettingsPage() {
  const { logout } = useAuth();
  const push = usePushNotifications();
  const [logoutError, setLogoutError] = useState<string>();
  const [loggingOut, setLoggingOut] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Form states
  const [role, setRole] = useState('INFLUENCER');
  const [socials, setSocials] = useState('');
  const [contact, setContact] = useState('');
  const [productora, setProductora] = useState('');

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
    // You can add a toast notification here
  };

  return (
    <main className="min-h-[100dvh] bg-[#0B0D10] text-white flex flex-col pb-20 relative">
      <TopNav title="Configuración" showBack={true} />

      <div className="flex-1 mt-20 px-4 space-y-4">
        <section className="rounded-2xl border border-white/5 bg-[#14171F]/80 p-4 space-y-3">
          <div className="flex items-center gap-3"><Bell className="w-5 h-5 text-[#D4FF00]" /><h2 className="font-semibold">Notificaciones de mensajes</h2></div>
          <p className="text-sm text-neutral-400">Recibí avisos de tus chats y squads aunque no tengas la app abierta.</p>
          {push.state === 'unsupported' ? <p className="text-sm text-neutral-400">Disponible en la app instalada en Android. Por ahora no se activa desde el navegador ni en iPhone.</p> : (
            <button type="button" disabled={push.isLoading || loggingOut} onClick={() => { void (push.state === 'enabled' ? push.disable() : push.enable()); }} className="rounded-xl bg-[#D4FF00] px-4 py-2 text-sm font-bold text-black disabled:opacity-50">
              {push.isLoading ? 'Configurando…' : push.state === 'enabled' ? 'Desactivar notificaciones' : 'Activar notificaciones'}
            </button>
          )}
          {push.state === 'enabled' && <p className="text-sm text-[#D4FF00]" role="status">Notificaciones activadas en este dispositivo.</p>}
          {push.error && <p className="text-sm text-red-400" role="alert">{push.error}</p>}
        </section>
        
        {/* Settings Options */}
        <div className="bg-[#14171F]/80 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden divide-y divide-white/5">
          
          <button
            onClick={() => setShowUpgradeModal(true)}
            className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors active:bg-white/10"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#D4FF00]/10 rounded-xl">
                <Zap className="w-5 h-5 text-[#D4FF00]" />
              </div>
              <span className="font-semibold text-white">Hacer Upgrade de Perfil</span>
            </div>
            <ChevronRight className="w-5 h-5 text-neutral-500" />
          </button>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors active:bg-white/10"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/10 rounded-xl">
                <LogOut className="w-5 h-5 text-red-500" />
              </div>
              <span className="font-semibold text-red-500">{loggingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}</span>
            </div>
            <ChevronRight className="w-5 h-5 text-neutral-500" />
          </button>

        </div>
        {logoutError && <p className="text-sm text-red-400" role="alert">{logoutError}</p>}
      </div>

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
