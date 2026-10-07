export function swipeIntent(dx: number, dy: number, direction: -1 | 1) {
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 12) return "pending";
  return dx * direction > 0 && Math.abs(dx) > Math.abs(dy) * 1.5 ? "horizontal" : "cancel";
}

export function swipeThreshold(width: number) {
  return Math.min(120, Math.max(64, width * 0.2));
}
