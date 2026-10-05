"use client";

import { use, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Loader2,
  MapPin,
  Megaphone,
  Radio,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-react";
import { CommunityAnnouncementCard } from "@/components/communities/CommunityAnnouncementCard";
import { CommunityAnnouncementComposer } from "@/components/communities/CommunityAnnouncementComposer";
import { Button } from "@/components/ui/Button";
import { DetailHeader } from "@/components/ui/DetailHeader";
import { useAuth } from "@/context/AuthContext";
import {
  useCommunityAnnouncements,
  useCommunityDetail,
} from "@/hooks/useCommunities";
import type { CreateCommunityAnnouncementInput } from "@/types/communities";

interface CommunityDetailPageProps {
  params: Promise<{ id: string }>;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error
  ) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    return response?.data?.message || fallback;
  }
  return fallback;
}

export default function CommunityDetailPage({ params }: CommunityDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const origin = searchParams.get("origin");
  const { user, isLoading: isAuthLoading } = useAuth();
  const {
    community,
    refresh,
    membership,
    isLoading,
    isChangingMembership,
    error,
    membershipError,
  } = useCommunityDetail(id);
  const {
    announcements,
    meta,
    load,
    publish,
    isLoading: isLoadingAnnouncements,
    isPublishing,
    error: announcementsError,
    publishError,
  } = useCommunityAnnouncements(id);

  useEffect(() => {
    void refresh().catch(() => undefined);
    void load({ offset: 0, append: false }).catch(() => undefined);
  }, [load, refresh]);

  const changeMembership = () => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (!community) return;
    void membership(community.isMember ? "leave" : "join").catch(() => undefined);
  };

  const createAnnouncement = (
    input: CreateCommunityAnnouncementInput,
    image?: File,
  ) => publish({ input, image });

  if (isLoading && !community) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0B0D10] text-white">
        <Loader2 className="mb-3 h-7 w-7 animate-spin text-[#D4FF00]" />
        <p className="text-xs font-black uppercase tracking-widest text-neutral-400">
          Cargando comunidad
        </p>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0B0D10] p-6 text-center text-white">
        <Radio className="mb-4 h-10 w-10 text-neutral-600" />
        <p className="text-sm font-bold uppercase text-neutral-300">
          {error
            ? "No pudimos cargar esta comunidad"
            : "Comunidad no encontrada"}
        </p>
        <div className="mt-4 flex gap-2">
          {error && (
            <Button
              size="sm"
              onClick={() => void refresh().catch(() => undefined)}
            >
              Reintentar
            </Button>
          )}
          <Link href="/communities">
            <Button variant="outline" size="sm">
              Volver
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0D10] pb-28 text-white">
      <DetailHeader showBrand onBack={() => router.push(origin || "/communities")} />

      <section className="relative h-56 w-full overflow-hidden bg-neutral-950 md:h-80">
        {community.coverImageUrl ? (
          <Image
            src={community.coverImageUrl}
            alt={community.name}
            fill
            unoptimized
            sizes="100vw"
            className="object-cover opacity-75"
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(212,255,0,0.28),transparent_30%),linear-gradient(140deg,#1a2028,#07080a)]">
            <Radio className="absolute right-[10%] top-[16%] h-40 w-40 text-[#D4FF00]/10" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0D10] via-black/30 to-transparent" />
        <div className="absolute inset-x-4 bottom-5 mx-auto max-w-6xl space-y-2 md:inset-x-8">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-[#D4FF00]/30 bg-[#D4FF00]/15 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#D4FF00] backdrop-blur-md">
              {community.category}
            </span>
            {community.zone && (
              <span className="flex items-center gap-1 rounded-full border border-white/15 bg-black/40 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-neutral-200 backdrop-blur-md">
                <MapPin className="h-3 w-3" /> {community.zone}
              </span>
            )}
          </div>
          <h1 className="text-3xl font-black uppercase leading-none tracking-tight md:text-5xl">
            {community.name}
          </h1>
        </div>
      </section>

      <main className="mx-auto grid w-full max-w-6xl gap-6 p-4 md:grid-cols-12 md:p-8">
        <aside className="space-y-4 md:sticky md:top-24 md:col-span-4 md:self-start lg:col-span-3">
          <div className="space-y-4 rounded-3xl border border-white/10 bg-[#14171F] p-5 shadow-xl">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-[#D4FF00]">
                <Users className="h-4 w-4" />
                <span className="text-xs font-black uppercase tracking-wider">
                  {community.membersCount} miembros
                </span>
              </div>
              {community.isMember && (
                <CheckCircle2 className="h-4 w-4 text-[#D4FF00]" />
              )}
            </div>
            <p className="text-sm font-medium leading-relaxed text-neutral-300">
              {community.description}
            </p>
            <Button
              variant={community.isMember ? "outline" : "primary"}
              className="w-full"
              onClick={changeMembership}
              disabled={isChangingMembership || isAuthLoading}
            >
              {isChangingMembership ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : community.isMember ? (
                <UserMinus className="h-4 w-4" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              {!user
                ? "Iniciá sesión para unirte"
                : community.isMember
                  ? "Salir de la comunidad"
                  : "Unirme a la comunidad"}
            </Button>
            {membershipError && (
              <p className="text-xs font-bold text-red-400">
                No pudimos actualizar tu membresía. Intentá nuevamente.
              </p>
            )}
          </div>
        </aside>

        <div className="space-y-5 md:col-span-8 lg:col-span-9">
          {community.canPublish && (
            <CommunityAnnouncementComposer
              isPublishing={isPublishing}
              errorMessage={
                publishError
                  ? getErrorMessage(publishError, "No pudimos publicar el anuncio")
                  : undefined
              }
              onPublish={createAnnouncement}
            />
          )}

          <div className="flex items-center justify-between px-1">
            <h2 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-neutral-300">
              <Megaphone className="h-4 w-4 text-[#D4FF00]" /> Anuncios
            </h2>
            <span className="text-[10px] font-black uppercase tracking-wider text-[#D4FF00]">
              {meta.total} publicaciones
            </span>
          </div>

          {announcementsError && announcements.length === 0 ? (
            <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-8 text-center">
              <p className="text-sm font-bold text-red-300">
                No pudimos cargar los anuncios.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() =>
                  void load({ offset: 0, append: false }).catch(() => undefined)
                }
              >
                Reintentar
              </Button>
            </div>
          ) : isLoadingAnnouncements && announcements.length === 0 ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-7 w-7 animate-spin text-[#D4FF00]" />
            </div>
          ) : announcements.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-[#14171F] p-10 text-center">
              <Megaphone className="mx-auto mb-3 h-8 w-8 text-neutral-600" />
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Todavía no hay anuncios en esta comunidad
              </p>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {announcements.map((announcement) => (
                <CommunityAnnouncementCard
                  key={announcement.id}
                  announcement={announcement}
                />
              ))}
            </div>
          )}

          {meta.hasMore && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                disabled={isLoadingAnnouncements}
                onClick={() =>
                  void load({ offset: announcements.length, append: true }).catch(
                    () => undefined,
                  )
                }
              >
                {isLoadingAnnouncements && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Cargar más
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
