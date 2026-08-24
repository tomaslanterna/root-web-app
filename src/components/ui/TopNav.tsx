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
    <div className="fixed top-0 left-0 right-0 z-50 h-16 bg-[#0B0D10]/80 backdrop-blur-md border-b border-white/10 flex items-center px-4">
      {showBack && (
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors active:scale-95"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
      )}
      <h1 className={`text-lg font-bold text-white ${showBack ? 'ml-2' : ''}`}>
        {title}
      </h1>
    </div>
  );
}
