"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Camera, FileCheck, ShieldCheck, Upload, ShieldAlert, Sparkles, Moon, Sun, Palette } from "lucide-react";
import { MOCK_USERS } from "@/lib/mocks";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const [step, setStep] = useState<"initial" | "face" | "document" | "success">("initial");
  const { theme, setTheme } = useTheme();
  const user = MOCK_USERS[2]; // Santi User (not verified)

  if (step === "face") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 space-y-8 bg-[#0B0D10] text-white">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black uppercase tracking-tight text-white">Escaner Facial</h2>
          <p className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">Alinea tu rostro en el centro</p>
        </div>
        <div className="relative w-64 h-64 rounded-full border-4 border-[#D4FF00]/40 flex items-center justify-center overflow-hidden bg-white/5 backdrop-blur-xl">
          <Camera className="w-12 h-12 text-[#D4FF00]" />
          <div className="absolute inset-0 border-[12px] border-[#D4FF00] rounded-full animate-pulse" />
        </div>
        <Button variant="primary" className="w-full" onClick={() => setStep("document")}>Escanear Rostro</Button>
      </div>
    );
  }

  if (step === "document") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 space-y-6 bg-[#0B0D10] text-white">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black uppercase tracking-tight">Verificación Documental</h2>
          <p className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">Sube fotos legibles de tu DNI</p>
        </div>
        <div className="w-full aspect-[1.586/1] border-2 border-dashed border-white/20 rounded-3xl flex flex-col items-center justify-center bg-[#14171F] gap-2 hover:bg-white/10 transition-colors cursor-pointer">
          <Upload className="w-8 h-8 text-[#D4FF00]" />
          <p className="text-xs font-bold uppercase tracking-wider text-neutral-300">Frente del DNI</p>
        </div>
        <div className="w-full aspect-[1.586/1] border-2 border-dashed border-white/20 rounded-3xl flex flex-col items-center justify-center bg-[#14171F] gap-2 hover:bg-white/10 transition-colors cursor-pointer">
          <Upload className="w-8 h-8 text-[#D4FF00]" />
          <p className="text-xs font-bold uppercase tracking-wider text-neutral-300">Dorso del DNI</p>
        </div>
        <Button variant="primary" className="w-full" onClick={() => setStep("success")}>Subir Documentación</Button>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 space-y-4 text-center bg-[#0B0D10] text-white">
        <ShieldCheck className="w-16 h-16 text-[#D4FF00]" />
        <h2 className="text-2xl font-black uppercase tracking-tight">Verificación Recibida</h2>
        <p className="text-xs text-neutral-400 font-semibold uppercase tracking-wider max-w-xs">
          Revisaremos tu documentación en un plazo máximo de 24hs.
        </p>
        <Button variant="primary" className="mt-8 text-neutral-950" onClick={() => setStep("initial")}>
          Volver a Perfil
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#0B0D10] text-white pb-28">
      {/* Header card with dark glass overlay */}
      <div className="m-4 p-6 rounded-3xl glass-obsidian text-white flex flex-col items-center space-y-4 shadow-xl relative overflow-hidden border border-white/10">
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-[#D4FF00]/10 rounded-full blur-3xl pointer-events-none" />
        <Avatar src={user.avatarUrl} fallback={user.name} size="lg" className="ring-4 ring-[#D4FF00]/40 shadow-md" />
        <div className="text-center space-y-1">
          <h1 className="text-lg font-black uppercase tracking-tight text-white">{user.name}</h1>
          <p className="text-xs text-neutral-400 font-semibold tracking-wider">@{user.username}</p>
        </div>

        {!user.isKycVerified ? (
          <div className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-extrabold uppercase tracking-widest flex items-center gap-1.5 backdrop-blur-sm">
            <ShieldAlert className="w-3.5 h-3.5" /> No Verificado
          </div>
        ) : (
          <div className="px-3 py-1 rounded-full bg-[#D4FF00]/20 text-[#D4FF00] border border-[#D4FF00]/30 text-[10px] font-extrabold uppercase tracking-widest flex items-center gap-1.5 backdrop-blur-sm">
            <ShieldCheck className="w-3.5 h-3.5" /> Verificado
          </div>
        )}
      </div>

      <div className="px-4 space-y-4">
        {/* Theme Selector Component */}
        <Card className="rounded-3xl border-white/10 bg-[#14171F] shadow-lg">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Palette className="w-5 h-5 text-[#D4FF00]" />
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-white">Apariencia Visual</h3>
                  <p className="text-[10px] text-neutral-400 font-medium">Selecciona el tema de la aplicación</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 p-1 bg-[#0B0D10] rounded-2xl border border-white/10">
              <button
                onClick={() => setTheme("dark")}
                className={cn(
                  "flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all select-none",
                  theme === "dark"
                    ? "bg-[#D4FF00] text-neutral-950 shadow-md scale-[1.02]"
                    : "text-neutral-400 hover:text-white"
                )}
              >
                <Moon className="w-4 h-4" />
                <span>Oscuro</span>
              </button>

              <button
                onClick={() => setTheme("light")}
                className={cn(
                  "flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all select-none",
                  theme === "light"
                    ? "bg-[#D4FF00] text-neutral-950 shadow-md scale-[1.02]"
                    : "text-neutral-400 hover:text-white"
                )}
              >
                <Sun className="w-4 h-4" />
                <span>Claro</span>
              </button>
            </div>
          </CardContent>
        </Card>

        {!user.isKycVerified && (
          <Card className="rounded-3xl border-white/10 bg-[#14171F] shadow-lg">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-[#D4FF00] text-neutral-950">
                  <FileCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-white">Verifica tu Identidad (KYC)</h3>
                  <p className="text-[11px] text-neutral-400 font-medium">Requerido para la compraventa segura de entradas en reventa.</p>
                </div>
              </div>
              <Button variant="primary" size="sm" className="w-full" onClick={() => setStep("face")}>
                Comenzar Verificación
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400 px-1 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#D4FF00]" /> Actividad Reciente
          </h3>
          <div className="py-12 text-center bg-[#14171F] rounded-3xl border border-white/10 p-6">
            <p className="text-xs text-neutral-400 font-bold uppercase tracking-wider">No hay actividad registrada</p>
          </div>
        </div>
      </div>
    </div>
  );
}




function AlertTriangle(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}
