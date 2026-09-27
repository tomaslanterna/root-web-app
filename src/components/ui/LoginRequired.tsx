import { User, Lock } from "lucide-react";
import Link from "next/link";

export function LoginRequired() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-[#0B0D10] text-center p-6 pb-24">
      <div className="w-20 h-20 rounded-full bg-[#D4FF00]/10 flex items-center justify-center mb-6 border border-[#D4FF00]/20">
        <Lock className="w-10 h-10 text-[#D4FF00]" />
      </div>
      <h2 className="text-2xl font-black uppercase tracking-widest text-white mb-3">
        Funcionalidad Bloqueada
      </h2>
      <p className="text-neutral-400 font-medium text-sm max-w-sm mb-8 leading-relaxed">
        Para tener acceso a esta funcionalidad tenés que estar logueado. Dirigite a tu perfil para registrarte o iniciar sesión.
      </p>
      <Link
        href="/profile"
        className="px-8 py-3.5 rounded-full bg-[#D4FF00] text-neutral-950 font-black uppercase tracking-wider text-sm hover:bg-[#bce400] transition-colors active:scale-95"
      >
        Ir a Mi Perfil
      </Link>
    </div>
  );
}
