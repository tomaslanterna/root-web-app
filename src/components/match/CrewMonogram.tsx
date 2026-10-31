import { cn } from "@/lib/utils";

// Tonos apagados y parejos en luminosidad: identifican sin competir con el lima.
const tones = ["#2E3B2A", "#3A2F2A", "#2A3340", "#3D2E36", "#24201C", "#1E2B33", "#33301F"];

function toneFor(seed: string) {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return tones[Math.abs(hash) % tones.length];
}

export function initialsOf(name: string, max = 2) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const letters = words.length > 1 ? words.map((w) => w[0]) : [...(words[0] ?? "")];
  return letters.slice(0, max).join("").toUpperCase();
}

interface CrewMonogramProps {
  name: string;
  imageUrl?: string;
  className?: string;
}

export function CrewMonogram({ name, imageUrl, className }: CrewMonogramProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "font-display size-12 shrink-0 rounded-xl bg-cover bg-center text-ink text-[15px] flex items-center justify-center",
        className,
      )}
      style={{
        backgroundColor: toneFor(name),
        backgroundImage: imageUrl ? `url(${imageUrl})` : undefined,
      }}
    >
      {!imageUrl && initialsOf(name)}
    </span>
  );
}
