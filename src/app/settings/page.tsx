'use client';

import React, { useState, useRef, useEffect } from 'react';
import { debugLog } from "@/lib/debugLog";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  LogOut,
  ChevronLeft,
  ChevronRight,
  Zap,
  X,
  Bell,
  UserPen,
  Camera,
  Check,
  Loader2,
  Music,
  Lock,
  UserCheck,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { useMutation } from '@/hooks/useMutation';
import { useInterests } from '@/hooks/useInterests';
import { InterestsSheet } from '@/components/InterestsSheet';
import { SwipeBack } from "@/components/ui/SwipeBack";
import { Button } from '@/components/ui/Button';
import { usePushNotifications } from '@/context/PushNotificationsContext';
import { usersApi } from '@/services/users';
import { cn } from '@/lib/utils';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { compressImageToJpeg } from '@/lib/compressImage';

export default function SettingsPage() {
  const router = useRouter();
  const { user, login, token, logout } = useAuth();
  const push = usePushNotifications();
  const [logoutError, setLogoutError] = useState<string>();
  const interests = useInterests();
  const [showInterests, setShowInterests] = useState(false);
  // Perfil privado: se cambia al instante y vuelve atrás si falla.
  const [isPrivate, setIsPrivate] = useState(!!user?.isPrivate);
  const { mutate: savePrivacy, isLoading: savingPrivacy, error: privacyError } = useMutation(usersApi.setPrivacy, {
    onSuccess: (value) => {
      if (user && token) login(token, { ...user, isPrivate: value });
    },
    onError: (_err, value) => setIsPrivate(!value),
  });
  const togglePrivacy = () => {
    const next = !isPrivate;
    setIsPrivate(next);
    void savePrivacy(next).catch(() => undefined);
  };
  const [loggingOut, setLoggingOut] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Edit Avatar states
  const [avatarUrl, setAvatarUrl] = useState('');
  // Archivo ya comprimido listo para subir; `avatarUrl` es solo la vista previa.
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Upgrade form states (Exclusivo RRPP)
  const role = 'RRPP';
  const [socials, setSocials] = useState('');
  const [contact, setContact] = useState('');
  const [productora, setProductora] = useState('');
  const [upgradeSubmitted, setUpgradeSubmitted] = useState(false);

  // Sync avatar with user data
  useEffect(() => {
    if (user) {
      setAvatarUrl(user.avatarUrl || '');
    }
  }, [user, showEditModal]);

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
    setAvatarFile(compressed);
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
    if (!avatarFile) {
      setShowEditModal(false);
      return;
    }
    setSavingProfile(true);
    setEditError(null);

    try {
      // El backend sube la imagen y devuelve el usuario con la URL definitiva de la foto.
      const res = await usersApi.updateAvatar(avatarFile);
      const updatedUser = { ...user, ...res };

      if (user) {
        login(token || '', updatedUser);
      }
      setAvatarFile(null);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setShowEditModal(false);
      }, 700);
    } catch (err: any) {
      setEditError(err.response?.data?.error || err.response?.data?.message || err.message || 'Error al guardar la foto.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    setLogoutError(undefined);
    try {
      await logout();
    } catch (error) {
      setLogoutError(
        error instanceof Error ? error.message : 'No pudimos cerrar sesión.',
      );
    } finally {
      setLoggingOut(false);
    }
  };

  const handleUpgradeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    debugLog('Upgrade requested:', { role: 'RRPP', socials, contact, productora });
    setUpgradeSubmitted(true);
    setTimeout(() => {
      setUpgradeSubmitted(false);
      setShowUpgradeModal(false);
    }, 1200);
  };

  return (
    <main className="min-h-[100dvh] bg-bg text-ink flex flex-col pb-[calc(var(--root-mobile-nav-clearance)+1rem)] md:pb-16 relative">
      {/* Header unificado Nocturno Editorial */}
      <header className="sticky top-0 z-30 w-full bg-bg/95 backdrop-blur-md border-b border-line lg:static lg:border-b-0 lg:bg-transparent lg:backdrop-blur-none">
        <div className="w-full max-w-2xl mx-auto px-4 pt-[calc(0.75rem+var(--root-safe-top))] pb-3 md:pt-6 flex items-center gap-3 lg:max-w-none lg:px-0 lg:pt-2 lg:pb-6">
          <SwipeBack />
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Volver"
            className="size-11 shrink-0 rounded-control bg-surface border border-line flex items-center justify-center hover:bg-surface-2 transition-colors focus-visible:outline-2 focus-visible:outline-accent cursor-pointer"
          >
            <ChevronLeft className="size-[22px]" aria-hidden="true" />
          </button>
          <h1 className="font-display header-title-fit m-0 flex-1 min-w-0">
            Configuración
          </h1>
        </div>
      </header>

      <div className="w-full max-w-2xl mx-auto px-4 pt-5 space-y-4 lg:max-w-none lg:px-0 lg:pt-0 lg:grid lg:grid-cols-2 lg:gap-5 lg:space-y-0 lg:items-start">
        {/* Notificaciones */}
        <section className="rounded-card border border-line bg-surface p-5 space-y-3.5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-accent/10 rounded-control text-accent shrink-0">
              <Bell className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-ink">
                Notificaciones de mensajes
              </h2>
              <p className="text-xs text-ink-2">
                Recibí avisos de tus chats y squads aunque no tengas la app abierta.
              </p>
            </div>
          </div>
          {push.state === 'unsupported' ? (
            <p className="text-xs text-ink-3">
              Disponible en la app instalada para celular (Android / iOS). Por ahora no se activa
              desde el navegador web.
            </p>
          ) : (
            <Button
              type="button"
              disabled={push.isLoading || loggingOut}
              onClick={() => {
                void (push.state === 'enabled' ? push.disable() : push.enable());
              }}
              variant={push.state === 'enabled' ? 'secondary' : 'primary'}
              size="sm"
              className="rounded-control font-bold"
            >
              {push.isLoading
                ? 'Configurando…'
                : push.state === 'enabled'
                  ? 'Desactivar notificaciones'
                  : 'Activar notificaciones'}
            </Button>
          )}
          {push.state === 'enabled' && (
            <p className="text-xs font-semibold text-accent" role="status">
              Notificaciones activadas en este dispositivo.
            </p>
          )}
          {push.error && (
            <p className="text-xs font-semibold text-danger" role="alert">
              {push.error}
            </p>
          )}
        </section>

        {/* Opciones de configuración */}
        <div className="bg-surface border border-line rounded-card overflow-hidden divide-y divide-line lg:col-start-2 lg:row-start-1 lg:row-span-2">
          {/* Perfil privado: seguir requiere que aceptes la solicitud. */}
          <div className="w-full flex items-center justify-between gap-3 p-4.5">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="p-2.5 bg-accent/10 rounded-control text-accent shrink-0">
                <Lock className="size-5" />
              </div>
              <div className="min-w-0">
                <span id="privacy-label" className="font-bold text-ink block text-[15px]">Perfil privado</span>
                <span className="text-xs text-ink-2 block">
                  {isPrivate ? 'Solo tus seguidores ven tus posts, insignias y listas.' : 'Cualquiera puede ver tu perfil y seguirte.'}
                </span>
                {privacyError && <span role="alert" className="text-xs text-danger block">No se pudo guardar el cambio.</span>}
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isPrivate}
              aria-labelledby="privacy-label"
              disabled={savingPrivacy}
              onClick={togglePrivacy}
              className={cn(
                'relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                isPrivate ? 'bg-accent' : 'bg-surface-2 border border-line-strong',
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  'absolute top-1/2 size-5 -translate-y-1/2 rounded-full transition-[left,background-color] duration-200',
                  isPrivate ? 'left-[26px] bg-on-accent' : 'left-1 bg-ink-2',
                )}
              />
            </button>
          </div>

          {isPrivate && (
            <Link
              href="/settings/follow-requests"
              className="w-full flex items-center justify-between p-4.5 hover:bg-surface-2 transition-colors text-left"
            >
              <div className="flex items-center gap-3.5">
                <div className="p-2.5 bg-accent/10 rounded-control text-accent shrink-0">
                  <UserCheck className="size-5" />
                </div>
                <div>
                  <span className="font-bold text-ink block text-[15px]">Solicitudes de seguimiento</span>
                  <span className="text-xs text-ink-2">Aceptá o rechazá quién te quiere seguir</span>
                </div>
              </div>
              <ChevronRight className="size-5 text-ink-3" />
            </Link>
          )}

          {/* Intereses musicales: ordenan los eventos destacados. */}
          <button
            type="button"
            onClick={() => setShowInterests(true)}
            className="w-full flex items-center justify-between p-4.5 hover:bg-surface-2 transition-colors cursor-pointer text-left"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="p-2.5 bg-accent/10 rounded-control text-accent shrink-0">
                <Music className="size-5" />
              </div>
              <div className="min-w-0">
                <span className="font-bold text-ink block text-[15px]">Tus géneros</span>
                <span className="text-xs text-ink-2 block truncate">
                  {interests.genres.length > 0 ? interests.genres.join(' · ') : 'Elegí qué música te gusta'}
                </span>
              </div>
            </div>
            <ChevronRight className="size-5 text-ink-3 shrink-0" />
          </button>

          {/* Foto de Perfil */}
          <button
            type="button"
            onClick={() => {
              setAvatarUrl(user?.avatarUrl || '');
              setAvatarFile(null);
              setEditError(null);
              setShowEditModal(true);
            }}
            className="w-full flex items-center justify-between p-4.5 hover:bg-surface-2 transition-colors cursor-pointer text-left"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 bg-accent/10 rounded-control text-accent shrink-0">
                <Camera className="size-5" />
              </div>
              <div>
                <span className="font-bold text-ink block text-[15px]">
                  Foto de Perfil
                </span>
                <span className="text-xs text-ink-2">
                  Cambiá tu imagen de perfil
                </span>
              </div>
            </div>
            <ChevronRight className="size-5 text-ink-3" />
          </button>

          {/* Upgrade */}
          <button
            type="button"
            onClick={() => {
              setUpgradeSubmitted(false);
              setShowUpgradeModal(true);
            }}
            className="w-full flex items-center justify-between p-4.5 hover:bg-surface-2 transition-colors cursor-pointer text-left"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 bg-accent/10 rounded-control text-accent shrink-0">
                <Zap className="size-5" />
              </div>
              <div>
                <span className="font-bold text-ink block text-[15px]">
                  Hacer Upgrade de Perfil
                </span>
                <span className="text-xs text-ink-2">
                  Solicitá insignia y permisos de RRPP
                </span>
              </div>
            </div>
            <ChevronRight className="size-5 text-ink-3" />
          </button>

          {/* Términos y Condiciones */}
          <Link
            href="/terms"
            className="w-full flex items-center justify-between p-4.5 hover:bg-surface-2 transition-colors text-left"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 bg-accent/10 rounded-control text-accent shrink-0">
                <FileText className="size-5" />
              </div>
              <div>
                <span className="font-bold text-ink block text-[15px]">
                  Términos y Condiciones
                </span>
                <span className="text-xs text-ink-2">
                  Reglas de uso y convivencia en Root
                </span>
              </div>
            </div>
            <ChevronRight className="size-5 text-ink-3" />
          </Link>

          {/* Política de Privacidad */}
          <Link
            href="/privacy"
            className="w-full flex items-center justify-between p-4.5 hover:bg-surface-2 transition-colors text-left"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 bg-accent/10 rounded-control text-accent shrink-0">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <span className="font-bold text-ink block text-[15px]">
                  Política de Privacidad
                </span>
                <span className="text-xs text-ink-2">
                  Tratamiento y protección de tus datos
                </span>
              </div>
            </div>
            <ChevronRight className="size-5 text-ink-3" />
          </Link>

          {/* Cerrar Sesión */}
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center justify-between p-4.5 hover:bg-danger/10 transition-colors cursor-pointer text-left group"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 bg-danger/10 rounded-control text-danger shrink-0">
                <LogOut className="size-5" />
              </div>
              <span className="font-bold text-danger text-[15px]">
                {loggingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}
              </span>
            </div>
            <ChevronRight className="size-5 text-ink-3 group-hover:text-danger transition-colors" />
          </button>
        </div>

        {logoutError && (
          <p className="text-xs font-semibold text-danger px-1 lg:col-start-2" role="alert">
            {logoutError}
          </p>
        )}
      </div>

      {/* Edit Avatar BottomSheet */}
      <BottomSheet
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        icon={<Camera className="size-4 text-accent" />}
        title="Foto de Perfil"
        subtitle="Actualizá tu imagen en root"
        ariaLabel="Cambiar foto de perfil"
        initialHeight={480}
      >
        <form onSubmit={handleSaveProfile} className="p-5 flex flex-col items-center gap-5">
          {/* Avatar Preview & File Input Trigger */}
          <div className="flex flex-col items-center gap-3 pt-2">
            <div className="relative group">
              <div className="size-32 rounded-full overflow-hidden border-2 border-line bg-surface-2 flex items-center justify-center shadow-lg">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="size-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-bold text-ink-2">
                    {user?.name ? user.name[0]?.toUpperCase() : 'U'}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-1 right-1 size-10 bg-accent text-on-accent rounded-full shadow-lg flex items-center justify-center hover:bg-accent-hover transition-transform active:scale-95 cursor-pointer"
                title="Elegir foto"
              >
                <Camera className="size-5" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                className="hidden"
              />
            </div>

            <div className="text-center">
              <p className="text-sm font-bold text-ink">
                {user?.name || 'Usuario'}
              </p>
              {user?.username && (
                <p className="text-xs text-ink-3">@{user.username}</p>
              )}
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-semibold text-accent hover:underline cursor-pointer"
            >
              Elegir otra foto de la galería
            </button>
          </div>

          {editError && (
            <p className="text-xs text-danger bg-danger/10 border border-danger/25 rounded-control p-2.5 font-medium w-full text-center">
              {editError}
            </p>
          )}

          <div className="w-full pt-2 pb-6">
            <Button
              type="submit"
              variant="primary"
              disabled={savingProfile || saveSuccess || !avatarFile}
              className="w-full h-12 text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2"
            >
              {savingProfile ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Guardando…
                </>
              ) : saveSuccess ? (
                <>
                  <Check className="size-4 text-on-accent" />
                  ¡Foto actualizada!
                </>
              ) : (
                'Guardar Foto'
              )}
            </Button>
          </div>
        </form>
      </BottomSheet>

      {/* Upgrade BottomSheet */}
      <BottomSheet
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        icon={<Zap className="size-4 text-accent" />}
        title="Upgrade a RRPP"
        subtitle="Solicitud de cuenta y difusión para eventos"
        ariaLabel="Solicitar upgrade a RRPP"
        initialHeight={560}
      >
        {upgradeSubmitted ? (
          <div className="py-12 px-6 flex flex-col items-center justify-center text-center space-y-3">
            <div className="size-14 rounded-full bg-accent/15 border border-accent/40 flex items-center justify-center text-accent">
              <Check className="size-7" />
            </div>
            <h3 className="font-display text-xl font-bold text-ink">
              ¡Solicitud enviada!
            </h3>
            <p className="text-sm text-ink-2 max-w-xs">
              Recibimos tu solicitud de upgrade para RRPP. La revisaremos a la brevedad.
            </p>
          </div>
        ) : (
          <form onSubmit={handleUpgradeSubmit} className="p-4 sm:p-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-ink-2">
                Tipo de Cuenta
              </label>
              <div className="p-3.5 rounded-control bg-accent/10 border border-accent/35 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="label-mono px-2.5 py-1 rounded bg-accent text-on-accent font-black text-xs">
                    RRPP
                  </span>
                  <span className="text-sm font-semibold text-ink">
                    Relaciones Públicas
                  </span>
                </div>
                <Check className="size-4 text-accent" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-ink-2">
                Redes Sociales (Ej: IG, TikTok)
              </label>
              <input
                type="text"
                required
                placeholder="@tu_usuario"
                value={socials}
                onChange={(e) => setSocials(e.target.value)}
                className="w-full bg-surface-2 border border-line rounded-control px-4 py-3 text-sm text-ink placeholder:text-ink-3 outline-none focus:border-accent transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-ink-2">
                Contacto (WhatsApp / Teléfono)
              </label>
              <input
                type="text"
                required
                placeholder="+54 9 11..."
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className="w-full bg-surface-2 border border-line rounded-control px-4 py-3 text-sm text-ink placeholder:text-ink-3 outline-none focus:border-accent transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-ink-2">
                Productora a la que pertenecés
              </label>
              <input
                type="text"
                placeholder="Opcional..."
                value={productora}
                onChange={(e) => setProductora(e.target.value)}
                className="w-full bg-surface-2 border border-line rounded-control px-4 py-3 text-sm text-ink placeholder:text-ink-3 outline-none focus:border-accent transition-colors"
              />
            </div>

            <div className="pt-2 pb-6">
              <Button
                type="submit"
                variant="primary"
                className="w-full h-12 text-sm font-bold uppercase tracking-wider"
              >
                Solicitar Upgrade a RRPP
              </Button>
            </div>
          </form>
        )}
      </BottomSheet>

      {showInterests && (
        <InterestsSheet
          isOpen
          mode="edit"
          options={interests.options}
          initialGenres={interests.genres}
          isSaving={interests.isSaving}
          onSave={interests.saveInterests}
          onClose={() => setShowInterests(false)}
        />
      )}
    </main>
  );
}
