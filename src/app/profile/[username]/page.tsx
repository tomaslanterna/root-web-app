"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import {
  Settings,
  ShieldAlert,
  Loader2,
  ChevronLeft,
  BadgeCheck,
  Grid3X3,
  Award,
} from "lucide-react";
import { MOCK_POSTS } from "@/lib/mocks";
import { DanceStatsWidget } from "@/components/profile/DanceStatsWidget";
import { cn, isValidImageUrl } from "@/lib/utils";
import { api } from "@/lib/api";
import { usersApi } from "@/services/users";
import { useMutation } from "@/hooks/useMutation";
import { BadgeCollection } from "@/components/profile/BadgeCollection";
import { ProfilePostsGrid } from "@/components/profile/ProfilePostsGrid";
import type { AuthUser } from "@/types/auth";
import type { Post } from "@/types/posts";

interface ProfileUser extends AuthUser { followers?: string[]; following?: string[] }

export default function UserProfilePage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const fromSearch = searchParams.get("from") === "search";
  const fromCommunities = searchParams.get("from") === "communities";
  const requestedReturnTo = searchParams.get("returnTo");
  const communityReturnTo =
    requestedReturnTo?.startsWith("/") && !requestedReturnTo.startsWith("//")
      ? requestedReturnTo
      : "/communities";
  const username = params.username as string;
  const { user: currentUser, isLoading: authLoading } = useAuth();

  const [profileUser, setProfileUser] = useState<ProfileUser | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("Posts");

  const [userPosts, setUserPosts] = useState<Post[]>([]);

  const isMyProfile = Boolean(currentUser?.id && profileUser?.id === currentUser.id);

  const handlePostCreated = (newPost: Post) => {
    setUserPosts((prev) => {
      const updated = [newPost, ...prev];
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(`root_user_posts_${username}`, JSON.stringify(updated));
        } catch (e) {
          console.error("Error storing post in localStorage", e);
        }
      }
      return updated;
    });
  };

  useEffect(() => {
    if (!username) return;

    const fetchProfileData = async () => {
      try {
        setIsLoadingProfile(true);
        const data = await usersApi.getUserProfile(username);
        setProfileUser(data.user);
        setIsFollowing(data.isFollowing);

        // 1. Obtener posts del backend (con UUID real y URL firmada de S3)
        let backendUserPosts: Post[] = [];
        try {
          const { data: feedData } = await api.get("/v1/posts?include_feeds=global");
          const globalPosts: Post[] = feedData?.global?.data || [];
          backendUserPosts = globalPosts.filter(
            (p) =>
              p.authorId === data.user.id ||
              p.authorName?.toLowerCase() === username.toLowerCase(),
          );
        } catch (feedErr) {
          console.warn("No se pudieron cargar posts del backend:", feedErr);
        }

        // 2. Cargar posts locales descartando posts con key cruda ya sincronizados
        let storedPosts: Post[] = [];
        if (typeof window !== "undefined") {
          try {
            const raw = localStorage.getItem(`root_user_posts_${username}`);
            if (raw) {
              const parsed: Post[] = JSON.parse(raw);
              storedPosts = parsed.filter((s) => {
                // Si ya existe en backend o tiene key cruda y coincide en contenido, usar la versión del backend
                if (backendUserPosts.some((b) => b.id === s.id || (b.content && b.content === s.content))) {
                  return false;
                }
                return true;
              });
            }
          } catch (e) {
            console.error("Error loading stored posts", e);
          }
        }

        const initialMockPosts = MOCK_POSTS.filter(
          (p) =>
            p.authorId === data.user.id ||
            p.authorName?.toLowerCase() === username.toLowerCase(),
        );

        const combinedPosts = [
          ...backendUserPosts,
          ...storedPosts,
          ...initialMockPosts.filter(
            (m) =>
              !backendUserPosts.some((b) => b.id === m.id) &&
              !storedPosts.some((s) => s.id === m.id),
          ),
        ];

        setUserPosts(combinedPosts);
      } catch (err) {
        console.error("Error fetching profile", err);
        setError("Usuario no encontrado");
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchProfileData();
  }, [username]);

  const { mutate: followMutate, isLoading: isFollowingLoading } = useMutation(
    async () => {
      await usersApi.followUser(username);
    },
    {
      onSuccess: () => {
        setIsFollowing(true);
        setProfileUser((prev) => prev ? ({
          ...prev,
          followers: [...(prev.followers || []), ...(currentUser ? [currentUser.id] : [])],
        }) : prev);
      },
    },
  );

  const { mutate: unfollowMutate, isLoading: isUnfollowingLoading } =
    useMutation(
      async () => {
        await usersApi.unfollowUser(username);
      },
      {
        onSuccess: () => {
          setIsFollowing(false);
          setProfileUser((prev) => prev ? ({
            ...prev,
            followers: (prev.followers || []).filter(
              (id: string) => id !== currentUser?.id,
            ),
          }) : prev);
        },
      },
    );

  const toggleFollow = () => {
    if (!currentUser) {
      router.push("/login");
      return;
    }
    if (isFollowing) {
      unfollowMutate({});
    } else {
      followMutate({});
    }
  };

  const handleProfileBack = () => {
    if (fromCommunities) {
      router.replace(communityReturnTo);
      return;
    }
    router.back();
  };

  if (authLoading || isLoadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-[100dvh] bg-[#0B0D10]">
        <Loader2 className="w-8 h-8 animate-spin text-[#D4FF00]" />
      </div>
    );
  }

  if (error || !profileUser) {
    return (
      <div className="flex items-center justify-center min-h-[100dvh] bg-[#0B0D10] text-white">
        <h2>{error || "Perfil no encontrado"}</h2>
      </div>
    );
  }

  const tabs = [
    { id: "Posts", icon: Grid3X3, label: "Publicaciones" },
    { id: "Insignias", icon: Award, label: "Insignias" },
  ];

  return (
    <div className="profile-modern flex min-h-[100dvh] flex-col bg-[#0B0D10] pb-20 text-white">
      {/* Fila superior para el botón de volver y el icono de ajustes (en flujo normal para no superponerse con la info) */}
      <header className="w-full max-w-5xl mx-auto px-4 pt-safe-header pb-2 flex items-center justify-between">
        <div className="flex items-center">
          {(fromSearch || fromCommunities) && (
            <button
              type="button"
              onClick={handleProfileBack}
              aria-label={fromCommunities ? "Volver a la comunidad" : "Volver"}
              className="p-2.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-colors active:scale-95"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
          )}
        </div>
        <div className="flex items-center">
          {isMyProfile && (
            <Link
              href="/settings"
              className="p-2.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-colors active:scale-95 block"
            >
              <Settings className="w-5 h-5 text-white" />
            </Link>
          )}
        </div>
      </header>

      {/* Información de perfil en la fila de abajo (símil Instagram, sin cover ni recuadro) */}
      <div className="px-4 pt-1 pb-2 relative z-10 w-full max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 sm:gap-5 min-w-0">
            {/* Avatar a la izquierda */}
            <div className="relative shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden ring-2 ring-white/10 relative bg-neutral-800">
                {isValidImageUrl(profileUser.avatarUrl) ? (
                  <Image
                    src={profileUser.avatarUrl.trim()}
                    alt={profileUser.name}
                    fill
                    unoptimized
                    sizes="(min-width: 768px) 96px, 80px"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-neutral-700 flex items-center justify-center text-xl sm:text-2xl font-bold">
                    {profileUser.name?.charAt(0)}
                  </div>
                )}
              </div>
              {profileUser.isKycVerified ? (
                <div className="absolute -bottom-0.5 -right-0.5 bg-[#0B0D10] rounded-full p-0.5 shadow">
                  <BadgeCheck className="w-4 h-4 sm:w-5 sm:h-5 text-[#0B0D10] fill-[#D4FF00]" />
                </div>
              ) : (
                <div className="absolute -bottom-0.5 -right-0.5 p-1 bg-amber-500 rounded-full border-2 border-[#0B0D10] shadow">
                  <ShieldAlert className="w-3 h-3 text-black" />
                </div>
              )}
            </div>

            {/* A la derecha: nombre, alias y rol debajo, y seguidores/seguidos debajo de eso */}
            <div className="flex-1 min-w-0 space-y-1">
              <h1 className="text-base sm:text-xl md:text-2xl font-semibold tracking-[-.03em] text-white truncate">
                {profileUser.name}
              </h1>
              <p className="tech-label text-neutral-400 text-xs truncate">
                @{profileUser.username}{" "}
                <span className="text-neutral-600">•</span>{" "}
                {profileUser.role === "USER" ? "RAVER" : profileUser.role}
              </p>

              {/* Seguidores y Seguidos debajo */}
              <div className="flex items-center gap-5 pt-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="num-display text-sm sm:text-base text-white">
                    {profileUser.followers?.length || 0}
                  </span>
                  <span className="tech-label text-neutral-400 text-[11px] sm:text-xs">
                    Seguidores
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="num-display text-sm sm:text-base text-white">
                    {profileUser.following?.length || 0}
                  </span>
                  <span className="tech-label text-neutral-400 text-[11px] sm:text-xs">
                    Seguidos
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Botones de acción si no es mi perfil */}
          {!isMyProfile && (
            <div className="flex sm:flex-col md:flex-row gap-2 shrink-0 w-full sm:w-auto pt-1 sm:pt-0">
              <Button
                onClick={toggleFollow}
                disabled={isFollowingLoading || isUnfollowingLoading}
                variant={isFollowing ? "outline" : "primary"}
                className="flex-1 sm:flex-none rounded-full px-5 py-2 text-xs font-semibold tracking-wide"
              >
                {isFollowing ? "Siguiendo" : "Seguir"}
              </Button>
              <Button
                onClick={async () => {
                  try {
                    const data = await usersApi.createDirectChat(
                      profileUser.id,
                    );
                    router.push(`/chat/${data.id}`);
                  } catch (err) {
                    console.error("Error creating chat", err);
                  }
                }}
                variant="outline"
                className="flex-1 sm:flex-none rounded-full border-white/20 px-5 py-2 text-xs font-semibold tracking-wide"
              >
                Mensaje
              </Button>
            </div>
          )}
        </div>
      </div>

      {isMyProfile && !profileUser.isKycVerified && (
        <div className="px-4 pt-3 w-full max-w-5xl mx-auto">
          <Button
            onClick={() => router.push("/kyc")}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-amber-500/40 bg-amber-500/5 py-3 text-xs font-semibold tracking-wide text-amber-400 transition-colors hover:border-amber-500 hover:bg-amber-500/10"
          >
            <ShieldAlert className="w-4 h-4" />
            Comenzar Validación de Identidad
          </Button>
        </div>
      )}

      {/* Dance Stats Widget */}
      {isMyProfile && (
        <div className="px-4 pt-3 w-full max-w-5xl mx-auto">
          <DanceStatsWidget />
        </div>
      )}

      {/* Tab Navigation estilo Instagram: solo iconos, sin contenedor visible, con línea horizontal inferior */}
      <div className="mt-4 w-full max-w-5xl mx-auto">
        <div className="flex w-full items-center justify-around" role="tablist">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                aria-controls={`profile-tab-${tab.id}`}
                aria-label={tab.label}
                title={tab.label}
                onClick={() => setActiveTab(tab.id)}
                className="relative flex-1 flex flex-col items-center justify-center py-3.5 sm:py-4 transition-colors group select-none cursor-pointer"
              >
                <Icon
                  className={cn(
                    "w-6 h-6 sm:w-7 sm:h-7 transition-all duration-200",
                    isActive
                      ? "text-[#D4FF00] scale-105"
                      : "text-neutral-500 group-hover:text-neutral-300",
                  )}
                  strokeWidth={isActive ? 2.25 : 1.75}
                />
                {isActive && (
                  <span className="absolute bottom-0 inset-x-0 h-[2.5px] bg-[#D4FF00]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div id={`profile-tab-${activeTab}`} role="tabpanel" aria-label={activeTab} className="p-4 md:py-8 space-y-4 w-full max-w-5xl mx-auto">
        {activeTab === "Insignias" && <BadgeCollection key={`${username}:${currentUser?.id || "guest"}`} username={username} isOwner={isMyProfile} />}
        {activeTab === "Posts" && (
          <ProfilePostsGrid
            posts={userPosts}
            isMyProfile={isMyProfile}
            onPostCreated={handlePostCreated}
          />
        )}
      </div>
    </div>
  );
}
