import { MOCK_COMMUNITIES } from "@/lib/mocks";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Users, UserPlus, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function CommunitiesPage() {
  return (
    <div className="flex flex-col min-h-[100dvh] bg-[#0B0D10] text-white pb-28">
      <header className="sticky top-0 z-40 glass-header-obsidian px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-[#D4FF00]" />
          <h1 className="text-lg font-black uppercase tracking-wider text-white">Comunidades RRPP</h1>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {MOCK_COMMUNITIES.map((community) => (
          <Card key={community.id} className="rounded-3xl bg-[#14171F] border border-white/10 shadow-lg hover:border-white/20 transition-all group">
            <CardHeader className="h-36 relative overflow-hidden">
              <Link href={`/communities/${community.id}`} className="block w-full h-full">
                <img
                  src={community.coverImageUrl}
                  alt={community.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </Link>
              <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-neutral-950/80 backdrop-blur-md text-[#D4FF00] text-[10px] font-extrabold uppercase tracking-widest border border-white/15">
                {community.membersCount} MIEMBROS
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              <Link href={`/communities/${community.id}`} className="block space-y-1">
                <h2 className="text-base font-black uppercase tracking-tight text-white group-hover:text-[#D4FF00] transition-colors flex items-center justify-between">
                  <span>{community.name}</span>
                  <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-1 transition-transform" />
                </h2>
                <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed font-medium">
                  {community.description}
                </p>
              </Link>
              
              <Link href={`/communities/${community.id}`} className="block pt-2">
                <Button variant="primary" size="sm" className="w-full gap-2">
                  <UserPlus className="w-4 h-4 text-neutral-950" /> Ingresar a la comunidad
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

