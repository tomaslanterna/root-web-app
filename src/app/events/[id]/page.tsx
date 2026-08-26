import { MOCK_EVENTS, Event } from "@/lib/mocks";
import { Button } from "@/components/ui/Button";
import { CommentSection } from "@/components/ui/CommentSection";
import { EventAttendanceVote } from "@/components/ui/EventAttendanceVote";
import { Calendar, MapPin, ArrowLeft, Disc3, Sparkles, Flame } from "lucide-react";
import Link from "next/link";

async function getEventData(id: string): Promise<Event | null> {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || process.env.BACKEND_PUBLIC_API_URL || "http://localhost:8080";
  try {
    const res = await fetch(`${backendUrl}/v1/events/${id}`, {
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (err) {
    console.error("Error fetching event by id from API:", err);
  }

  // Fallback to mock data
  const fallback = MOCK_EVENTS.find((e) => e.id === id);
  return fallback || null;
}

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await getEventData(id);

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-[#0B0D10] text-white">
        <p className="text-sm font-bold uppercase text-neutral-400">Evento no encontrado</p>
        <Link href="/events" className="mt-4">
          <Button variant="outline" size="sm">Volver a eventos</Button>
        </Link>
      </div>
    );
  }

  const dateObj = new Date(event.date);
  const formattedDate = !isNaN(dateObj.getTime())
    ? dateObj.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })
    : event.date;

  const bannerImage =
    event.cinematicBannerUrl && event.cinematicBannerUrl.trim() !== ""
      ? event.cinematicBannerUrl
      : "https://images.unsplash.com/photo-1514525253344-93168e974686?q=80&w=1974&auto=format&fit=crop";

  return (
    <div className="flex flex-col min-h-screen bg-[#0B0D10] text-white pb-28">
      {/* Top sticky back bar */}
      <div className="sticky top-0 z-40 glass-header-obsidian px-4 py-3 flex items-center justify-between">
        <Link
          href="/events"
          className="p-2 rounded-full bg-white/10 backdrop-blur-md border border-white/15 hover:bg-white/20 active:scale-95 transition-all text-white flex items-center gap-1 text-xs font-bold uppercase"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Eventos</span>
        </Link>
        <span className="text-[10px] font-black uppercase tracking-widest text-[#D4FF00]">Cartelera Oficial</span>
      </div>

      <div className="p-4 space-y-6">
        {/* 1º Movie Poster (Vertical 2:3) */}
        <div className="relative w-full aspect-[2/3] max-w-sm mx-auto rounded-3xl overflow-hidden shadow-2xl border border-white/15 bg-neutral-950 group">
          <img
            src={bannerImage}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/30 to-transparent" />
          
          <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-neutral-950/80 backdrop-blur-md text-[#D4FF00] text-[11px] font-extrabold uppercase tracking-widest border border-white/20 shadow-md">
            {formattedDate}
          </div>

          <div className="absolute bottom-4 inset-x-4 space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-300 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 w-fit">
              Cartelera Exclusiva
            </span>
            <p className="text-xs font-bold text-neutral-300 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#D4FF00]" /> {event.location}
            </p>
          </div>
        </div>

        {/* 2º Title & Attendance Voting Actions */}
        <div className="space-y-3">
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white leading-tight">
            {event.title}
          </h1>

          {/* Interactive Attendance Vote with Comparative Bar */}
          <EventAttendanceVote eventId={event.id} />

          {/* Crew Matcher CTA Banner */}
          <Link
            href="/match"
            className="p-3.5 rounded-2xl bg-gradient-to-r from-[#14171F] to-[#1E2330] border border-[#D4FF00]/30 hover:border-[#D4FF00] flex items-center justify-between transition-all duration-300 shadow-md group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#D4FF00] text-neutral-950 flex items-center justify-center font-black">
                <Flame className="w-4 h-4 fill-neutral-950" />
              </div>
              <div className="text-left">
                <p className="text-xs font-black uppercase tracking-wider text-white group-hover:text-[#D4FF00] transition-colors">
                  ¿Vas solo? Encuentra tu Crew
                </p>
                <p className="text-[10px] text-neutral-400 font-medium">
                  Grupos de 3-5 personas con tus mismos gustos
                </p>
              </div>
            </div>
            <span className="text-[10px] font-black uppercase text-[#D4FF00] tracking-wider shrink-0 pl-2">
              Match →
            </span>
          </Link>
        </div>

        {/* Lineup Tags (if available) */}
        {event.lineup && event.lineup.length > 0 && (
          <div className="p-4 rounded-3xl bg-[#14171F] border border-white/10 shadow-md space-y-2">
            <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400 flex items-center gap-1.5">
              <Disc3 className="w-4 h-4 text-[#D4FF00] animate-spin-slow" /> Lineup Confirmado
            </h3>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {event.lineup.map((artist) => (
                <span
                  key={artist}
                  className="px-3 py-1 rounded-full bg-[#D4FF00] text-neutral-950 text-xs font-black uppercase tracking-wider shadow-sm"
                >
                  {artist}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 3º Detailed Description */}
        <div className="p-5 rounded-3xl bg-[#14171F] border border-white/10 shadow-md space-y-3">
          <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#D4FF00]" /> Información del Evento
          </h3>
          <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed font-medium whitespace-pre-line">
            {event.description}
          </p>
        </div>

        {/* 4º Interactive Comment Section */}
        <CommentSection targetId={event.id} title="Muro de Comentarios del Evento" />
      </div>
    </div>
  );
}
