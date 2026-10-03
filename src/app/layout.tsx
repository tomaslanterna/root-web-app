import React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/ui/BottomNav";
import { ThemeProvider } from "@/context/ThemeContext";
import { MatchProvider } from "@/context/MatchContext";
import { AuthProvider } from "@/context/AuthContext";
import { DanceProvider } from "@/context/DanceContext";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { CapacitorSetup } from "@/components/CapacitorSetup";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "root | Electronic Music Network",
  description: "Social network and event management for electronic music.",
};

export const viewport: import("next").Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans min-h-[100dvh] bg-[#0B0D10] text-white selection:bg-[#D4FF00] selection:text-neutral-950`}
        suppressHydrationWarning
      >
        <CapacitorSetup />
        <GoogleOAuthProvider clientId={process.env.GOOGLE_CLIENT_ID || ""}>
          <ThemeProvider>
            <AuthProvider>
              <DanceProvider>
              <MatchProvider>
                <div className="flex flex-col min-h-[100dvh] w-full bg-[#0B0D10]">
                  <React.Suspense fallback={null}>
                    <BottomNav />
                  </React.Suspense>
                  
                  {/* Contenedor principal con max-w-[1360px] calibrado para desktop */}
                  <div className="flex-1 flex flex-col min-h-[100dvh] w-full pt-0 md:pt-24 pb-24 md:pb-16 bg-[#0B0D10]">
                    
                    {/* Contenido principal - Ancho óptimo y simétrico en desktop */}
                    <main className="flex-1 w-full min-w-0 max-w-md md:max-w-[1360px] mx-auto px-0 sm:px-4 md:px-8 lg:px-12 border-x border-white/10 md:border-x-0 shadow-2xl md:shadow-none transition-colors duration-300">
                      {children}
                    </main>

                  </div>
                </div>
              </MatchProvider>
              </DanceProvider>
            </AuthProvider>
          </ThemeProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
