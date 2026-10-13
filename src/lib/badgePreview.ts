import type { EventBadge } from "@/types/badges";

// Explicitly requested synthetic steps for visual QA. Never written to the DB.
const sampleSteps: Record<string, number> = {
  "6b11d7e0-6461-477f-abc6-4eb3dd7f3088": 10400,
  "aaeb5120-8a38-41be-9734-eddd9f5dd404": 18300,
  "7d8539cb-8fad-49ba-ad22-020eae33f625": 12600,
  "bf8bd8e3-6f0a-4732-8f49-8e4f90961c3e": 24200,
  "cd2f7c89-7cf3-48fa-ad3b-cd91be91894a": 31100,
  "b1de0f16-4e46-456c-9a14-f3b1a17bc968": 9700,
  "9d15f159-f9cc-49ae-8785-c2c98699d659": 38500,
};
export function badgePreview(username: string, badges: EventBadge[], development = process.env.NODE_ENV === "development"): EventBadge[] {
  if (!development || username !== "pocho") return badges;
  return badges.map(badge => {
    if (badge.source !== "manual" || badge.steps != null || sampleSteps[badge.eventId] == null) return badge;
    return { ...badge, steps: sampleSteps[badge.eventId], stepsPreview: true,
      mostDanced: badge.eventId === "9d15f159-f9cc-49ae-8785-c2c98699d659", mostDancedPreview: badge.eventId === "9d15f159-f9cc-49ae-8785-c2c98699d659" };
  });
}
