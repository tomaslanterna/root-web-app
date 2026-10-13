import React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

interface TopNavProps {
  title: string;
  showBack?: boolean;
}

export function TopNav({ title, showBack = true }: TopNavProps) {
  const router = useRouter();

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-[calc(4rem+env(safe-area-inset-top,0px))] pt-[env(safe-area-inset-top,0px)] liquid-glass-bar border-t-0 flex items-center px-4 overflow-hidden">
      <div className="liquid-glass-specular" />
      {showBack && (
        <button
          onClick={() => router.back()}
          className="relative z-10 p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors active:scale-95"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
      )}
      <h1 className={`relative z-10 text-lg font-bold text-white ${showBack ? 'ml-2' : ''}`}>
        {title}
      </h1>
    </div>
  );
}
