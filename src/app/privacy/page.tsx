"use client";

import React from "react";
import Link from "next/link";
import { ChevronLeft, ShieldCheck, Lock, Eye, HeartPulse, Camera, MapPin, KeyRound } from "lucide-react";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { SwipeBack } from "@/components/ui/SwipeBack";

export default function PrivacyPage() {
  const goBack = useBackNavigation("/settings");

  return (
    <main className="min-h-[100dvh] bg-bg text-ink flex flex-col pb-[calc(var(--root-mobile-nav-clearance)+1rem)] md:pb-16">
      {/* Header Sticky */}
      <header className="sticky top-0 z-30 w-full bg-bg/95 backdrop-blur-md border-b border-line">
        <div className="w-full max-w-2xl mx-auto px-4 pt-[calc(0.75rem+var(--root-safe-top))] pb-3 md:pt-6 flex items-center gap-3">
          <SwipeBack onBack={goBack} />
          <button
            type="button"
            onClick={goBack}
            aria-label="Volver"
            className="size-11 shrink-0 rounded-control bg-surface border border-line flex items-center justify-center hover:bg-surface-2 transition-colors focus-visible:outline-2 focus-visible:outline-accent cursor-pointer"
          >
            <ChevronLeft className="size-[22px]" aria-hidden="true" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-display header-title-fit m-0 truncate">Política de Privacidad</h1>
            <p className="text-[11px] text-ink-3 m-0">Última actualización: Noviembre 2026</p>
          </div>
        </div>
      </header>

      {/* Contenido */}
      <div className="w-full max-w-2xl mx-auto px-4 pt-4 space-y-4 text-sm leading-relaxed">
        {/* Tarjeta de Compromiso */}
        <div className="rounded-card border border-line bg-surface p-5 space-y-2">
          <div className="flex items-center gap-2.5 text-accent font-bold text-xs uppercase tracking-wider">
            <ShieldCheck className="size-4 shrink-0" />
            <span>Tu Privacidad en Root</span>
          </div>
          <p className="text-ink text-sm font-medium m-0">
            En Root (operada por <strong className="text-ink font-semibold">EM Network</strong>) protegemos la información personal de nuestra comunidad. Esta política detalla qué datos recopilamos, por qué los necesitamos y cómo podés controlarlos.
          </p>
        </div>

        {/* 1. Datos que recopilamos */}
        <section className="rounded-card border border-line bg-surface p-5 space-y-2.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-accent/10 rounded-control text-accent shrink-0">
              <KeyRound className="size-4" />
            </div>
            <h2 className="text-base font-bold text-ink m-0">1. Datos que nos proporcionás</h2>
          </div>
          <ul className="m-0 pl-4 space-y-1.5 text-xs text-ink-2 list-disc">
            <li><strong className="text-ink font-semibold">Información de Cuenta:</strong> Correo electrónico, nombre, alias (@username) y contraseña cifrada o credenciales seguras de Google Sign-In.</li>
            <li><strong className="text-ink font-semibold">Vibe Profile:</strong> Géneros electrónicos preferidos, zona aproximada de partida y estilo de salida para encontrar Crews compatibles.</li>
            <li><strong className="text-ink font-semibold">Contenido generado:</strong> Fotos, publicaciones, reseñas de clubes o DJs y mensajes enviados en chats grupales o directos.</li>
          </ul>
        </section>

        {/* 2. Apple Health & Sensores de Movimiento */}
        <section className="rounded-card border border-line bg-surface p-5 space-y-2.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-accent/10 rounded-control text-accent shrink-0">
              <HeartPulse className="size-4" />
            </div>
            <h2 className="text-base font-bold text-ink m-0">2. Datos de Salud y Movimiento (Apple Health)</h2>
          </div>
          <p className="text-ink-2 m-0">
            Con tu autorización explícita, Root accede al conteo de pasos mediante <strong className="text-ink font-semibold">Apple Health (HealthKit)</strong> y sensores del teléfono para la función comunitaria <strong className="text-ink font-semibold">Dance Ranker</strong> mientras se desarrolla un evento.
          </p>
          <div className="p-3 bg-accent/10 rounded-control border border-accent/20 text-xs text-ink space-y-1">
            <p className="font-bold text-accent m-0">Compromiso estricto sobre datos de salud:</p>
            <p className="m-0 text-ink-2">
              Root <strong className="text-ink font-semibold">NO</strong> vende, comparte ni utiliza información obtenida de Apple Health o sensores de movimiento para fines publicitarios, redes de marketing ni intermediarios de datos (data brokers).
            </p>
          </div>
        </section>

        {/* 3. Cámara y Verificación KYC */}
        <section className="rounded-card border border-line bg-surface p-5 space-y-2.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-accent/10 rounded-control text-accent shrink-0">
              <Camera className="size-4" />
            </div>
            <h2 className="text-base font-bold text-ink m-0">3. Cámara y Verificación de Identidad (KYC)</h2>
          </div>
          <p className="text-ink-2 m-0">
            Solicitamos permiso de cámara para que puedas subir fotos a tu perfil, publicar momentos de fiestas y, de manera opcional, verificar tu identidad (KYC) escaneando tu documento y rostro.
          </p>
          <p className="text-xs text-ink-2 m-0">
            Las capturas se procesan de forma cifrada mediante HTTPS y se usan exclusivamente para autenticar cuentas y prevenir perfiles falsos o fraudes en la comunidad.
          </p>
        </section>

        {/* 4. Geolocalización */}
        <section className="rounded-card border border-line bg-surface p-5 space-y-2.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-accent/10 rounded-control text-accent shrink-0">
              <MapPin className="size-4" />
            </div>
            <h2 className="text-base font-bold text-ink m-0">4. Geolocalización y Eventos en Vivo</h2>
          </div>
          <p className="text-ink-2 m-0">
            Utilizamos tu ubicación únicamente para validar si estás físicamente presente en un evento o club, actualizar el ranking de baile y proyectar tu actividad en vivo en la Dynamic Island. Root no rastrea tus desplazamientos fuera de los eventos ni comercializa tus coordenadas.
          </p>
        </section>

        {/* 5. Privacidad y Control de tus Datos */}
        <section className="rounded-card border border-line bg-surface p-5 space-y-2.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-accent/10 rounded-control text-accent shrink-0">
              <Lock className="size-4" />
            </div>
            <h2 className="text-base font-bold text-ink m-0">5. Tu Control sobre tu Privacidad</h2>
          </div>
          <ul className="m-0 pl-4 space-y-1.5 text-xs text-ink-2 list-disc">
            <li><strong className="text-ink font-semibold">Perfil Privado:</strong> Podés activar el modo privado en Configuración para que solo usuarios autorizados vean tus fotos e insignias.</li>
            <li><strong className="text-ink font-semibold">Revocación de Permisos:</strong> Podés cancelar en cualquier momento el acceso a cámara, salud o ubicación desde los Ajustes del sistema operativo.</li>
            <li><strong className="text-ink font-semibold">Eliminación Definitiva:</strong> Podés solicitar la supresión de tu cuenta y el borrado permanente de tus datos personales directamente desde la app.</li>
          </ul>
        </section>

        {/* 6. Seguridad y Cifrado */}
        <section className="rounded-card border border-line bg-surface p-5 space-y-2.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-accent/10 rounded-control text-accent shrink-0">
              <Eye className="size-4" />
            </div>
            <h2 className="text-base font-bold text-ink m-0">6. Seguridad y Almacenamiento</h2>
          </div>
          <p className="text-ink-2 m-0">
            Toda la comunicación entre tu dispositivo y nuestros servidores utiliza cifrado TLS/HTTPS. Las contraseñas se almacenan mediante funciones hash criptográficas seguras y los datos sensibles se resguardan en servidores con acceso restringido.
          </p>
          <p className="text-xs text-ink-3 m-0 pt-2">
            Para dudas sobre el tratamiento de tus datos personales o ejercer tus derechos de acceso o cancelación, contactanos a <span className="text-accent">soporte@emnetwork.root</span>.
          </p>
        </section>

        {/* Enlace cruzado a Términos */}
        <div className="text-center pt-2 pb-4">
          <Link
            href="/terms"
            className="text-xs text-accent hover:underline font-semibold"
          >
            Ver Términos y Condiciones de Uso →
          </Link>
        </div>
      </div>
    </main>
  );
}
