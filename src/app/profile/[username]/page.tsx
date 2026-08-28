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
import { api } from "@/lib/api";
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
        const res = await api.get(`/v1/users/${username}`);
        setProfileUser(res.data.user);
        setIsFollowing(res.data.isFollowing);
        if (res.data.user.role === 'RRPP') {
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
      await api.post(`/v1/users/${username}/follow`);
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
      await api.delete(`/v1/users/${username}/follow`);
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

      <div className="px-4 -mt-16 sm:-mt-20 relative z-10 flex flex-col items-center">
        <div className="relative">
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden ring-4 ring-[#0B0D10] shadow-2xl relative bg-neutral-800">
            {profileUser.avatarUrl ? (
                <img src={profileUser.avatarUrl} alt={profileUser.name} className="w-full h-full object-cover" />
            ) : (
                <div className="w-full h-full bg-neutral-700 flex items-center justify-center text-3xl font-bold">{profileUser.name?.charAt(0)}</div>
            )}
          </div>
          {profileUser.isKycVerified ? (
            <div className="absolute bottom-1 right-1 bg-[#0B0D10] rounded-full p-0.5">
              <BadgeCheck className="w-6 h-6 text-[#0B0D10] fill-[#D4FF00]" />
            </div>
          ) : (
             <div className="absolute bottom-1 right-1 p-1.5 bg-amber-500 rounded-full border-4 border-[#0B0D10]">
              <ShieldAlert className="w-4 h-4 text-black" />
            </div>
          )}
        </div>
        
        <div className="text-center mt-3 space-y-0.5">
          <h1 className="text-2xl font-black uppercase tracking-tight text-white flex items-center justify-center gap-2">
            {profileUser.name}
          </h1>
          <p className="text-sm text-neutral-400 font-semibold tracking-widest uppercase">
            @{profileUser.username} • {profileUser.role === 'USER' ? 'RAVER' : profileUser.role}
          </p>
        </div>
      </div>

      <div className="px-6 py-6 flex items-center justify-between max-w-md mx-auto w-full">
        <div className="flex items-center gap-6 sm:gap-10">
          <div className="text-center">
            <p className="text-xl sm:text-2xl font-black text-white">{profileUser.followers?.length || 0}</p>
            <p className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Seguidores</p>
          </div>
          <div className="text-center">
            <p className="text-xl sm:text-2xl font-black text-white">{profileUser.following?.length || 0}</p>
            <p className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Seguidos</p>
          </div>
        </div>
        
        {!isMyProfile ? (
          <div className="flex gap-2">
            <Button 
              onClick={toggleFollow}
              disabled={isFollowingLoading || isUnfollowingLoading}
              variant={isFollowing ? "outline" : "primary"} 
              className="rounded-full px-6 font-bold uppercase tracking-wider text-xs"
            >
              {isFollowing ? 'Siguiendo' : 'Seguir'}
            </Button>
            <Button 
              onClick={async () => {
                try {
                  const res = await api.post("/v1/chats/direct", { target_user_id: profileUser.id });
                  router.push(`/chat/${res.data.id}`);
                } catch (err) {
                  console.error("Error creating chat", err);
                }
              }}
              variant="outline" 
              className="rounded-full px-6 font-bold uppercase tracking-wider text-xs border-white/20"
            >
              Mensaje
            </Button>
          </div>
        ) : (
          <Button variant="outline" className="rounded-full px-6 font-bold uppercase tracking-wider text-xs border-white/20">
            Editar
          </Button>
        )}
      </div>

      {isMyProfile && !profileUser.isKycVerified && (
        <div className="px-4 pb-4 max-w-lg mx-auto w-full">
          <Button 
            onClick={() => router.push('/kyc')}
            className="w-full flex items-center justify-center gap-2 border border-amber-500/50 text-amber-500 bg-amber-500/5 hover:bg-amber-500/10 hover:border-amber-500 transition-colors uppercase text-xs font-bold tracking-wider rounded-xl py-6"
          >
            <ShieldAlert className="w-4 h-4" />
            Comenzar Validación KYC
          </Button>
        </div>
      )}

      <div className="px-4 border-b border-white/10 max-w-lg mx-auto w-full">
        <div className="flex space-x-1 p-1">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 py-3 text-xs font-black uppercase tracking-wider transition-all border-b-2 rounded-t-lg hover:bg-white/5",
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

      <div className="p-4 space-y-4 max-w-lg mx-auto w-full">
        {activeTab === "Posts" && (
          <div className="space-y-4">
            {userPosts.length > 0 ? userPosts.map(post => (
              <PostCard key={post.id} post={post} variant="electronic" />
            )) : (
              <p className="text-center text-neutral-500 text-sm mt-8 uppercase font-bold">No hay posts creados</p>
            )}
          </div>
        )}

        {activeTab === "Comunidades" && (
          <div className="space-y-4">
            <CommunityList />
          </div>
        )}

        {activeTab === "Eventos" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {userEvents.map(event => (
              <EventCard key={event.id} event={event} variant="full" />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
