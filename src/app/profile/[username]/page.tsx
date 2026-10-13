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
} from "lucide-react";
import { MOCK_POSTS } from "@/lib/mocks";
import { PostCard } from "@/components/ui/PostCard";
import { EventCard } from "@/components/ui/EventCard";
import { CommunityList } from "@/components/communities/CommunityList";
import { DanceStatsWidget } from "@/components/profile/DanceStatsWidget";
import { cn } from "@/lib/utils";
import { usersApi } from "@/services/users";
import { useMutation } from "@/hooks/useMutation";
import { BadgeCollection } from "@/components/profile/BadgeCollection";
import type { AuthUser } from "@/types/auth";
import type { Community } from "@/types/communities";
import type { Event } from "@/types/events";

interface ProfileUser extends AuthUser { followers?: string[]; following?: string[] }

export default function UserProfilePage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const fromSearch = searchParams.get("from") === "search";
  const username = params.username as string;
  const { user: currentUser, isLoading: authLoading } = useAuth();

  const [profileUser, setProfileUser] = useState<ProfileUser | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("Comunidades");

  const [communities, setCommunities] = useState<Community[]>([]);
  const [userEvents, setUserEvents] = useState<Event[]>([]);

  const isMyProfile = Boolean(currentUser?.id && profileUser?.id === currentUser.id);

  useEffect(() => {
    if (!username) return;

    const fetchProfileData = async () => {
      try {
        setIsLoadingProfile(true);
        const data = await usersApi.getUserProfile(username);
        setProfileUser(data.user);
        setIsFollowing(data.isFollowing);
        if (data.user.role === "RRPP") {
          setActiveTab("Posts");
        }

        // Fetch communities and events
        const comms = await usersApi.getUserCommunities(username);
        const evts = await usersApi.getUserEvents(username);
        setCommunities(comms || []);
        setUserEvents(evts || []);
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

  const isRRPP = profileUser.role === "RRPP";
  const tabs = isRRPP
    ? ["Posts", "Comunidades", "Eventos", "Insignias"]
    : ["Comunidades", "Eventos", "Insignias"];

  const userPosts = MOCK_POSTS.filter((p) => p.authorId === profileUser.id);

  const coverUrl =
    "https://images.unsplash.com/photo-1574169208507-84376144848b?q=80&w=2079&auto=format&fit=crop";

  return (
    <div className="profile-modern flex min-h-[100dvh] flex-col bg-[#0B0D10] pb-20 text-white">
      <div className="relative h-48 sm:h-64 w-full bg-neutral-900 border-b border-white/10">
        <Image
          src={coverUrl}
          alt="Cover"
          fill
          unoptimized
          loading="eager"
          sizes="100vw"
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0D10] to-transparent" />

        {/* Espacio reservado superior ya no es necesario aquí porque el header será fixed por fuera del banner */}
      </div>

      {/* Header Fixed Transparente para el Perfil */}
      <header className="fixed top-0 inset-x-0 z-50 mx-auto w-full max-w-md bg-transparent px-4 pb-3 pt-safe-header flex items-center justify-between pointer-events-none md:max-w-[1360px]">
        <div className="flex items-center pointer-events-auto">
          {fromSearch && (
            <button
              onClick={() => router.back()}
              className="p-2.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-colors active:scale-95"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
          )}
        </div>
        
        <div className="pointer-events-auto">
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

      <div className="flex flex-col md:flex-row md:items-end justify-between px-4 md:px-8 -mt-16 sm:-mt-20 md:-mt-24 relative z-10 w-full max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row items-center md:items-end gap-4 md:gap-6">
          <div className="relative shrink-0">
            <div className="w-28 h-28 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full overflow-hidden ring-4 ring-[#0B0D10] shadow-2xl relative bg-neutral-800">
              {profileUser.avatarUrl ? (
                <Image
                  src={profileUser.avatarUrl}
                  alt={profileUser.name}
                  fill
                  unoptimized
                  sizes="(min-width: 768px) 160px, 128px"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-neutral-700 flex items-center justify-center text-3xl md:text-5xl font-bold">
                  {profileUser.name?.charAt(0)}
                </div>
              )}
            </div>
            {profileUser.isKycVerified ? (
              <div className="absolute bottom-1 right-1 md:bottom-2 md:right-2 bg-[#0B0D10] rounded-full p-0.5">
                <BadgeCheck className="w-6 h-6 md:w-8 md:h-8 text-[#0B0D10] fill-[#D4FF00]" />
              </div>
            ) : (
              <div className="absolute bottom-1 right-1 md:bottom-2 md:right-2 p-1.5 bg-amber-500 rounded-full border-4 border-[#0B0D10]">
                <ShieldAlert className="w-4 h-4 md:w-5 md:h-5 text-black" />
              </div>
            )}
          </div>

          <div className="text-center md:text-left mb-2 md:mb-4 space-y-0.5">
            <h1 className="flex items-center justify-center gap-2 text-2xl font-semibold tracking-[-.045em] text-white md:justify-start md:text-4xl">
              {profileUser.name}
            </h1>
            <p className="text-[11px] font-medium uppercase tracking-[.16em] text-neutral-500 md:text-xs">
              @{profileUser.username} •{" "}
              {profileUser.role === "USER" ? "RAVER" : profileUser.role}
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center md:items-end gap-6 mt-6 md:mt-0 mb-2 md:mb-4">
          <div className="flex items-center gap-6 sm:gap-10">
            <div className="text-center md:text-left">
              <p className="text-xl font-semibold tabular-nums tracking-[-.04em] text-white sm:text-2xl md:text-3xl">
                {profileUser.followers?.length || 0}
              </p>
              <p className="text-[9px] font-medium uppercase tracking-[.16em] text-neutral-600 md:text-[10px]">
                Seguidores
              </p>
            </div>
            <div className="text-center md:text-left">
              <p className="text-xl font-semibold tabular-nums tracking-[-.04em] text-white sm:text-2xl md:text-3xl">
                {profileUser.following?.length || 0}
              </p>
              <p className="text-[9px] font-medium uppercase tracking-[.16em] text-neutral-600 md:text-[10px]">
                Seguidos
              </p>
            </div>
          </div>

          {!isMyProfile ? (
            <div className="flex gap-2 w-full md:w-auto">
              <Button
                onClick={toggleFollow}
                disabled={isFollowingLoading || isUnfollowingLoading}
                variant={isFollowing ? "outline" : "primary"}
                className="flex-1 rounded-full px-6 text-xs font-semibold tracking-wide md:flex-none md:py-3"
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
                className="flex-1 rounded-full border-white/20 px-6 text-xs font-semibold tracking-wide md:flex-none md:py-3"
              >
                Mensaje
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full rounded-full border-white/20 px-8 text-xs font-semibold tracking-wide md:w-auto md:py-3"
            >
              Editar
            </Button>
          )}
        </div>
      </div>

      {isMyProfile && !profileUser.isKycVerified && (
        <div className="px-4 pb-4 md:pt-6 w-full max-w-5xl mx-auto">
          <Button
            onClick={() => router.push("/kyc")}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-amber-500/40 bg-amber-500/5 py-6 text-xs font-semibold tracking-wide text-amber-400 transition-colors hover:border-amber-500 hover:bg-amber-500/10"
          >
            <ShieldAlert className="w-4 h-4" />
            Comenzar Validación KYC
          </Button>
        </div>
      )}

      {/* Dance Stats Widget */}
      {isMyProfile && (
        <div className="px-4 pb-4 md:pt-4 w-full max-w-5xl mx-auto">
          <DanceStatsWidget />
        </div>
      )}

      <div className="px-4 mt-6 w-full max-w-5xl mx-auto">
        <div className="liquid-glass-dock rounded-full p-1.5 flex gap-1.5 max-w-md mx-auto md:mx-0">
          <div className="liquid-glass-specular" />
          {tabs.map((tab) => (
            <button
              key={tab}
              role="tab"
              aria-selected={activeTab === tab}
              aria-controls={`profile-tab-${tab}`}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "relative z-10 flex-1 py-2 text-xs md:text-sm font-black uppercase tracking-wider transition-all rounded-full select-none active:scale-95",
                activeTab === tab
                  ? "bg-[#D4FF00] text-neutral-950 shadow-[0_0_15px_rgba(212,255,0,0.35),inset_0_1px_1px_0_rgba(255,255,255,0.4)]"
                  : "text-neutral-400 hover:text-white hover:bg-white/5",
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div id={`profile-tab-${activeTab}`} role="tabpanel" aria-label={activeTab} className="p-4 md:py-8 space-y-4 w-full max-w-5xl mx-auto">
        {activeTab === "Insignias" && <BadgeCollection key={`${username}:${currentUser?.id || "guest"}`} username={username} isOwner={isMyProfile} />}
        {activeTab === "Posts" && (
          <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6">
            {userPosts.length > 0 ? (
              userPosts.map((post) => (
                <PostCard key={post.id} post={post} variant="electronic" />
              ))
            ) : (
              <p className="mt-8 text-center text-sm font-medium text-neutral-500 md:col-span-3">
                No hay posts creados
              </p>
            )}
          </div>
        )}

        {activeTab === "Comunidades" && (
          <div className="space-y-4">
            <CommunityList communities={communities} />
          </div>
        )}

        {activeTab === "Eventos" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {userEvents.map((event) => (
              <EventCard key={event.id} event={event} variant="full" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
