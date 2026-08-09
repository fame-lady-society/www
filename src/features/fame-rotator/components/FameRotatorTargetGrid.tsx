"use client";

import { useGalleryMetadata } from "@/features/fame-market/hooks/useGalleryMetadata";
import type { FameArtworkRevision } from "@/features/fame/metadata";
import { useFameArtworkRevisions } from "../hooks/useFameArtworkRevisions";
import { FameRotatorTargetCard } from "./FameRotatorTargetCard";

function HydratedTargetCard({
  tokenId,
  position,
  revision,
}: {
  tokenId: number;
  position: number;
  revision?: FameArtworkRevision;
}) {
  const metadata = useGalleryMetadata(
    revision ?? { tokenId: tokenId.toString(), tokenUri: "" },
  ).metadata;
  return (
    <FameRotatorTargetCard
      tokenId={tokenId}
      image={metadata.image}
      position={position}
    />
  );
}

export function FameRotatorTargetGrid({
  tokenIds,
  blockNumber,
}: {
  tokenIds: readonly number[];
  blockNumber: string;
}) {
  const revisions = useFameArtworkRevisions(tokenIds, blockNumber);
  return (
    <section
      className="mt-5 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 sm:gap-y-12 md:grid-cols-3 xl:grid-cols-4"
      aria-label="Waiting Society targets"
      data-testid="rotator-target-grid"
    >
      {tokenIds.map((tokenId, index) => (
        <HydratedTargetCard
          key={tokenId}
          tokenId={tokenId}
          position={index + 1}
          revision={revisions.byTokenId.get(tokenId)}
        />
      ))}
    </section>
  );
}
