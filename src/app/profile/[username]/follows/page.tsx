"use client";

import { Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { FollowListScreen } from "@/components/profile/FollowListScreen";
import type { FollowListKind } from "@/types/follows";

function FollowsPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const username = decodeURIComponent(params.username as string);
  const kind: FollowListKind = searchParams.get("tab") === "following" ? "following" : "followers";
  return <FollowListScreen username={username} initialKind={kind} />;
}

/** /profile/[username]/follows?tab=followers|following: seguidores y seguidos de un perfil. */
export default function FollowsPage() {
  return (
    <Suspense fallback={null}>
      <FollowsPageContent />
    </Suspense>
  );
}
