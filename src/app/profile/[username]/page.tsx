"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Award, ChevronLeft, ChevronRight, Grid3X3, Loader2, Settings, ShieldCheck } from "lucide-react";
import { MOCK_POSTS } from "@/lib/mocks";
import { DanceStatsWidget } from "@/components/profile/DanceStatsWidget";
import { cn, copyTextToClipboard, isValidImageUrl } from "@/lib/utils";
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
  const [shareCopied, setShareCopied] = useState(false);

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
      <div className="flex items-center justify-center min-h-[100dvh] bg-bg">
        <Loader2 className="size-8 animate-spin text-accent" aria-label="Cargando perfil" />
      </div>
    );
  }

  if (error || !profileUser) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 min-h-[100dvh] bg-bg text-ink p-6 text-center">
        <h2 className="m-0 text-lg font-semibold">{error || "Perfil no encontrado"}</h2>
        <Button variant="secondary" onClick={() => router.back()}>Volver</Button>
      </div>
    );
  }

  const tabs = [
    { id: "Posts", label: "Posts", icon: Grid3X3 },
    { id: "Insignias", label: "Insignias", icon: Award },
  ];

  const roleLabel = profileUser.role === "USER" ? "Raver" : profileUser.role;
  const squareButton =
    "size-11 shrink-0 rounded-control bg-surface border border-line flex items-center justify-center hover:bg-surface-2 transition-colors focus-visible:outline-2 focus-visible:outline-accent";
  const actionButton =
    "h-11 rounded-xl bg-surface-2 border border-line-strong text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-[#23272D] transition-colors focus-visible:outline-2 focus-visible:outline-accent";

  const shareProfile = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: `@${profileUser.username} en root`, url });
        return;
      } catch {
        // Si se cancela, se copia el enlace.
      }
    }
    if (await copyTextToClipboard(url)) {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-bg pb-[calc(var(--root-mobile-nav-clearance)+1rem)] text-ink md:pb-16">
      <header className="w-full max-w-3xl mx-auto px-4 pt-[calc(0.75rem+var(--root-safe-top))] md:pt-6 flex items-center gap-3">
        {(fromSearch || fromCommunities) && (
          <button
            type="button"
            onClick={handleProfileBack}
            aria-label={fromCommunities ? "Volver a la comunidad" : "Volver"}
            className={squareButton}
          >
            <ChevronLeft className="size-[22px]" aria-hidden="true" />
          </button>
        )}
        <span className="flex-1 min-w-0 text-[17px] font-semibold truncate">@{profileUser.username}</span>
        {isMyProfile && (
          <Link href="/settings" aria-label="Configuración" className={squareButton}>
            <Settings className="size-5" aria-hidden="true" />
          </Link>
        )}
      </header>

      <div className="w-full max-w-3xl mx-auto px-4 pt-5 flex items-center gap-[18px]">
        <div
          className={cn(
            "relative size-[88px] shrink-0 rounded-full overflow-hidden bg-surface-2",
            isMyProfile && "ring-2 ring-accent ring-offset-[3px] ring-offset-bg",
          )}
        >
          {isValidImageUrl(profileUser.avatarUrl) ? (
            <Image
              src={profileUser.avatarUrl.trim()}
              alt=""
              fill
              unoptimized
              sizes="88px"
              className="object-cover"
            />
          ) : (
            <span className="size-full flex items-center justify-center text-2xl font-semibold">
              {profileUser.name?.charAt(0)}
            </span>
          )}
        </div>

        <div className="min-w-0 flex flex-col gap-2">
          <div className="flex flex-col gap-1">
            <h1 className="m-0 text-[22px] font-bold truncate">{profileUser.name}</h1>
            <span className="flex flex-wrap gap-1.5">
              <span className="label-mono px-2 py-1 rounded-full bg-surface-2 text-ink-2">{roleLabel}</span>
              {profileUser.isKycVerified ? (
                <span className="label-mono px-2 py-1 rounded-full bg-info/12 text-info">Verificado</span>
              ) : (
                <span className="label-mono px-2 py-1 rounded-full bg-surface-2 text-ink-3">Sin verificar</span>
              )}
            </span>
          </div>
          <div className="flex gap-[18px] text-sm text-ink-2">
            <span>
              <span className="num-mono text-base font-semibold text-ink">{profileUser.followers?.length || 0}</span> seguidores
            </span>
            <span>
              <span className="num-mono text-base font-semibold text-ink">{profileUser.following?.length || 0}</span> seguidos
            </span>
          </div>
        </div>
      </div>

      <div className="w-full max-w-3xl mx-auto px-4 pt-4 grid grid-cols-2 gap-2">
        {isMyProfile ? (
          <>
            <Link href="/settings" className={actionButton}>Configuración</Link>
            <button type="button" onClick={() => void shareProfile()} className={actionButton}>
              {shareCopied ? "Enlace copiado" : "Compartir perfil"}
            </button>
          </>
        ) : (
          <>
            <Button
              onClick={toggleFollow}
              disabled={isFollowingLoading || isUnfollowingLoading}
              variant={isFollowing ? "secondary" : "primary"}
              aria-pressed={isFollowing}
              className="h-11 rounded-xl text-sm"
            >
              {isFollowing ? "Siguiendo" : "Seguir"}
            </Button>
            <button
              type="button"
              onClick={async () => {
                try {
                  const data = await usersApi.createDirectChat(profileUser.id);
                  router.push(`/chat/${data.id}`);
                } catch (err) {
                  console.error("Error creating chat", err);
                }
              }}
              className={actionButton}
            >
              Mensaje
            </button>
          </>
        )}
      </div>

      {isMyProfile && !profileUser.isKycVerified && (
        <div className="w-full max-w-3xl mx-auto px-4 pt-3">
          <Link
            href="/kyc"
            className="p-3.5 rounded-card bg-surface border border-dashed border-info/45 flex items-center gap-3 hover:bg-surface-2 transition-colors"
          >
            <span className="size-10 shrink-0 rounded-xl bg-info/12 text-info flex items-center justify-center">
              <ShieldCheck className="size-5" aria-hidden="true" />
            </span>
            <span className="flex-1 min-w-0 flex flex-col gap-0.5">
              <span className="text-[15px] font-semibold">Verificá tu identidad</span>
              <span className="text-[13px] text-ink-2">Necesario para entrar a crews verificadas</span>
            </span>
            <ChevronRight className="size-5 text-ink-2 shrink-0" aria-hidden="true" />
          </Link>
        </div>
      )}

      {isMyProfile && (
        <div className="w-full max-w-3xl mx-auto px-4 pt-5">
          <DanceStatsWidget />
        </div>
      )}

      <div className="mt-6 w-full max-w-3xl mx-auto">
        <div role="tablist" aria-label="Contenido del perfil" className="flex border-b border-line">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-label={tab.label}
                aria-selected={isActive}
                aria-controls={`profile-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 h-12 flex items-center justify-center transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent",
                  isActive ? "text-accent shadow-[inset_0_-2px_0_var(--color-accent)]" : "text-ink-3 hover:text-ink-2",
                )}
              >
                <Icon className="size-5" aria-hidden="true" />
              </button>
            );
          })}
        </div>
      </div>

      <div id={`profile-tab-${activeTab}`} role="tabpanel" aria-label={activeTab} className="w-full max-w-3xl mx-auto pt-0.5 md:px-4 md:pt-4">
        {activeTab === "Insignias" && (
          <div className="px-4 pt-5 md:px-0">
            <BadgeCollection key={`${username}:${currentUser?.id || "guest"}`} username={username} isOwner={isMyProfile} />
          </div>
        )}
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
