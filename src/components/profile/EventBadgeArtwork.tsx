"use client";

import Image from "next/image";
import { useId, useState } from "react";
import { badgeDJ, badgeProgress, badgeRatingValue, badgeRingLabel, badgeStepValue } from "@/lib/badgeAppearance";
import type { EventBadge } from "@/types/badges";
import { badgeFlyerUrl, badgeArtistImageUrl } from "@/services/badges";

const PROGRESS_LIME = "#C6FF00";

export function MostDancedAccolade({ id, animate }: { id: string; animate: boolean }) {
  const limeGradient = `${id}-lime`;
  const limeOrbGradient = `${id}-lime-orb`;
  const shineGradient = `${id}-shine`;
  const crownClip = `${id}-crown-clip`;
  const leafId = `${id}-leaf`;
  const crownShape = "M39 22 L39 8 L50 19 L51 6 L58 18 L62 1 L66 18 L73 6 L74 19 L85 8 L85 22 Z";
  const leftLaurel = <>
    <path d="M15 108 C7 98 3.5 86 4.5 72 C5.5 54 12 37 26 23" fill="none" stroke={`url(#${limeGradient})`} strokeWidth="1.25" strokeLinecap="round" />
    <use href={`#${leafId}`} transform="translate(14 104) rotate(146) scale(.98)" />
    <use href={`#${leafId}`} transform="translate(14 103) rotate(-55) scale(.92)" />
    <use href={`#${leafId}`} transform="translate(8.5 94) rotate(164) scale(1.02)" />
    <use href={`#${leafId}`} transform="translate(9.5 92) rotate(-45)" />
    <use href={`#${leafId}`} transform="translate(5.3 82.5) rotate(178)" />
    <use href={`#${leafId}`} transform="translate(6.8 80.5) rotate(-34) scale(1.03)" />
    <use href={`#${leafId}`} transform="translate(4.8 70.3) rotate(-170) scale(.98)" />
    <use href={`#${leafId}`} transform="translate(6.5 67.8) rotate(-24) scale(1.04)" />
    <use href={`#${leafId}`} transform="translate(7.4 57.7) rotate(-158) scale(.96)" />
    <use href={`#${leafId}`} transform="translate(9.5 55.2) rotate(-13)" />
    <use href={`#${leafId}`} transform="translate(11.8 45.5) rotate(-148) scale(.93)" />
    <use href={`#${leafId}`} transform="translate(14.2 43.7) rotate(-2) scale(.96)" />
    <use href={`#${leafId}`} transform="translate(18.2 34.5) rotate(-137) scale(.88)" />
    <use href={`#${leafId}`} transform="translate(20.5 33.2) rotate(10) scale(.9)" />
    <path className="badge-accolade__laurel-glint" d="M7.2 79 C5.8 68 8.3 54 13.8 43" fill="none" stroke="#F1FFA1" strokeWidth=".55" strokeLinecap="round" />
  </>;
  return <svg data-badge-accolade data-animate={animate} viewBox="0 0 124 128" preserveAspectRatio="xMidYMid meet" className="badge-accolade pointer-events-none absolute -left-[12%] -top-[18%] z-20 h-[128%] w-[124%] overflow-visible" aria-hidden="true">
    <defs>
      <linearGradient id={limeGradient} x1="0" y1="1" x2="1" y2="0">
        <stop offset="0" stopColor="#526B00" />
        <stop offset=".24" stopColor={PROGRESS_LIME} />
        <stop offset=".48" stopColor="#F1FFA1" />
        <stop offset=".68" stopColor={PROGRESS_LIME} />
        <stop offset="1" stopColor="#769800" />
      </linearGradient>
      <radialGradient id={limeOrbGradient} cx="36%" cy="25%" r="72%">
        <stop offset="0" stopColor="#F4FFB2" />
        <stop offset=".38" stopColor={PROGRESS_LIME} />
        <stop offset="1" stopColor="#5D7900" />
      </radialGradient>
      <linearGradient id={shineGradient} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#FFFFFF" stopOpacity="0" />
        <stop offset=".5" stopColor="#FFFFFF" stopOpacity=".9" />
        <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
      </linearGradient>
      <filter id={`${id}-shadow`} x="-35%" y="-35%" width="170%" height="180%">
        <feDropShadow dx="0" dy="1.8" stdDeviation="1.8" floodColor="#000000" floodOpacity=".72" />
        <feDropShadow dx="0" dy="0" stdDeviation="1" floodColor={PROGRESS_LIME} floodOpacity=".2" />
      </filter>
      <filter id={`${id}-crown-shadow`} x="-35%" y="-45%" width="170%" height="200%">
        <feDropShadow dx="0" dy="1.5" stdDeviation="1.6" floodColor="#000000" floodOpacity=".8" />
        <feDropShadow dx="0" dy="0" stdDeviation="1.1" floodColor={PROGRESS_LIME} floodOpacity=".25" />
      </filter>
      <path id={leafId} d="M0 0 C1.8 -4.5 6.8 -5.2 9.6 -1.8 C7.6 2.3 3.6 3.8 0 0 Z" fill={`url(#${limeGradient})`} stroke="#E9FF76" strokeWidth=".28" />
      <clipPath id={crownClip}><path d={crownShape} /><rect x="37" y="21" width="50" height="7" /></clipPath>
    </defs>
    <g filter={`url(#${id}-shadow)`}>
      <g className="badge-accolade__laurel badge-accolade__laurel-left"><g transform="translate(4.2 0) scale(.9 1)">{leftLaurel}</g></g>
      <g className="badge-accolade__laurel badge-accolade__laurel-right"><g transform="translate(119.8 0) scale(-.9 1)">{leftLaurel}</g></g>
    </g>
    <g className="badge-accolade__crown" filter={`url(#${id}-crown-shadow)`}>
      <path d={crownShape} fill={`url(#${limeGradient})`} stroke="#E9FF76" strokeWidth=".45" strokeLinejoin="round" />
      {[39, 51, 62, 73, 85].map((cx, index) => <circle key={cx} cx={cx} cy={[8, 6, 1, 6, 8][index]} r="2.15" fill={`url(#${limeOrbGradient})`} stroke="#E9FF76" strokeWidth=".35" />)}
      <path d="M37 22.2 H87 V25.2 H37 Z" fill={`url(#${limeGradient})`} stroke="#E9FF76" strokeWidth=".35" />
      <path d="M38.5 26.2 H85.5 V28 H38.5 Z" fill={`url(#${limeGradient})`} stroke="#E9FF76" strokeWidth=".3" />
      {[43, 49.3, 55.7, 62, 68.3, 74.7, 81].map(cx => <circle key={cx} cx={cx} cy="22.9" r="1.15" fill="#243000" stroke="#DFFF50" strokeWidth=".24" />)}
      <rect className="badge-accolade__shine" x="21" y="-5" width="9" height="38" fill={`url(#${shineGradient})`} clipPath={`url(#${crownClip})`} />
    </g>
  </svg>;
}

// Illustrations are only for the design guide, never attendance/review data.
export function EventBadgeArtwork({ badge, compact = false, illustration, celebrate = false }: { badge: EventBadge; compact?: boolean; illustration?: "reviewed" | "unreviewed" | "mostDanced"; celebrate?: boolean }) {
  const [failedUrls, setFailedUrls] = useState<string[]>([]);
  const ringPathId = `badge-ring-${useId().replaceAll(":", "")}`;
  const imageUrl = [badge.imageUrl ? badgeFlyerUrl(badge.eventId) : undefined, badge.headliner?.imageUrl ? badgeArtistImageUrl(badge.eventId, badge.headliner.id) : undefined].find(url => url && !failedUrls.includes(url));
  const reviewed = illustration ? illustration !== "unreviewed" : badge.review != null; // Zero is a saved review, not an empty state.
  const progress = badgeProgress(illustration ? (reviewed ? 4 : null) : badge.review?.generalRating);
  const mostDanced = illustration ? illustration === "mostDanced" : !!badge.mostDanced;
  const ringLabel = badgeRingLabel(badge).toLocaleUpperCase("es-UY");
  const ringFontSize = ringLabel.length > 62 ? 3 : ringLabel.length > 50 ? 3.3 : 3.5;
  const ringLetterSpacing = ringLabel.length < 46 ? 1.05 : ringLabel.length < 55 ? .82 : .62;
  const stepValue = badgeStepValue(badge.steps);
  const ratingValue = badgeRatingValue(badge.review?.generalRating);
  const djName = badgeDJ(badge).toLocaleLowerCase("es-UY");
  return (
    <div data-reviewed={reviewed} data-most-danced={mostDanced} data-illustration={illustration} className={`mx-auto w-full font-mono ${compact ? "max-w-40" : "max-w-[23rem]"}`}>
      <div data-badge-circle className="relative aspect-square w-full rounded-full bg-[#17191F] shadow-[0_20px_50px_-28px_rgba(0,0,0,.95)] ring-1 ring-[#292D36]">
        <div className="absolute inset-[15.6%] overflow-hidden rounded-full bg-[#20232B] ring-1 ring-[#2B2E36]">
          {!imageUrl && <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center font-black italic text-white/20">{badge.title[0]}</span>}
          {imageUrl && <Image key={imageUrl} src={imageUrl} alt="" width={280} height={280} unoptimized loading={compact ? "lazy" : "eager"} className="h-full w-full object-cover object-center motion-safe:transition-[filter,opacity] motion-safe:duration-300" style={{ filter: reviewed ? "none" : "saturate(.25) brightness(.8)", opacity: reviewed ? 1 : .7 }} onError={() => setFailedUrls(previous => [...previous, imageUrl])} />}
        </div>
        <svg viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
          <defs><path id={ringPathId} d="M 18.5 73.8 A 39.5 39.5 0 1 1 81.5 73.8" /></defs>
          <circle cx="50" cy="50" r="48.8" fill="none" stroke="#292D36" strokeWidth=".65" />
          <circle cx="50" cy="50" r="45.8" fill="none" stroke="#2A2D35" strokeWidth="1.55" />
          <circle cx="50" cy="50" r="34.6" fill="none" stroke="#2B2E36" strokeWidth=".75" />
          <circle cx="50" cy="50" r="45.8" fill="none" stroke={PROGRESS_LIME} strokeWidth="1.55" strokeLinecap="round" pathLength="100" strokeDasharray="100" strokeDashoffset={illustration === "mostDanced" ? 0 : 100 - progress} transform="rotate(-90 50 50)" className="motion-safe:transition-[stroke-dashoffset,opacity] motion-safe:duration-300" style={{ opacity: illustration === "mostDanced" || (reviewed && progress > 0) ? 1 : .12 }} />
          <text fill="#AEB2BA" fontFamily="var(--font-geist-mono), ui-monospace, monospace" fontSize={ringFontSize} fontWeight="400" letterSpacing={ringLetterSpacing}>
            <textPath href={`#${ringPathId}`} startOffset="50%" textAnchor="middle">{ringLabel}</textPath>
          </text>
        </svg>
        {mostDanced && <MostDancedAccolade id={`badge-accolade-${ringPathId}`} animate={!compact && celebrate} />}
        {!reviewed && <span className="absolute bottom-[13.5%] left-1/2 z-10 -translate-x-1/2 rounded-full border border-[#C6FF00]/45 bg-[#0B0D10]/90 px-2 py-0.5 text-[7px] font-medium uppercase tracking-[.12em] text-[#C6FF00] backdrop-blur-sm">Reseñar</span>}
      </div>
      {!illustration && <div className={`font-sans text-center ${compact ? "mt-2.5" : "mt-6"}`}>
        <p className="flex items-baseline justify-center whitespace-nowrap leading-none">
          <span className={`data-display text-white ${compact ? "text-[10px]" : "text-[1.65rem]"}`}>{stepValue}</span>
          <span className={`ml-1.5 font-medium tracking-[-.02em] text-[#8E929A] ${compact ? "text-[6.5px]" : "text-sm"}`}>pasos esa noche</span>
        </p>
        <p className={`mt-1.5 overflow-hidden text-ellipsis whitespace-nowrap font-medium lowercase tracking-[-.01em] text-[#7D8189] ${compact ? "text-[6px]" : "text-[11px]"}`}>tu nota <span className="data-display text-[#C6FF00]">{ratingValue}/5</span> · <span className="data-display text-[#92969E]">{djName}</span></p>
      </div>}
    </div>
  );
}
