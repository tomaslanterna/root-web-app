import Link from "next/link";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

/** Acceso a la búsqueda global (eventos, personas y comunidades) desde cualquier header. */
export function SearchButton({ className }: { className?: string }) {
  return (
    <Link
      href="/search"
      aria-label="Buscar"
      onClick={(event) => event.stopPropagation()}
      className={cn(
        "size-11 shrink-0 rounded-control bg-surface border border-line text-ink flex items-center justify-center hover:bg-surface-2 transition-colors focus-visible:outline-2 focus-visible:outline-accent",
        className,
      )}
    >
      <Search className="size-5" aria-hidden="true" />
    </Link>
  );
}
