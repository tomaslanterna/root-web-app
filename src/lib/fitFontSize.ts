/**
 * Largest font size between `base` and `min` (stepping down by `step`) for which
 * `fits(size)` is true. Falls back to `min` when nothing fits.
 */
export function largestFittingSize(
  base: number,
  min: number,
  step: number,
  fits: (size: number) => boolean,
): number {
  for (let size = base; size > min; size -= step) {
    if (fits(size)) return size;
  }
  return min;
}
