"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Award, Ban, Check, ChevronLeft, ChevronRight, Flag, Grid3X3, Loader2, Lock, MoreHorizontal, Plus, Settings, Share2, ShieldCheck } from "lucide-react";
import { SwipeBack } from "@/components/ui/SwipeBack";
import { MOCK_POSTS } from "@/lib/mocks";
import { CreatePhotoModal } from "@/components/profile/CreatePhotoModal";
import { ProfileSkeleton } from "@/components/profile/ProfileSkeleton";
import { cn, copyTextToClipboard, isValidImageUrl } from "@/lib/utils";
import { api } from "@/lib/api";
import { usersApi } from "@/services/users";
import { useMutation } from "@/hooks/useMutation";
import { BadgeCollection } from "@/components/profile/BadgeCollection";
import { ProfilePostsGrid } from "@/components/profile/ProfilePostsGrid";
import type { AuthUser, FollowStatus } from "@/types/auth";
import type { Post } from "@/types/posts";
import { TabIndicator } from "@/components/ui/TabIndicator";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { useBlockActions } from "@/hooks/useBlocks";
import { ActionSheet } from "@/components/ui/ActionSheet";
import { ReportSheet } from "@/components/ui/ReportSheet";
import { ConfirmModal } from "@/components/ui/Modal";

interface ProfileUser extends AuthUser { followers?: string[]; following?: string[] }

export default function UserProfilePage() {
  const router = useRouter();
  const goBack = useBackNavigation();
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
  const [followStatus, setFollowStatus] = useState<FollowStatus>("none");
  // Perfil privado que no seguís: se ve el encabezado, no el contenido.
  const [canViewContent, setCanViewContent] = useState(true);
  // Lo bloqueaste vos (si te bloqueó él, el backend responde 404 y se ve "Usuario no encontrado").
  const [isBlocked, setIsBlocked] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [blockError, setBlockError] = useState<string | null>(null);
  // Se incrementa para volver a pedir el perfil (después de desbloquear cambia qué se puede ver).
  const [reloadKey, setReloadKey] = useState(0);
  const blockActions = useBlockActions();
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const badgeToOpen = searchParams.get("badge");
  const [activeTab, setActiveTab] = useState<string>(badgeToOpen ? "Insignias" : "Posts");
  const [shareCopied, setShareCopied] = useState(false);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [userPosts, setUserPosts] = useState<Post[]>([]);

  const isMyProfile = Boolean(currentUser?.id && profileUser?.id === currentUser.id);

  const handleStartUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        return;
      }
      setSelectedFile(file);
      setIsCreatePostOpen(true);
    }
  };

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
        setFollowStatus(data.followStatus ?? (data.isFollowing ? "following" : "none"));
        const blocked = Boolean(data.isBlocked ?? data.user?.isBlocked);
        setIsBlocked(blocked);
        const canView = !blocked && (data.canViewContent ?? true);
        setCanViewContent(canView);

        // 1. Posts del perfil. Si es privado y no lo seguís no se piden.
        let backendUserPosts: Post[] = [];
        if (canView) {
          try {
            backendUserPosts = await usersApi.getUserPosts(username);
          } catch (postsErr) {
            const status = (postsErr as { response?: { status?: number } })?.response?.status;
            // Backend anterior sin /users/{username}/posts: se filtran del feed global como antes.
            if (status === 404) {
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
            } else if (status === 403) {
              setCanViewContent(false);
            }
          }
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
  }, [username, reloadKey]);

  const { mutate: followMutate, isLoading: isFollowingLoading } = useMutation(
    () => usersApi.followUser(username),
    {
      onSuccess: (status) => {
        setFollowStatus(status);
        // Perfil privado: queda "Solicitado" hasta que acepte; no suma seguidor todavía.
        if (status !== "following") return;
        setCanViewContent(true);
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
          setFollowStatus("none");
          if (profileUser?.isPrivate) setCanViewContent(false);
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
    // Siguiendo o Solicitado: el mismo botón deja de seguir o cancela la solicitud.
    if (followStatus !== "none") {
      unfollowMutate({});
    } else {
      followMutate(undefined);
    }
  };

  const handleBlock = async () => {
    setBlockError(null);
    try {
      await blockActions.block(username);
      setConfirmBlock(false);
      // Bloqueo simétrico: se dejan de seguir en ambos sentidos.
      setIsBlocked(true);
      setFollowStatus("none");
      setCanViewContent(false);
      setUserPosts([]);
      setProfileUser((prev) => prev ? ({
        ...prev,
        followers: (prev.followers || []).filter((id) => id !== currentUser?.id),
        following: (prev.following || []).filter((id) => id !== currentUser?.id),
      }) : prev);
    } catch {
      setBlockError("No pudimos bloquear la cuenta. Intentá nuevamente.");
    }
  };

  const handleUnblock = async () => {
    setBlockError(null);
    try {
      await blockActions.unblock(username);
      setIsBlocked(false);
      setReloadKey((key) => key + 1);
    } catch {
      setBlockError("No pudimos desbloquear la cuenta. Intentá nuevamente.");
    }
  };

  const requireLogin = (action: () => void) => () => {
    if (!currentUser) {
      router.push("/login");
      return;
    }
    action();
  };

  const handleProfileBack = () => {
    if (fromCommunities) {
      router.replace(communityReturnTo);
      return;
    }
    goBack();
  };

  if (authLoading || isLoadingProfile) {
    // Mientras carga todavía no está profileUser: se compara por username para armar el mismo header.
    const looksMine = !!currentUser?.username && currentUser.username.toLowerCase() === username.toLowerCase();
    return <ProfileSkeleton isMine={looksMine} showBack={!looksMine || fromSearch || fromCommunities} />;
  }

  if (error || !profileUser) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 min-h-[100dvh] bg-bg text-ink p-6 text-center">
        <h2 className="m-0 text-lg font-semibold">{error || "Perfil no encontrado"}</h2>
        <Button variant="secondary" onClick={goBack}>Volver</Button>
      </div>
    );
  }

  const tabs = [
    { id: "Posts", label: "Posts", icon: Grid3X3 },
    { id: "Insignias", label: "Insignias", icon: Award },
  ];

  const showBack = !isMyProfile || fromSearch || fromCommunities;
  const showContent = isMyProfile || (canViewContent && !isBlocked);
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
    <div className="flex min-h-[100dvh] flex-col bg-bg pb-[calc(var(--root-mobile-nav-clearance)+1rem)] text-ink md:pb-16 lg:flow-root">
      <header className="sticky top-0 z-30 w-full bg-bg/95 backdrop-blur-md border-b border-line lg:static lg:border-b-0 lg:bg-transparent lg:backdrop-blur-none">
        <div className="w-full max-w-3xl mx-auto px-4 pt-[calc(0.75rem+var(--root-safe-top))] pb-3 md:pt-6 flex items-center gap-3 lg:max-w-none lg:px-0 lg:pt-2 lg:pb-6">
        {/* Volver: en el perfil de otra persona siempre; en el propio solo si se llegó desde búsqueda o una comunidad
            (desde la barra de abajo es una pestaña raíz). */}
        {showBack && <SwipeBack onBack={handleProfileBack} />}
        {showBack && (
          <button
            type="button"
            onClick={handleProfileBack}
            aria-label={fromCommunities ? "Volver a la comunidad" : "Volver"}
            className={squareButton}
          >
            <ChevronLeft className="size-[22px]" aria-hidden="true" />
          </button>
        )}
        <h1 className="font-display text-[32px] m-0 flex-1 min-w-0">Perfil</h1>
        <button
          type="button"
          onClick={() => void shareProfile()}
          aria-label={shareCopied ? "Enlace copiado" : "Compartir perfil"}
          title={shareCopied ? "Enlace copiado" : "Compartir perfil"}
          className={cn(squareButton, shareCopied && "text-accent border-accent/40 bg-accent/10")}
        >
          {shareCopied ? (
            <Check className="size-5 text-accent" aria-hidden="true" />
          ) : (
            <Share2 className="size-5" aria-hidden="true" />
          )}
        </button>
        {!isMyProfile && (
          <button
            type="button"
            onClick={() => setShowActions(true)}
            aria-label="Más opciones"
            aria-haspopup="menu"
            title="Más opciones"
            className={squareButton}
          >
            <MoreHorizontal className="size-5" aria-hidden="true" />
          </button>
        )}
        {isMyProfile && (
          <Link
            href="/settings"
            aria-label="Configuración"
            title="Configuración"
            className={squareButton}
          >
            <Settings className="size-5" aria-hidden="true" />
          </Link>
        )}
        </div>
      </header>

      <div className="w-full max-w-3xl mx-auto px-4 pt-5 flex items-center gap-[18px] lg:float-left lg:clear-left lg:w-[340px] lg:mx-0 lg:px-0 lg:flex-col lg:items-start lg:p-6 lg:rounded-hero lg:bg-surface lg:border lg:border-line">
        <div
          className={cn(
            "relative size-[88px] shrink-0 rounded-full overflow-hidden bg-surface-2 lg:size-[112px]",
            isMyProfile && "ring-2 ring-accent ring-offset-[3px] ring-offset-bg",
          )}
        >
          {isValidImageUrl(profileUser.avatarUrl) ? (
            <Image
              src={profileUser.avatarUrl.trim()}
              alt=""
              fill
              priority
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
            <h2 className="m-0 text-[22px] font-bold truncate">{profileUser.name}</h2>
            <span className="text-sm text-ink-2 truncate flex items-center gap-1">
              @{profileUser.username}
              {profileUser.isPrivate && <Lock className="size-3.5 shrink-0 text-ink-3" aria-label="Perfil privado" />}
            </span>
            <span className="mt-1 flex flex-wrap gap-1.5">
              <span className="label-mono px-2 py-1 rounded-full bg-surface-2 text-ink-2">{roleLabel}</span>
              {profileUser.isKycVerified ? (
                <span className="label-mono px-2 py-1 rounded-full bg-info/12 text-info">Verificado</span>
              ) : (
                <span className="label-mono px-2 py-1 rounded-full bg-surface-2 text-ink-3">Sin verificar</span>
              )}
            </span>
          </div>
          <div className="flex gap-[18px] text-sm text-ink-2">
            {showContent ? (
              <>
                <Link
                  href={`/profile/${encodeURIComponent(profileUser.username)}/follows?tab=followers`}
                  className="rounded-md hover:text-ink transition-colors focus-visible:outline-2 focus-visible:outline-accent"
                >
                  <span className="num-mono text-base font-semibold text-ink">{profileUser.followers?.length || 0}</span> seguidores
                </Link>
                <Link
                  href={`/profile/${encodeURIComponent(profileUser.username)}/follows?tab=following`}
                  className="rounded-md hover:text-ink transition-colors focus-visible:outline-2 focus-visible:outline-accent"
                >
                  <span className="num-mono text-base font-semibold text-ink">{profileUser.following?.length || 0}</span> seguidos
                </Link>
              </>
            ) : (
              <>
                {/* Privado y sin seguir: se ven las cantidades, no las listas. */}
                <span><span className="num-mono text-base font-semibold text-ink">{profileUser.followers?.length || 0}</span> seguidores</span>
                <span><span className="num-mono text-base font-semibold text-ink">{profileUser.following?.length || 0}</span> seguidos</span>
              </>
            )}
          </div>
        </div>
      </div>

      {!isMyProfile && !isBlocked && (
        <div className="w-full max-w-3xl mx-auto px-4 pt-4 grid grid-cols-2 gap-2 lg:float-left lg:clear-left lg:w-[340px] lg:mx-0 lg:px-0">
          <Button
            onClick={toggleFollow}
            disabled={isFollowingLoading || isUnfollowingLoading}
            variant={followStatus === "none" ? "primary" : "secondary"}
            aria-pressed={followStatus !== "none"}
            className="h-11 rounded-xl text-sm"
          >
            {followStatus === "following" ? "Siguiendo" : followStatus === "requested" ? "Solicitado" : "Seguir"}
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
        </div>
      )}

      {isMyProfile && !profileUser.isKycVerified && (
        <div className="w-full max-w-3xl mx-auto px-4 pt-3 lg:float-left lg:clear-left lg:w-[340px] lg:mx-0 lg:px-0">
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

      {!isMyProfile && isBlocked && (
        <section className="mt-6 w-full max-w-3xl mx-auto px-4 lg:ml-[372px] lg:mr-0 lg:max-w-none lg:w-auto lg:mt-0 lg:px-0">
          <div className="rounded-card border border-line bg-surface px-5 py-8 flex flex-col items-center gap-3 text-center">
            <span className="size-12 rounded-full bg-surface-2 flex items-center justify-center">
              <Ban className="size-5 text-ink-2" aria-hidden="true" />
            </span>
            <h3 className="m-0 text-[17px] font-semibold">Bloqueaste a esta cuenta</h3>
            <p className="m-0 max-w-xs text-sm text-ink-2">
              No ve tu perfil ni tus publicaciones y no te puede escribir. No se entera de que la bloqueaste.
            </p>
            <Button
              variant="secondary"
              onClick={() => void handleUnblock()}
              disabled={blockActions.pending[username]}
              className="mt-1 h-11 rounded-xl text-sm"
            >
              {blockActions.pending[username] ? "Desbloqueando…" : "Desbloquear"}
            </Button>
            {blockError && <p role="alert" className="m-0 text-xs font-semibold text-danger">{blockError}</p>}
          </div>
        </section>
      )}

      {!showContent && !isBlocked && (
        <section className="mt-6 w-full max-w-3xl mx-auto px-4 lg:ml-[372px] lg:mr-0 lg:max-w-none lg:w-auto lg:mt-0 lg:px-0">
          <div className="rounded-card border border-line bg-surface px-5 py-8 flex flex-col items-center gap-3 text-center">
            <span className="size-12 rounded-full bg-surface-2 flex items-center justify-center">
              <Lock className="size-5 text-ink-2" aria-hidden="true" />
            </span>
            <h3 className="m-0 text-[17px] font-semibold">Esta cuenta es privada</h3>
            <p className="m-0 max-w-xs text-sm text-ink-2">
              {followStatus === "requested"
                ? "Le mandaste una solicitud. Cuando la acepte vas a ver sus posts e insignias."
                : "Seguila para ver sus posts e insignias."}
            </p>
          </div>
        </section>
      )}

      {showContent && <>
      <div className="mt-6 w-full max-w-3xl mx-auto lg:ml-[372px] lg:mr-0 lg:max-w-none lg:w-auto lg:mt-0">
        <div role="tablist" aria-label="Contenido del perfil" className="relative flex border-b border-line">
          <TabIndicator variant="underline" />
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
                  isActive ? "text-accent" : "text-ink-3 hover:text-ink-2",
                )}
              >
                <Icon className="size-5" aria-hidden="true" />
              </button>
            );
          })}
        </div>
      </div>

      <div key={activeTab} id={`profile-tab-${activeTab}`} role="tabpanel" aria-label={activeTab} className={cn("tab-panel-in w-full max-w-3xl mx-auto lg:ml-[372px] lg:mr-0 lg:max-w-none lg:w-auto", activeTab === "Posts" ? "pt-0.5" : "px-4 pt-4")}>
        {activeTab === "Insignias" && (
          <BadgeCollection key={`${username}:${currentUser?.id || "guest"}`} username={username} isOwner={isMyProfile} initialBadgeId={isMyProfile ? badgeToOpen : null} />
        )}
        {activeTab === "Posts" && (
          <ProfilePostsGrid
            posts={userPosts}
            isMyProfile={isMyProfile}
            onCreatePost={handleStartUpload}
          />
        )}
      </div>
      </>}

      {isMyProfile && (
        <>
          {/* Subir foto es de la pestaña Posts: en Insignias no se muestra. */}
          {activeTab === "Posts" && (
            <button
              type="button"
              onClick={handleStartUpload}
              aria-label="Subir foto"
              className="fixed right-5 bottom-[calc(var(--root-mobile-nav-clearance)+0.75rem)] md:bottom-8 md:right-8 z-40 size-14 rounded-full bg-accent text-on-accent shadow-[0_8px_30px_rgba(212,255,0,0.35)] flex items-center justify-center hover:scale-105 active:scale-95 transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent cursor-pointer"
            >
              <Plus className="size-7" strokeWidth={2.4} aria-hidden="true" />
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <CreatePhotoModal
            isOpen={isCreatePostOpen}
            initialFile={selectedFile}
            onClose={() => {
              setIsCreatePostOpen(false);
              setSelectedFile(null);
            }}
            onPostCreated={handlePostCreated}
            onPickAnother={handleStartUpload}
          />
        </>
      )}
      {!isMyProfile && (
        <>
          <ActionSheet
            isOpen={showActions}
            onClose={() => setShowActions(false)}
            title={`@${profileUser.username}`}
            actions={[
              {
                id: "report",
                label: "Denunciar cuenta",
                icon: <Flag />,
                destructive: true,
                onSelect: requireLogin(() => setShowReport(true)),
              },
              isBlocked
                ? { id: "unblock", label: "Desbloquear", icon: <Ban />, onSelect: requireLogin(() => void handleUnblock()) }
                : {
                    id: "block",
                    label: "Bloquear",
                    icon: <Ban />,
                    destructive: true,
                    onSelect: requireLogin(() => { setBlockError(null); setConfirmBlock(true); }),
                  },
            ]}
          />
          <ReportSheet
            isOpen={showReport}
            onClose={() => setShowReport(false)}
            target={{ targetType: "user", targetId: profileUser.id }}
          />
          <ConfirmModal
            isOpen={confirmBlock}
            onClose={() => { if (!blockActions.pending[username]) setConfirmBlock(false); }}
            title={`¿Bloquear a @${profileUser.username}?`}
            message="No va a ver tu perfil ni tus publicaciones, no te va a poder escribir y se dejan de seguir. No le avisamos. Lo podés desbloquear cuando quieras desde Configuración."
            confirmText="Bloquear"
            variant="danger"
            isLoading={blockActions.pending[username]}
            onConfirm={() => void handleBlock()}
          >
            {blockError && <p role="alert" className="mt-3 mb-0 text-xs font-semibold text-danger">{blockError}</p>}
          </ConfirmModal>
        </>
      )}
    </div>
  );
}
