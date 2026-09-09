"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Settings, ShieldAlert, Loader2, ChevronLeft, BadgeCheck } from "lucide-react";
import { MOCK_POSTS, MOCK_EVENTS } from "@/lib/mocks";
import { PostCard } from "@/components/ui/PostCard";
import { EventCard } from "@/components/ui/EventCard";
import { CommunityList } from "@/components/communities/CommunityList";
import { cn } from "@/lib/utils";
import { usersApi } from "@/services/users";
import { useMutation } from "@/hooks/useMutation";

export default function UserProfilePage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const fromSearch = searchParams.get('from') === 'search';
  const username = params.username as string;
  const { user: currentUser, isLoading: authLoading } = useAuth();
  
  const [profileUser, setProfileUser] = useState<any>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("Comunidades");

  const isMyProfile = currentUser?.username === username;

  useEffect(() => {
    if (!username) return;
    
    const fetchProfile = async () => {
      try {
        setIsLoadingProfile(true);
        const data = await usersApi.getUserProfile(username);
        setProfileUser(data.user);
        setIsFollowing(data.isFollowing);
        if (data.user.role === 'RRPP') {
          setActiveTab("Posts"); // Default to Posts for RRPP
        }
      } catch (err) {
        console.error("Error fetching profile", err);
        setError("Usuario no encontrado");
      } finally {
        setIsLoadingProfile(false);
      }
    };
    
    fetchProfile();
  }, [username]);

  const { mutate: followMutate, isLoading: isFollowingLoading } = useMutation(
    async () => {
      await usersApi.followUser(username);
    },
    {
      onSuccess: () => {
        setIsFollowing(true);
        setProfileUser((prev: any) => ({ ...prev, followers: [...(prev.followers || []), currentUser?.id] }));
      }
    }
  );

  const { mutate: unfollowMutate, isLoading: isUnfollowingLoading } = useMutation(
    async () => {
      await usersApi.unfollowUser(username);
    },
    {
      onSuccess: () => {
        setIsFollowing(false);
        setProfileUser((prev: any) => ({
          ...prev, 
          followers: (prev.followers || []).filter((id: string) => id !== currentUser?.id)
        }));
      }
    }
  );

  const toggleFollow = () => {
    if (!currentUser) {
      router.push('/login');
      return;
    }
    if (isFollowing) {
      unfollowMutate({});
    } else {
      followMutate({});
    }
  };

  if (authLoading || isLoadingProfile) {
    return <div className="flex items-center justify-center min-h-[100dvh] bg-[#0B0D10]"><Loader2 className="w-8 h-8 animate-spin text-[#D4FF00]" /></div>;
  }

  if (error || !profileUser) {
    return <div className="flex items-center justify-center min-h-[100dvh] bg-[#0B0D10] text-white"><h2>{error || "Perfil no encontrado"}</h2></div>;
  }
  
  const isRRPP = profileUser.role === 'RRPP';
  const tabs = isRRPP ? ["Posts", "Comunidades", "Eventos"] : ["Comunidades", "Eventos"];

  const userPosts = MOCK_POSTS.filter(p => p.authorId === profileUser.id);
  const userEvents = MOCK_EVENTS.slice(0, 3);
  const coverUrl = "https://images.unsplash.com/photo-1574169208507-84376144848b?q=80&w=2079&auto=format&fit=crop";

  return (
    <div className="flex flex-col min-h-[100dvh] bg-[#0B0D10] text-white pb-20">
      <div className="relative h-48 sm:h-64 w-full bg-neutral-900 border-b border-white/10">
        <img src={coverUrl} alt="Cover" className="w-full h-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0D10] to-transparent" />
        
        {fromSearch && (
          <button 
            onClick={() => router.back()}
            className="absolute top-4 left-4 p-2.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-colors z-20 active:scale-95"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
        )}

        {isMyProfile && (
          <Link href="/settings" className="absolute top-4 right-4 p-2.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-colors z-20 active:scale-95 block">
            <Settings className="w-5 h-5 text-white" />
          </Link>
        )}
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between px-4 md:px-8 -mt-16 sm:-mt-20 md:-mt-24 relative z-10 w-full max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row items-center md:items-end gap-4 md:gap-6">
          <div className="relative shrink-0">
            <div className="w-28 h-28 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full overflow-hidden ring-4 ring-[#0B0D10] shadow-2xl relative bg-neutral-800">
              {profileUser.avatarUrl ? (
                  <img src={profileUser.avatarUrl} alt={profileUser.name} className="w-full h-full object-cover" />
              ) : (
                  <div className="w-full h-full bg-neutral-700 flex items-center justify-center text-3xl md:text-5xl font-bold">{profileUser.name?.charAt(0)}</div>
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
            <h1 className="text-2xl md:text-4xl font-black uppercase tracking-tight text-white flex items-center justify-center md:justify-start gap-2">
              {profileUser.name}
            </h1>
            <p className="text-sm md:text-base text-neutral-400 font-semibold tracking-widest uppercase">
              @{profileUser.username} • {profileUser.role === 'USER' ? 'RAVER' : profileUser.role}
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center md:items-end gap-6 mt-6 md:mt-0 mb-2 md:mb-4">
          <div className="flex items-center gap-6 sm:gap-10">
            <div className="text-center md:text-left">
              <p className="text-xl sm:text-2xl md:text-3xl font-black text-white">{profileUser.followers?.length || 0}</p>
              <p className="text-[10px] md:text-xs uppercase font-bold text-neutral-500 tracking-wider">Seguidores</p>
            </div>
            <div className="text-center md:text-left">
              <p className="text-xl sm:text-2xl md:text-3xl font-black text-white">{profileUser.following?.length || 0}</p>
              <p className="text-[10px] md:text-xs uppercase font-bold text-neutral-500 tracking-wider">Seguidos</p>
            </div>
          </div>
          
          {!isMyProfile ? (
            <div className="flex gap-2 w-full md:w-auto">
              <Button 
                onClick={toggleFollow}
                disabled={isFollowingLoading || isUnfollowingLoading}
                variant={isFollowing ? "outline" : "primary"} 
                className="flex-1 md:flex-none rounded-full px-6 font-bold uppercase tracking-wider text-xs md:py-3"
              >
                {isFollowing ? 'Siguiendo' : 'Seguir'}
              </Button>
              <Button 
                onClick={async () => {
                  try {
                    const data = await usersApi.createDirectChat(profileUser.id);
                    router.push(`/chat/${data.id}`);
                  } catch (err) {
                    console.error("Error creating chat", err);
                  }
                }}
                variant="outline" 
                className="flex-1 md:flex-none rounded-full px-6 font-bold uppercase tracking-wider text-xs border-white/20 md:py-3"
              >
                Mensaje
              </Button>
            </div>
          ) : (
            <Button variant="outline" className="w-full md:w-auto rounded-full px-8 font-bold uppercase tracking-wider text-xs border-white/20 md:py-3">
              Editar
            </Button>
          )}
        </div>
      </div>

      {isMyProfile && !profileUser.isKycVerified && (
        <div className="px-4 pb-4 md:pt-6 w-full max-w-5xl mx-auto">
          <Button 
            onClick={() => router.push('/kyc')}
            className="w-full flex items-center justify-center gap-2 border border-amber-500/50 text-amber-500 bg-amber-500/5 hover:bg-amber-500/10 hover:border-amber-500 transition-colors uppercase text-xs font-bold tracking-wider rounded-xl py-6"
          >
            <ShieldAlert className="w-4 h-4" />
            Comenzar Validación KYC
          </Button>
        </div>
      )}

      <div className="px-4 mt-6 border-b border-white/10 w-full max-w-5xl mx-auto">
        <div className="flex space-x-1 md:space-x-4 p-1">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 md:flex-none md:px-8 py-3 text-xs md:text-sm font-black uppercase tracking-wider transition-all border-b-2 rounded-t-lg hover:bg-white/5",
                activeTab === tab 
                  ? "border-[#D4FF00] text-[#D4FF00]" 
                  : "border-transparent text-neutral-500 hover:text-neutral-300"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 md:py-8 space-y-4 w-full max-w-5xl mx-auto">
        {activeTab === "Posts" && (
          <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6">
            {userPosts.length > 0 ? userPosts.map(post => (
              <PostCard key={post.id} post={post} variant="electronic" />
            )) : (
              <p className="text-center text-neutral-500 text-sm mt-8 uppercase font-bold md:col-span-3">No hay posts creados</p>
            )}
          </div>
        )}

        {activeTab === "Comunidades" && (
          <div className="space-y-4">
            <CommunityList />
          </div>
        )}

        {activeTab === "Eventos" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {userEvents.map(event => (
              <EventCard key={event.id} event={event} variant="full" />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
