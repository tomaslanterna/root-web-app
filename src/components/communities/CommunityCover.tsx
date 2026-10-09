"use client";

import { useState } from "react";
import Image from "next/image";
import { getCommunityCoverSources } from "@/lib/communityCovers";
import { cn } from "@/lib/utils";

interface CommunityCoverProps {
  coverImageUrl?: string | null;
  category?: string | null;
  sizes: string;
  className?: string;
}

export function CommunityCover({ coverImageUrl, category, sizes, className }: CommunityCoverProps) {
  const [failedSources, setFailedSources] = useState<string[]>([]);
  const source = getCommunityCoverSources(coverImageUrl, category).find((candidate) => !failedSources.includes(candidate));

  if (!source) return null;

  return (
    <Image
      key={source}
      src={source}
      alt=""
      fill
      unoptimized
      sizes={sizes}
      className={cn("object-cover", className)}
      onError={() => setFailedSources((current) => current.includes(source) ? current : [...current, source])}
    />
  );
}
