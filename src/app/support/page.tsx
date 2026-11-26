"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Send,
  Check,
  Copy,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { SwipeBack } from "@/components/ui/SwipeBack";
import { Button } from "@/components/ui/Button";
import { Capacitor } from "@capacitor/core";

const SUPPORT_EMAIL = "soporte@emnetwork.root";

const CATEGORIES = [
  { id: "account", label: "Problemas con mi cuenta o acceso" },
  { id: "bug", label: "Reportar un error o fallo técnico" },
  { id: "tickets", label: "Eventos, Transfers o Entradas" },
  { id: "kyc", label: "Verificación de Identidad (KYC)" },
  { id: "other", label: "Consulta general o sugerencia" },
];

export default function SupportPage() {
  const { user } = useAuth();
  const goBack = useBackNavigation("/settings");

  const [emailInput, setEmailInput] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState<string | null>(null);
  const [category, setCategory] = useState("account");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const email = emailInput ?? "";
  const name = nameInput ?? (user?.name || "");

  const getPlatformLabel = () => {
    if (!Capacitor.isNativePlatform()) return "Web (Navegador)";
    const platform = Capacitor.getPlatform();
    return platform === "ios" ? "App iOS" : "App Android";
  };

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(SUPPORT_EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback silencioso
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !email.includes("@")) {
      setError("Por favor, ingresá un correo electrónico válido para que podamos responderte.");
      return;
    }

    if (!subject.trim()) {
      setError("Por favor, ingresá el asunto de tu consulta.");
      return;
    }

    if (!message.trim() || message.trim().length < 10) {
      setError("Por favor, escribí un mensaje detallando tu consulta (mínimo 10 caracteres).");
      return;
    }

    const categoryObj = CATEGORIES.find((c) => c.id === category);
    const categoryLabel = categoryObj ? categoryObj.label : "General";

    const emailSubject = `[Soporte Root] ${subject.trim()}`;
    const emailBody = [
      `Nombre: ${name.trim() || "No especificado"}`,
      `Usuario: ${user?.username ? `@${user.username}` : "No registrado / no logueado"}`,
      `Email de contacto: ${email.trim()}`,
      `Motivo: ${categoryLabel}`,
      `Plataforma: ${getPlatformLabel()}`,
      `Versión de la app: 0.1.0`,
      "",
      "--- Mensaje ---",
      message.trim(),
    ].join("\n");

    const mailtoUrl = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
      emailSubject
    )}&body=${encodeURIComponent(emailBody)}`;

    // Disparar el cliente de correo predeterminado
    window.location.href = mailtoUrl;
    setSubmitted(true);
  };

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
            <h1 className="font-display header-title-fit m-0 truncate">Soporte</h1>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <div className="w-full max-w-2xl mx-auto px-4 pt-4 space-y-4">
        {/* Mensaje de confirmación si ya se abrió el mail */}
        {submitted && (
          <div className="rounded-card border border-accent/30 bg-accent/10 p-4 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-accent font-bold">
              <Sparkles className="size-4 shrink-0" />
              <span>¡Correo preparado!</span>
            </div>
            <p className="text-ink-2 m-0">
              Se abrió tu aplicación de correo para enviar el mensaje. Si no se abrió automáticamente, podés escribirnos directamente a{" "}
              <button
                type="button"
                onClick={handleCopyEmail}
                className="font-semibold text-ink underline inline-flex items-center gap-1 cursor-pointer"
              >
                {SUPPORT_EMAIL}
                {copied ? <Check className="size-3 text-accent" /> : <Copy className="size-3" />}
              </button>.
            </p>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="rounded-card border border-line bg-surface p-5 space-y-4">
          <h2 className="text-base font-bold text-ink m-0">Enviar mensaje a soporte</h2>

          {/* Email y Nombre */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="support-email" className="block text-xs font-semibold text-ink-2">
                Tu correo electrónico <span className="text-accent">*</span>
              </label>
              <input
                id="support-email"
                type="email"
                value={email}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="ejemplo@correo.com"
                required
                className="w-full bg-surface-2 border border-line rounded-control px-3.5 py-2.5 text-ink placeholder:text-ink-3 text-sm focus:outline-none focus:border-accent transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="support-name" className="block text-xs font-semibold text-ink-2">
                Tu nombre o alias
              </label>
              <input
                id="support-name"
                type="text"
                value={name}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder={user?.username ? `@${user.username}` : "Tu nombre"}
                className="w-full bg-surface-2 border border-line rounded-control px-3.5 py-2.5 text-ink placeholder:text-ink-3 text-sm focus:outline-none focus:border-accent transition-colors"
              />
            </div>
          </div>

          {/* Categoría */}
          <div className="space-y-1.5">
            <label htmlFor="support-category" className="block text-xs font-semibold text-ink-2">
              Motivo de tu consulta <span className="text-accent">*</span>
            </label>
            <select
              id="support-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-surface-2 border border-line rounded-control px-3.5 py-2.5 text-ink text-sm focus:outline-none focus:border-accent transition-colors cursor-pointer"
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id} className="bg-surface text-ink">
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Asunto */}
          <div className="space-y-1.5">
            <label htmlFor="support-subject" className="block text-xs font-semibold text-ink-2">
              Asunto <span className="text-accent">*</span>
            </label>
            <input
              id="support-subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Breve resumen de tu consulta"
              required
              className="w-full bg-surface-2 border border-line rounded-control px-3.5 py-2.5 text-ink placeholder:text-ink-3 text-sm focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          {/* Mensaje */}
          <div className="space-y-1.5">
            <label htmlFor="support-message" className="block text-xs font-semibold text-ink-2">
              Mensaje detallado <span className="text-accent">*</span>
            </label>
            <textarea
              id="support-message"
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describí con el mayor detalle posible qué sucedió, qué problema tuviste o qué duda tenés..."
              required
              className="w-full bg-surface-2 border border-line rounded-control p-3.5 text-ink placeholder:text-ink-3 text-sm focus:outline-none focus:border-accent transition-colors resize-none"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-danger/10 border border-danger/25 rounded-control text-xs text-danger font-medium" role="alert">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Botón de Enviar */}
          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              className="w-full h-12 rounded-control font-bold flex items-center justify-center gap-2 text-sm shadow-md"
            >
              <Send className="size-4" />
              <span>Enviar consulta por Email</span>
            </Button>
          </div>
        </form>

        {/* Enlaces legales */}
        <div className="flex items-center justify-center gap-3 text-xs text-ink-3 pt-3 pb-6 text-center">
          <Link href="/terms" className="hover:text-accent transition-colors hover:underline">
            Términos y Condiciones
          </Link>
          <span>·</span>
          <Link href="/privacy" className="hover:text-accent transition-colors hover:underline">
            Política de Privacidad
          </Link>
        </div>
      </div>
    </main>
  );
}
