"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ProfileSkeleton } from "@/components/profile/ProfileSkeleton";
import LoginPage from "@/app/login/page";
import { skipPageTransition } from "@/lib/navDirection";

export default function ProfileRedirectPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  
  useEffect(() => {
    if (!isLoading && user && user.username) {
      // Es una redirección interna (/profile → /profile/<usuario>): la entrada ya deslizó al llegar a /profile,
      // así que esta no anima. Si no, la pantalla entraba dos veces.
      skipPageTransition(700);
      router.replace(`/profile/${user.username}`);
    }
  }, [isLoading, user, router]);

  if (isLoading || (user && user.username)) {
    return <ProfileSkeleton />;
  }

  if (!user) {
    // Show login screen but keeping the current URL (/profile) so BottomNav stays visible
    return <LoginPage />;
  }

  return null;
}
