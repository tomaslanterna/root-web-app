'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/feed');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return null; // Or a loading spinner
  }

  return <>{children}</>;
}
