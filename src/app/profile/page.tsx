"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

export default function ProfileRedirectPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  
  useEffect(() => {
    if (!isLoading) {
      if (user && user.username) {
        router.replace(`/profile/${user.username}`);
      } else {
        router.replace('/login');
      }
    }
  }, [isLoading, user, router]);

  return (
    <div className="flex items-center justify-center min-h-[100dvh] bg-[#0B0D10]">
      <Loader2 className="w-8 h-8 animate-spin text-[#D4FF00]" />
    </div>
  );
}
