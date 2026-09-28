"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ChatList } from './ChatList';
import { LoginRequired } from '@/components/ui/LoginRequired';

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (!isLoading && !user) {
    return <LoginRequired />;
  }

  if (isLoading) return null;

  return (
    <div className="flex w-full h-[100dvh] overflow-hidden">
       <div className="hidden md:block w-80 lg:w-[400px] border-r border-white/10 shrink-0 h-full overflow-y-auto bg-[#0B0D10]">
          <ChatList />
       </div>
       <div className="flex-1 flex flex-col min-w-0 h-full bg-[#0B0D10] relative">
          {children}
       </div>
    </div>
  );
}
