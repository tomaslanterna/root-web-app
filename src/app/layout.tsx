import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/ui/BottomNav";
import { ThemeProvider } from "@/context/ThemeContext";
import { MatchProvider } from "@/context/MatchContext";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans min-h-[100dvh] bg-[#0B0D10] text-white selection:bg-[#D4FF00] selection:text-neutral-950`}
      >
        <ThemeProvider>
          <MatchProvider>
            <main className="max-w-md mx-auto min-h-[100dvh] pb-24 border-x border-white/10 shadow-2xl transition-colors duration-300">
              {children}
            </main>
            <BottomNav />
          </MatchProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}


