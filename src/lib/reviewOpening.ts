import { generateUUID } from "./uuid";

// A browser opening is a fresh document, not a route/visibility change.
// Native background -> foreground creates a fresh opening in the same document.
let openingId: string | undefined;
export function currentReviewOpening() { return openingId ??= generateUUID(); }
export function newReviewOpening() { openingId = generateUUID(); return openingId; }
