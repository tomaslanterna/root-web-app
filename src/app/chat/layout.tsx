"use client";

import { useAuth } from '@/context/AuthContext';
import { ChatList } from './ChatList';
import { LoginRequired } from '@/components/ui/LoginRequired';
import { usePathname } from 'next/navigation';
import { MessageSquare } from 'lucide-react';

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();

  if (!isLoading && !user) {
    return <LoginRequired />;
  }

  if (isLoading) return null;

  return (
    <div className="flex w-full h-[100dvh] overflow-hidden">
       {pathname !== '/chat' && <div className="hidden md:block w-80 lg:w-[400px] border-r border-white/10 shrink-0 h-full overflow-y-auto bg-[#0B0D10]">
          <ChatList />
       </div>}
       <div className={`flex-1 flex flex-col min-w-0 h-full bg-[#0B0D10] relative${pathname === '/chat' ? ' lg:flex-none lg:w-[400px] lg:shrink-0 lg:border-r lg:border-white/10' : ''}`}>
          {children}
       </div>
       {pathname === '/chat' && <div data-dsk className="hidden lg:flex flex-1 min-w-0 h-full flex-col items-center justify-center gap-3 text-center bg-[#0B0D10] px-8">
          <span className="size-14 rounded-2xl bg-surface-2 border border-line flex items-center justify-center text-ink-2">
            <MessageSquare className="size-6" aria-hidden="true" />
          </span>
          <h2 className="m-0 font-display text-2xl">Elegí una conversación</h2>
          <p className="m-0 max-w-xs text-sm text-ink-2">Tus mensajes con amigos y crews aparecen acá.</p>
       </div>}
    </div>
  );
}
