"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { surveysApi, SubmitSurveyPayload } from "@/services/surveys";
import type { Event } from "@/types/events";
import { StarRating } from "@/components/ui/StarRating";
import { ChevronLeft, Loader2, Music, CheckCircle } from "lucide-react";

export default function SurveyPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  const [event, setEvent] = useState<Event | null>(null);
  const [isLoadingEvent, setIsLoadingEvent] = useState(true);
  
  const [generalRating, setGeneralRating] = useState<number>(0);
  const [organizationRating, setOrganizationRating] = useState<number>(0);
  const [vibeRating, setVibeRating] = useState<number>(0);
  const [soundVisualRating, setSoundVisualRating] = useState<number>(0);
  const [pricingRating, setPricingRating] = useState<number>(0);
  const [spaceRating, setSpaceRating] = useState<string | null>(null);
  const [wouldReturn, setWouldReturn] = useState<boolean | null>(null);
  const [comment, setComment] = useState("");
  const [artistRatings, setArtistRatings] = useState<Record<string, number>>({});
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await api.get(`/v1/events/${id}`);
        setEvent(res.data);
      } catch (err) {
        console.error("Error fetching event for survey:", err);
      } finally {
        setIsLoadingEvent(false);
      }
    };
    void fetchEvent();
  }, [id]);

  const handleArtistRating = (artistId: string, rating: number) => {
    setArtistRatings((prev) => ({
      ...prev,
      [artistId]: rating,
    }));
  };

  const handleSubmit = async () => {
    if (generalRating === 0) return; // General rating is required

    setIsSubmitting(true);
    try {
      const payload: SubmitSurveyPayload = {
        general_rating: generalRating,
        organization_rating: organizationRating || null,
        vibe_rating: vibeRating || null,
        sound_visual_rating: soundVisualRating || null,
        pricing_rating: pricingRating || null,
        space_rating: spaceRating,
        would_return: wouldReturn,
        comment: comment || null,
        artist_ratings: Object.entries(artistRatings).map(([artist_id, rating]) => ({
          artist_id,
          rating,
        })),
      };

      await surveysApi.submitSurvey(id, payload);
      setIsSuccess(true);
      
      // Redirect after showing success briefly
      setTimeout(() => {
        router.push("/feed");
      }, 2000);
    } catch (error) {
      console.error("Error submitting survey:", error);
      // Could show a toast here
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingEvent) {
    return (
      <div className="min-h-screen bg-[#0B0D10] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#D4FF00] animate-spin" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-[#0B0D10] flex flex-col items-center justify-center text-white">
        <p>Evento no encontrado</p>
        <button onClick={() => router.back()} className="mt-4 text-[#D4FF00]">Volver</button>
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
      {/* Background Image Blurred */}
      <div className="fixed inset-0 z-0 w-full h-[60vh]">
        <img 
          src={event.cinematicBannerUrl || "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7"} 
          alt={event.title} 
          className="w-full h-full object-cover opacity-20 blur-xl"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B0D10]/50 via-[#0B0D10]/80 to-[#0B0D10]" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 pt-6">
        {/* Header */}
        <button onClick={() => router.back()} className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors mb-6 cursor-pointer">
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm font-bold uppercase tracking-wider">Volver</span>
        </button>

        <h1 className="text-3xl md:text-4xl font-black italic tracking-tighter leading-tight mb-2">
          ¿Cómo te fue en <span className="text-[#D4FF00]">{event.title}</span>?
        </h1>
        <p className="text-neutral-400 font-medium">Dejanos tu opinión sincera. Toma 30 segundos.</p>

        <div className="mt-8 space-y-8">
          {/* General Rating (Required) */}
          <div className="bg-[#14171F]/80 backdrop-blur-md rounded-3xl p-6 border border-white/10">
            <h3 className="text-lg font-bold mb-1">Experiencia General <span className="text-red-500">*</span></h3>
            <p className="text-sm text-neutral-400 mb-4">¿Qué tal estuvo el evento en general?</p>
            <StarRating value={generalRating} onChange={setGeneralRating} size={36} />
          </div>

          {/* Org & Vibe (Optional) */}
          <div className="bg-[#14171F]/80 backdrop-blur-md rounded-3xl p-6 border border-white/10 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-base font-bold mb-1">Organización y Venue</h3>
              <p className="text-xs text-neutral-400 mb-3">Accesos, barras, baños.</p>
              <StarRating value={organizationRating} onChange={setOrganizationRating} size={28} />
            </div>
            <div>
              <h3 className="text-base font-bold mb-1">Vibe y Ambiente</h3>
              <p className="text-xs text-neutral-400 mb-3">La gente, la energía.</p>
              <StarRating value={vibeRating} onChange={setVibeRating} size={28} />
            </div>
          </div>

          {/* Sound & Pricing */}
          <div className="bg-[#14171F]/80 backdrop-blur-md rounded-3xl p-6 border border-white/10 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-base font-bold mb-1">Sonido y Visuales</h3>
              <p className="text-xs text-neutral-400 mb-3">Calidad del sistema de sonido y show.</p>
              <StarRating value={soundVisualRating} onChange={setSoundVisualRating} size={28} />
            </div>
            <div>
              <h3 className="text-base font-bold mb-1">Relación Calidad-Precio</h3>
              <p className="text-xs text-neutral-400 mb-3">Tickets, tragos y servicios.</p>
              <StarRating value={pricingRating} onChange={setPricingRating} size={28} />
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
          {event.artists && event.artists.length > 0 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold mb-1 flex items-center gap-2">
                  <Music className="w-5 h-5 text-[#D4FF00]" /> El Lineup
                </h3>
                <p className="text-sm text-neutral-400">Puntuá a los artistas que llegaste a ver. (Opcional)</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {event.artists.map((ea) => (
                  <div key={ea.artistId} className="bg-[#14171F]/80 backdrop-blur-md rounded-2xl p-4 border border-white/5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-neutral-800 shrink-0">
                        {ea.artist?.avatarUrl ? (
                          <img src={ea.artist.avatarUrl} alt={ea.artist.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xl font-black text-neutral-600">
                            {ea.artist?.name?.[0]}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-sm line-clamp-1">{ea.artist?.name || 'Artista'}</p>
                        <p className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">
                          {ea.isHeadliner ? 'Headliner' : ea.artist?.artistType || 'DJ'}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0">
                      <StarRating 
                        value={artistRatings[ea.artistId] || 0} 
                        onChange={(val) => handleArtistRating(ea.artistId, val)} 
                        size={20} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comment */}
          <div className="space-y-3">
            <h3 className="text-base font-bold">Comentarios adicionales</h3>
            <textarea 
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="¿Qué fue lo mejor de la noche? ¿Qué se puede mejorar?"
              className="w-full bg-[#14171F]/80 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-sm min-h-[120px] focus:outline-none focus:border-[#D4FF00]/50 transition-colors placeholder:text-neutral-600 resize-none"
            />
          </div>

          {/* Submit Action */}
          <div className="pt-4">
            <button 
              onClick={handleSubmit}
              disabled={generalRating === 0 || isSubmitting}
              className="w-full py-4 rounded-full bg-[#D4FF00] text-black font-black uppercase tracking-widest text-sm hover:bg-[#bce400] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Enviar Reseña"
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
