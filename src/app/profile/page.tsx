"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";
import LoginPage from "@/app/login/page";

export default function ProfileRedirectPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  
  useEffect(() => {
    if (!isLoading && user && user.username) {
      router.replace(`/profile/${user.username}`);
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[100dvh] bg-[#0B0D10]">
        <Loader2 className="w-8 h-8 animate-spin text-[#D4FF00]" />
      </div>
    );
  }

  if (!user) {
    // Show login screen but keeping the current URL (/profile) so BottomNav stays visible
    return <LoginPage />;
  }

  return null;
}
