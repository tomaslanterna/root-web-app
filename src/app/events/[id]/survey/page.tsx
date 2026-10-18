"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { type SubmitSurveyPayload } from "@/services/surveys";
import { useEventReview, useSurveyDetail } from "@/hooks/useBadges";
import { useAuth } from "@/context/AuthContext";
import { LoginRequired } from "@/components/ui/LoginRequired";
import { attendanceDate } from "@/lib/badgeAppearance";
import type { Event } from "@/types/events";
import type { EventBadge } from "@/types/badges";
import { StarRating } from "@/components/ui/StarRating";
import { Loader2, CheckCircle, Star } from "lucide-react";
import { ArtistRatings } from "@/components/profile/ArtistRatings";
import { badgeLocation } from "@/lib/badgeLocation";
import { ConfirmModal } from "@/components/ui/Modal";

import { DetailHeader } from "@/components/ui/DetailHeader";

export default function SurveyPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { mutate: loadDetail, data: detail, error: detailError } = useSurveyDetail(id);
  const { save, saveError } = useEventReview(id);

  const [event, setEvent] = useState<Event | null>(null);
  const [isLoadingEvent, setIsLoadingEvent] = useState(true);
  const [mountedAt] = useState(() => Date.now());
  
  const [generalRating, setGeneralRating] = useState<number | null>(null);
  const [organizationRating, setOrganizationRating] = useState<number | null>(null);
  const [vibeRating, setVibeRating] = useState<number | null>(null);
  const [soundVisualRating, setSoundVisualRating] = useState<number | null>(null);
  const [pricingRating, setPricingRating] = useState<number | null>(null);
  const [spaceRating, setSpaceRating] = useState<string | null>(null);
  const [wouldReturn, setWouldReturn] = useState<boolean | null>(null);
  const [comment, setComment] = useState("");
  const [artistRatings, setArtistRatings] = useState<Record<string, number>>({});
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const submitting = useRef(false);
  const locked = detail?.badge?.review != null;

  const hydrateDetail = useCallback((result: { event: Event; badge?: EventBadge | null }) => {
    setEvent(result.event);
    const review = result.badge?.review;
    setGeneralRating(review?.generalRating ?? 1);
    setComment(review?.comment ?? "");
    setOrganizationRating(review?.organizationRating ?? (review ? null : 1));
    setVibeRating(review?.vibeRating ?? (review ? null : 1));
    setSoundVisualRating(review?.soundVisualRating ?? (review ? null : 1));
    setPricingRating(review?.pricingRating ?? (review ? null : 1));
    setSpaceRating(review?.spaceRating ?? null);
    setWouldReturn(review?.wouldReturn ?? null);
    setArtistRatings(Object.fromEntries((review?.artistRatings ?? []).map(ar => [ar.artistId, ar.rating])));
  }, []);

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    const fetchEvent = async () => {
      try {
        const result = await loadDetail();
        if (!mounted) return;
        hydrateDetail(result);
      } catch {
        // Handled by detailError
      } finally {
        if (mounted) setIsLoadingEvent(false);
      }
    };
    void fetchEvent();
    return () => { mounted = false; };
  }, [id, user, loadDetail, hydrateDetail]);

  useEffect(() => {
    if (!isSuccess) return;
    const timer = setTimeout(() => router.push("/feed"), 2000);
    return () => clearTimeout(timer);
  }, [isSuccess, router]);

  const handleArtistRating = (artistId: string, rating: number) => {
    setArtistRatings((prev) => ({
      ...prev,
      [artistId]: rating,
    }));
  };

  const handleSubmit = async () => {
    if (!confirmOpen || locked || generalRating === null || isSubmitting || submitting.current) return;

    submitting.current = true;
    setIsSubmitting(true);
    try {
      const payload: SubmitSurveyPayload = {
        general_rating: generalRating,
        organization_rating: organizationRating,
        vibe_rating: vibeRating,
        sound_visual_rating: soundVisualRating,
        pricing_rating: pricingRating,
        space_rating: spaceRating,
        would_return: wouldReturn,
        comment: comment || null,
        artist_ratings: (detail?.badge?.lineup || event?.artists || []).filter(entry => entry.artist).map(entry => ({
          artist_id: entry.artistId,
          rating: artistRatings[entry.artistId] ?? 1,
        })),
      };

      await save(payload);
      setIsSuccess(true);
      
      // Redirect after showing success briefly
      setTimeout(() => {
        router.push("/events");
      }, 2000);
      
    } catch {
      await loadDetail().then(result => { if (result?.badge?.review) hydrateDetail(result); }).catch(() => undefined);
    } finally {
      submitting.current = false;
      setConfirmOpen(false);
      setIsSubmitting(false);
    }
  };

  if (!authLoading && !user) return <LoginRequired />;
  if (authLoading || (isLoadingEvent && !detailError)) {
    return (
      <div className="min-h-screen bg-[#0B0D10] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#D4FF00] animate-spin" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-[#0B0D10] flex flex-col items-center justify-center text-white">
        <p className="px-4 text-center">{detailError?.response?.status === 404 ? "No pudimos encontrar el evento." : "No pudimos cargar la encuesta."}</p>
        <button onClick={() => void loadDetail().then(hydrateDetail).catch(() => undefined)} className="mt-4 text-[#D4FF00]">Reintentar</button>
        <button onClick={() => router.back()} className="mt-4 text-[#D4FF00]">Volver</button>
      </div>
    );
  }

  if (event.userRsvp !== "going" && !detail?.badge) {
    return (
      <div className="min-h-screen bg-[#0B0D10] flex flex-col items-center justify-center text-white px-6 text-center">
        <DetailHeader
          onBack={() => router.back()}
          showSave={false}
          showShare={false}
          showBrand={true}
        />
        <div className="max-w-md w-full p-8 rounded-3xl bg-[#14171F] border border-white/10 shadow-2xl flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#D4FF00]/10 border border-[#D4FF00]/20 flex items-center justify-center text-[#D4FF00]">
            <Star className="w-6 h-6 fill-[#D4FF00]" />
          </div>
          <h2 className="text-xl font-black italic tracking-tight text-white">
            Asistencia no registrada
          </h2>
          <p className="text-sm text-neutral-400">
            Necesitás haber marcado &ldquo;Voy&rdquo; o contar con asistencia confirmada a <span className="text-white font-bold">{event.title}</span> para completar su encuesta.
          </p>
          <button
            onClick={() => router.back()}
            className="mt-2 w-full py-3 rounded-full bg-[#D4FF00] text-neutral-950 font-black uppercase text-xs tracking-wider transition-all hover:bg-[#c2eb00] active:scale-95 cursor-pointer"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  const isPartyOngoing = () => {
    if (!event) return false;
    const start = new Date(event.date).getTime();
    const end = event.endDate && new Date(event.endDate).getTime() > start
      ? new Date(event.endDate).getTime()
      : start + 4 * 60 * 60 * 1000;
    return mountedAt < end;
  };

  if (isPartyOngoing()) {
    return (
      <div className="min-h-screen bg-[#0B0D10] flex flex-col items-center justify-center text-white px-6 text-center">
        <DetailHeader
          onBack={() => router.back()}
          showSave={false}
          showShare={false}
          showBrand={true}
        />
        <div className="max-w-md w-full p-8 rounded-3xl bg-[#14171F] border border-white/10 shadow-2xl flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#D4FF00]/10 border border-[#D4FF00]/20 flex items-center justify-center text-[#D4FF00]">
            <Star className="w-6 h-6 fill-[#D4FF00]" />
          </div>
          <h2 className="text-xl font-black italic tracking-tight text-white">
            La fiesta todavía está en curso
          </h2>
          <p className="text-sm text-neutral-400">
            La encuesta de <span className="text-white font-bold">{event.title}</span> estará disponible una vez que el evento haya finalizado.
          </p>
          <button
            onClick={() => router.back()}
            className="mt-2 w-full py-3 rounded-full bg-[#D4FF00] text-neutral-950 font-black uppercase text-xs tracking-wider transition-all hover:bg-[#c2eb00] active:scale-95 cursor-pointer"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#0B0D10] flex flex-col items-center justify-center px-4">
        <CheckCircle className="w-16 h-16 text-[#D4FF00] mb-4" />
        <h2 className="text-2xl font-black italic tracking-tighter text-white text-center">¡Gracias por tu reseña!</h2>
        <p className="text-neutral-400 mt-2 text-center">Tu feedback ayuda a crecer la comunidad.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0D10] text-white relative pb-24">
      {/* Detail Header */}
      <DetailHeader
        onBack={() => router.back()}
        showSave={false}
        showShare={false}
        showBrand={true}
      />

      {/* Background Image Blurred */}
      <div className="fixed inset-0 z-0 w-full h-[60vh]">
        <Image
          src={event.cinematicBannerUrl || "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7"}
          alt={event.title} 
          fill
          unoptimized
          sizes="100vw"
          className="w-full h-full object-cover opacity-20 blur-xl"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B0D10]/50 via-[#0B0D10]/80 to-[#0B0D10]" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 pt-28 md:pt-32">
        <h1 className="text-3xl md:text-4xl font-black italic tracking-tighter leading-tight mb-2">
          ¿Cómo te fue en <span className="text-[#D4FF00]">{event.title}</span>?
        </h1>
        <p className="text-neutral-400 font-medium">Dejanos tu opinión sincera. Toma 30 segundos.</p>
        {detail?.badge && <p className="mt-2 text-xs text-neutral-500">{badgeLocation(detail.badge)} · {attendanceDate(detail.badge.eventDate)}</p>}
        {detail?.badge && <p className="mt-3 text-sm text-[#D4FF00]">Insignia obtenida · Asistencia: {attendanceDate(detail.badge.confirmedAt)}</p>}

        {locked && <p role="status" className="mt-4 text-sm text-neutral-400">Reseña confirmada. Las puntuaciones y el texto no se pueden cambiar.</p>}
        <fieldset disabled={locked || isSubmitting || confirmOpen} className="mt-8 space-y-8">
          <legend className="sr-only">Puntuaciones y reseña del evento</legend>
          {/* General Rating (Required) */}
          <div className="bg-[#14171F]/80 backdrop-blur-md rounded-3xl p-6 border border-white/10">
            <h3 className="text-lg font-bold mb-1">Experiencia General <span className="text-red-500">*</span></h3>
            <p className="text-sm text-neutral-400 mb-4">¿Qué tal estuvo el evento en general?</p>
            <StarRating value={generalRating} onChange={setGeneralRating} readonly={locked} size={32} appearance="slider" label="Puntuación del evento" />
          </div>

          {/* Org & Vibe (Optional) */}
          <div className="bg-[#14171F]/80 backdrop-blur-md rounded-3xl p-6 border border-white/10 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-base font-bold mb-1">Organización y Venue</h3>
              <p className="text-xs text-neutral-400 mb-3">Accesos, barras, baños.</p>
              <StarRating value={organizationRating} onChange={setOrganizationRating} readonly={locked} size={28} appearance="slider" label="Organización y venue" />
            </div>
            <div>
              <h3 className="text-base font-bold mb-1">Vibe y Ambiente</h3>
              <p className="text-xs text-neutral-400 mb-3">La gente, la energía.</p>
              <StarRating value={vibeRating} onChange={setVibeRating} readonly={locked} size={28} appearance="slider" label="Vibe y ambiente" />
            </div>
          </div>

          {/* Sound & Pricing */}
          <div className="bg-[#14171F]/80 backdrop-blur-md rounded-3xl p-6 border border-white/10 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-base font-bold mb-1">Sonido y Visuales</h3>
              <p className="text-xs text-neutral-400 mb-3">Calidad del sistema de sonido y show.</p>
              <StarRating value={soundVisualRating} onChange={setSoundVisualRating} readonly={locked} size={28} appearance="slider" label="Sonido y visuales" />
            </div>
            <div>
              <h3 className="text-base font-bold mb-1">Relación Calidad-Precio</h3>
              <p className="text-xs text-neutral-400 mb-3">Tickets, tragos y servicios.</p>
              <StarRating value={pricingRating} onChange={setPricingRating} readonly={locked} size={28} appearance="slider" label="Relación calidad-precio" />
            </div>
          </div>

          {/* Space & Loyalty */}
          <div className="bg-[#14171F]/80 backdrop-blur-md rounded-3xl p-6 border border-white/10 space-y-6">
            <div>
              <h3 className="text-base font-bold mb-3">¿Se podía bailar o estaba demasiado lleno?</h3>
              <div className="flex flex-wrap gap-2">
                {['Demasiado lleno', 'Estaba bien', 'Había espacio de sobra'].map((option, idx) => {
                  const val = idx === 0 ? 'crowded' : idx === 1 ? 'good' : 'spacious';
                  return (
                    <button
                      key={val}
                      onClick={() => setSpaceRating(val)}
                      className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all border ${spaceRating === val ? 'bg-[#D4FF00] text-black border-[#D4FF00]' : 'bg-transparent text-neutral-400 border-white/20 hover:border-white/40'}`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="text-base font-bold mb-3">¿Volverías a ir a una fiesta de esta productora/venue?</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setWouldReturn(true)}
                  className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all border ${wouldReturn === true ? 'bg-[#D4FF00] text-black border-[#D4FF00]' : 'bg-transparent text-neutral-400 border-white/20 hover:border-white/40'}`}
                >
                  Sí
                </button>
                <button
                  onClick={() => setWouldReturn(false)}
                  className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all border ${wouldReturn === false ? 'bg-red-500 text-white border-red-500' : 'bg-transparent text-neutral-400 border-white/20 hover:border-white/40'}`}
                >
                  No
                </button>
              </div>
            </div>
          </div>

          {/* Lineup Ratings */}
          <ArtistRatings eventId={id} lineup={{ artists: detail?.badge?.lineup || event.artists || [], names: detail?.badge?.lineupNames || event.lineup || [] }} ratings={artistRatings} readonly={locked} onChange={handleArtistRating} />

          {/* Comment */}
          <div className="space-y-3">
            <h3 className="text-base font-bold">Comentarios adicionales</h3>
            <textarea 
              aria-label="Reseña de la fiesta"
              maxLength={1000}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="¿Qué fue lo mejor de la noche? ¿Qué se puede mejorar?"
              className="w-full bg-[#14171F]/80 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-sm min-h-[120px] focus:outline-none focus:border-[#D4FF00]/50 transition-colors placeholder:text-neutral-600 resize-none"
            />
          </div>
          <p className="text-right text-xs text-neutral-500">{comment.length}/1000</p>
          {saveError && !locked && <p role="alert" className="text-sm text-red-400">{saveError.response?.status === 409 ? "La reseña ya fue confirmada y no se puede modificar." : "No pudimos guardar tu valoración. Intentá nuevamente."}</p>}

          {/* Submit Action */}
          {!locked && <div className="pt-4">
            <button 
              onClick={() => setConfirmOpen(true)}
              disabled={generalRating === null || isSubmitting}
              className="w-full py-4 rounded-full bg-[#D4FF00] text-black font-black uppercase tracking-widest text-sm hover:bg-[#bce400] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Enviar Reseña"
              )}
            </button>
          </div>}

        </fieldset>
        <ConfirmModal isOpen={confirmOpen} title="¿Confirmar tu reseña?" message="Tu puntuación del evento, las notas de los DJs y tu reseña quedarán guardadas y no se podrán cambiar. ¿Deseás confirmar?" confirmText="Confirmar y guardar" cancelText="Cancelar" isLoading={isSubmitting} onClose={() => { if (!submitting.current) setConfirmOpen(false); }} onConfirm={handleSubmit} />
      </div>
    </div>
  );
}
