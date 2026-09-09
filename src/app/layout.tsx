import React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/ui/BottomNav";
import { ThemeProvider } from "@/context/ThemeContext";
import { MatchProvider } from "@/context/MatchContext";
import { AuthProvider } from "@/context/AuthContext";
import { GoogleOAuthProvider } from "@react-oauth/google";

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
        <GoogleOAuthProvider clientId={process.env.GOOGLE_CLIENT_ID || ""}>
          <ThemeProvider>
            <AuthProvider>
              <MatchProvider>
                <div className="flex min-h-[100dvh] w-full">
                  <React.Suspense fallback={null}>
                    <BottomNav />
                  </React.Suspense>
                  
                  {/* Contenedor principal con padding izquierdo para el sidebar en desktop */}
                  <div className="flex-1 flex min-h-[100dvh] w-full md:pl-64 bg-[#0B0D10]">
                    
                    {/* Columna central (Feed) - Ocupa el 100% del espacio de forma segura sin overflow */}
                    <main className="flex-1 w-full min-w-0 max-w-md md:max-w-none min-h-[100dvh] pb-24 md:pb-0 md:px-12 border-x border-white/10 shadow-2xl md:shadow-none transition-colors duration-300">
                      {children}
                    </main>

                  </div>
                </div>
              </MatchProvider>
            </AuthProvider>
          </ThemeProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
