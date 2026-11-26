"use client";

import React from "react";
import Link from "next/link";
import { ChevronLeft, FileText, ShieldAlert, Sparkles, Users, Activity, Ticket, Ban, Trash2 } from "lucide-react";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { SwipeBack } from "@/components/ui/SwipeBack";

export default function TermsPage() {
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
            <h1 className="font-display header-title-fit m-0 truncate">Términos y Condiciones</h1>
            <p className="text-[11px] text-ink-3 m-0">Última actualización: Noviembre 2026</p>
          </div>
        </div>
      </header>

      {/* Contenido */}
      <div className="w-full max-w-2xl mx-auto px-4 pt-4 space-y-4 text-sm leading-relaxed">
        {/* Tarjeta de Introducción */}
        <div className="rounded-card border border-line bg-surface p-5 space-y-2">
          <div className="flex items-center gap-2.5 text-accent font-bold text-xs uppercase tracking-wider">
            <Sparkles className="size-4 shrink-0" />
            <span>Bienvenido a Root</span>
          </div>
          <p className="text-ink text-sm font-medium m-0">
            Root es la red social y plataforma de gestión de eventos para la cultura de la música electrónica, operada por <strong className="text-ink font-semibold">EM Network</strong>. Al registrarte o utilizar Root, aceptás estos términos en su totalidad.
          </p>
        </div>

        {/* 1. Elegibilidad y Edad */}
        <section className="rounded-card border border-line bg-surface p-5 space-y-2.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-accent/10 rounded-control text-accent shrink-0">
              <ShieldAlert className="size-4" />
            </div>
            <h2 className="text-base font-bold text-ink m-0">1. Elegibilidad y Edad Mínima</h2>
          </div>
          <p className="text-ink-2 m-0">
            Root está orientado a eventos de vida nocturna y festivales con regulaciones de edad. Para registrarte y utilizar la plataforma debés tener al menos <strong className="text-ink font-semibold">18 años cumplidos</strong> (o la mayoría de edad legal en tu jurisdicción). Queda terminantemente prohibido el acceso y uso a menores de edad.
          </p>
        </section>

        {/* 2. Cuentas y Registro */}
        <section className="rounded-card border border-line bg-surface p-5 space-y-2.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-accent/10 rounded-control text-accent shrink-0">
              <FileText className="size-4" />
            </div>
            <h2 className="text-base font-bold text-ink m-0">2. Cuentas y Responsabilidad</h2>
          </div>
          <p className="text-ink-2 m-0">
            Sos responsable de la confidencialidad de tus credenciales de acceso y de toda actividad realizada desde tu cuenta. Te comprometés a brindar datos reales y a no suplantar la identidad de terceros. Root se reserva el derecho de dar de baja cuentas con nombres de usuario ofensivos, engañosos o que violen derechos de terceros.
          </p>
        </section>

        {/* 3. Squad Matcher y Crews */}
        <section className="rounded-card border border-line bg-surface p-5 space-y-2.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-accent/10 rounded-control text-accent shrink-0">
              <Users className="size-4" />
            </div>
            <h2 className="text-base font-bold text-ink m-0">3. Squad Matcher y Encuentros Presenciales</h2>
          </div>
          <p className="text-ink-2 m-0">
            La herramienta Squad Matcher conecta a personas con afinidad musical para asistir a eventos en grupo (Crews).
          </p>
          <div className="p-3 bg-surface-2 rounded-control border border-line text-xs text-ink-2 space-y-1">
            <p className="font-semibold text-ink m-0">Exención de responsabilidad sobre encuentros físicos:</p>
            <p className="m-0">
              Root no supervisa ni organiza reuniones presenciales, traslados ni previas acordadas entre usuarios. Cualquier encuentro físico se realiza bajo la exclusiva responsabilidad y discreción de los participantes. Recomendamos coordinar siempre en lugares públicos e iluminados.
            </p>
          </div>
        </section>

        {/* 4. Dance Ranker & Apple Health */}
        <section className="rounded-card border border-line bg-surface p-5 space-y-2.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-accent/10 rounded-control text-accent shrink-0">
              <Activity className="size-4" />
            </div>
            <h2 className="text-base font-bold text-ink m-0">4. Dance Ranker y Sensores de Movimiento</h2>
          </div>
          <p className="text-ink-2 m-0">
            La función Dance Ranker utiliza sensores del dispositivo y la sincronización opcional con Apple Health para calcular los pasos dados mientras bailás durante un evento en vivo. Estos datos tienen únicamente fines de entretenimiento y gamificación. Root no ofrece asesoramiento de salud, médico ni de entrenamiento físico.
          </p>
        </section>

        {/* 5. Transferencias de Entradas */}
        <section className="rounded-card border border-line bg-surface p-5 space-y-2.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-accent/10 rounded-control text-accent shrink-0">
              <Ticket className="size-4" />
            </div>
            <h2 className="text-base font-bold text-ink m-0">5. Transferencias de Tickets</h2>
          </div>
          <p className="text-ink-2 m-0">
            Root facilita la transferencia técnica de accesos entre usuarios. Salvo mención expresa, Root no es el productor ni el emisor de los tickets de los eventos listados. Las políticas de admisión, reprogramación o cancelación dependen exclusivamente de los productores y clubes anfitriones.
          </p>
        </section>

        {/* 6. Tolerancia Cero frente al Acoso (EULA) */}
        <section className="rounded-card border border-line bg-surface p-5 space-y-2.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-danger/10 rounded-control text-danger shrink-0">
              <Ban className="size-4" />
            </div>
            <h2 className="text-base font-bold text-ink m-0">6. Política de Tolerancia Cero frente al Acoso</h2>
          </div>
          <p className="text-ink-2 m-0">
            Root aplica una estricta política de <strong className="text-ink font-semibold">Tolerancia Cero</strong> ante conductas abusivas, acoso, lenguaje de odio o contenido inapropiado.
          </p>
          <ul className="m-0 pl-4 space-y-1 text-xs text-ink-2 list-disc">
            <li>Queda prohibido el acoso, la intimidación, amenazas y discursos de odio de cualquier tipo.</li>
            <li>No se permite la difusión de imágenes de terceros sin su consentimiento explícito.</li>
            <li>No se tolera contenido sexual explícito ni la promoción de sustancias ilegales.</li>
          </ul>
          <p className="text-xs text-ink-2 m-0 pt-1">
            Los usuarios cuentan con botones dentro de la app para bloquear perfiles abusivos y reportar publicaciones. Cualquier violación grave resultará en la eliminación inmediata del contenido y la suspensión definitiva de la cuenta.
          </p>
        </section>

        {/* 7. Eliminación de Cuenta */}
        <section className="rounded-card border border-line bg-surface p-5 space-y-2.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-accent/10 rounded-control text-accent shrink-0">
              <Trash2 className="size-4" />
            </div>
            <h2 className="text-base font-bold text-ink m-0">7. Eliminación de Cuenta y Contacto</h2>
          </div>
          <p className="text-ink-2 m-0">
            Tenés derecho a solicitar y ejecutar la eliminación de tu cuenta en cualquier momento desde los ajustes de tu perfil. Al eliminar tu cuenta se revocarán todos tus accesos y se borrarán tus datos asociados conforme a nuestra Política de Privacidad.
          </p>
          <p className="text-xs text-ink-3 m-0 pt-2">
            Por consultas o denuncias legales, podés comunicarte con nuestro equipo en <span className="text-accent">soporte@emnetwork.root</span>.
          </p>
        </section>

        {/* Enlace cruzado a Privacidad */}
        <div className="text-center pt-2 pb-4">
          <Link
            href="/privacy"
            className="text-xs text-accent hover:underline font-semibold"
          >
            Ver Política de Privacidad de Root →
          </Link>
        </div>
      </div>
    </main>
  );
}
