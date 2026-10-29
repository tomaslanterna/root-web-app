"use client";

import React, { useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Capacitor } from "@capacitor/core";
import { Flame, ExternalLink } from "lucide-react";

export default function OpenDeepLinkBridgePage() {
  const params = useParams<{ slug?: string[] | string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const rawSlug = Array.isArray(params?.slug)
    ? params.slug.join("/")
    : typeof params?.slug === "string"
      ? params.slug
      : "";
  const queryString = searchParams.toString();
  const internalPath = `/${rawSlug.replace(/^\/+/, "")}${queryString ? `?${queryString}` : ""}`;
  const nativeDeepLink = `root://${rawSlug.replace(/^\/+/, "")}${queryString ? `?${queryString}` : ""}`;

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      router.replace(internalPath || "/feed");
      return;
    }

    // En navegador móvil, disparar automáticamente el esquema nativo root://
    window.location.href = nativeDeepLink;
  }, [internalPath, nativeDeepLink, router]);

  return (
    <div className="min-h-[100dvh] bg-[#0B0D10] text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="w-full max-w-sm rounded-3xl bg-[#111114] p-6 shadow-2xl space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-[#D4FF00] text-neutral-950 mx-auto flex items-center justify-center shadow-[0_8px_24px_rgba(212,255,0,0.25)]">
          <Flame className="w-7 h-7 fill-neutral-950" />
        </div>

        <div className="space-y-1.5">
          <h1 className="text-lg font-black uppercase tracking-wider text-white">
            Abriendo en Root...
          </h1>
          <p className="text-xs text-neutral-400 font-medium leading-relaxed">
            Si la aplicación no se abre automáticamente, tocá el botón de abajo.
          </p>
        </div>

        <div className="space-y-2.5 pt-1">
          <a
            href={nativeDeepLink}
            className="w-full py-3 px-5 rounded-full bg-[#D4FF00] hover:bg-[#c2eb00] text-neutral-950 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(212,255,0,0.2)] transition-all"
          >
            <ExternalLink className="w-4 h-4" /> Abrir en la App
          </a>

          <button
            type="button"
            onClick={() => router.replace(internalPath || "/feed")}
            className="w-full py-2.5 px-5 rounded-full bg-white/5 hover:bg-white/10 text-neutral-300 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            Continuar en el navegador
          </button>
        </div>
      </div>
    </div>
  );
}
