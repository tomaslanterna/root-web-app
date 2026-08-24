'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { TopNav } from '@/components/ui/TopNav';
import { useAuth } from '@/context/AuthContext';
import { LogOut, ChevronRight } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <main className="min-h-screen bg-[#0B0D10] text-white flex flex-col pb-20">
      <TopNav title="Configuración" showBack={true} />

      <div className="flex-1 mt-20 px-4">
        <div className="bg-[#14171F]/80 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors active:bg-white/10"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/10 rounded-xl">
                <LogOut className="w-5 h-5 text-red-500" />
              </div>
              <span className="font-semibold text-red-500">Cerrar sesión</span>
            </div>
            <ChevronRight className="w-5 h-5 text-neutral-500" />
          </button>
        </div>
      </div>
    </main>
  );
}
