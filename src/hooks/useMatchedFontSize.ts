"use client";

import { useEffect, type RefObject } from "react";
import { largestFittingSize } from "@/lib/fitFontSize";

const MIN_SIZE = 14;
const STEP = 0.5;

/**
 * Shrinks two titles together: starts from the size their CSS classes give them
 * and, if either one would be cut with an ellipsis, lowers the font size of BOTH
 * until both fit. They always end up with exactly the same size.
 *
 * `signature` must change whenever the titles' text or visibility changes, so
 * they are measured again.
 */
export function useMatchedFontSize(
  first: RefObject<HTMLElement | null>,
  second: RefObject<HTMLElement | null>,
  signature: string,
) {
  useEffect(() => {
    const measure = () => {
      const titles = [first.current, second.current].filter(
        (el): el is HTMLElement => el !== null,
      );
      if (titles.length === 0) return;

      // Back to the size the classes define (it changes with the breakpoint).
      titles.forEach((el) => {
        el.style.fontSize = "";
      });
      const base = parseFloat(getComputedStyle(titles[0]).fontSize);
      if (!Number.isFinite(base)) return;

      const fitsAt = (size: number) => {
        titles.forEach((el) => {
          el.style.fontSize = `${size}px`;
        });
        return titles.every((el) => el.scrollWidth <= el.clientWidth + 0.5);
      };

      const size = largestFittingSize(base, MIN_SIZE, STEP, fitsAt);
      titles.forEach((el) => {
        el.style.fontSize = size === base ? "" : `${size}px`;
      });
    };

    measure();

    const observer = new ResizeObserver(measure);
    [first.current, second.current].forEach((el) => {
      if (el?.parentElement) observer.observe(el.parentElement);
    });
    // Archivo (the title font) is wider than the fallback: measure once it loads.
    void document.fonts?.ready.then(measure);

    return () => observer.disconnect();
  }, [first, second, signature]);
}
