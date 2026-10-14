import React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

interface TopNavProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export function TopNav({ title, showBack = true, onBack, rightAction }: TopNavProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-[calc(4rem+env(safe-area-inset-top,0px))] pt-[env(safe-area-inset-top,0px)] liquid-glass-bar border-t-0 flex items-center justify-between px-4 overflow-hidden">
      <div className="liquid-glass-specular" />
      <div className="flex items-center min-w-0">
        {showBack && (
          <button
            onClick={handleBack}
            className="relative z-10 p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors active:scale-95 shrink-0"
            aria-label="Volver"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
        )}
        <h1 className={`relative z-10 text-lg font-bold text-white truncate ${showBack ? 'ml-2' : ''}`}>
          {title}
        </h1>
      </div>
      {rightAction && (
        <div className="relative z-10 shrink-0 ml-3">
          {rightAction}
        </div>
      )}
    </div>
  );
}
