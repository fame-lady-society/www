"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getFameArtworkRevisions } from "@/service/fame";
import { galleryMetadataQueryOptions } from "@/features/fame-market/hooks/useGalleryMetadata";
import type {
  FameArtworkRevision,
  FameMetadataResult,
} from "@/features/fame/metadata";
import type { FameGalleryArtwork } from "../catalog";

export async function refreshFameGalleryArtwork(
  tokenId: number,
  dependencies: {
    readRevisions: (tokenIds: readonly number[]) => Promise<{
      revisions: readonly FameArtworkRevision[];
    }>;
    resolveMetadata: (
      revision: FameArtworkRevision,
    ) => Promise<FameMetadataResult>;
  },
) {
  const snapshot = await dependencies.readRevisions([tokenId]);
  const revision = snapshot.revisions.find(
    ({ tokenId: revisionTokenId }) => revisionTokenId === String(tokenId),
  );
  if (!revision) throw new Error("Token artwork revision is unavailable");
  return {
    revision,
    metadata: await dependencies.resolveMetadata(revision),
  };
}

export function FameGalleryCard({ artwork }: { artwork: FameGalleryArtwork }) {
  const { metadata, tokenId, kind, artworkHash } = artwork;
  const queryClient = useQueryClient();
  const [currentMetadata, setCurrentMetadata] = useState(metadata);
  const [currentArtworkHash, setCurrentArtworkHash] = useState(artworkHash);
  const [imageFailed, setImageFailed] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState(false);
  const [refreshAttempt, setRefreshAttempt] = useState(0);
  const refreshInFlight = useRef<Promise<void> | null>(null);
  const label = kind === "owned" ? "Owned" : "Available";
  const name =
    currentMetadata.status === "ready" && currentMetadata.name
      ? currentMetadata.name
      : `FAME #${tokenId}`;
  const artworkUnavailable = currentMetadata.status !== "ready" || imageFailed;

  useEffect(() => {
    setCurrentMetadata(metadata);
    setCurrentArtworkHash(artworkHash);
    setImageFailed(false);
    setRefreshError(false);
    setRefreshAttempt(0);
  }, [artworkHash, metadata]);

  function refreshArtwork() {
    if (refreshInFlight.current) return refreshInFlight.current;
    setIsRefreshing(true);
    setRefreshError(false);
    const refresh = refreshFameGalleryArtwork(tokenId, {
      readRevisions: getFameArtworkRevisions,
      resolveMetadata: (revision) =>
        queryClient.fetchQuery(galleryMetadataQueryOptions(revision)),
    })
      .then((refreshed) => {
        setCurrentMetadata(refreshed.metadata);
        setCurrentArtworkHash(refreshed.revision.artworkHash ?? artworkHash);
        setRefreshAttempt((attempt) => attempt + 1);
        setImageFailed(false);
      })
      .catch(() => {
        setRefreshError(true);
      })
      .finally(() => {
        if (refreshInFlight.current === refresh) {
          refreshInFlight.current = null;
          setIsRefreshing(false);
        }
      });
    refreshInFlight.current = refresh;
    return refresh;
  }

  return (
    <article
      className="group text-[#f4eee2]"
      data-artwork-hash={currentArtworkHash}
    >
      <div className="relative aspect-square w-full overflow-hidden bg-[#16140f] ring-1 ring-inset ring-[#c9aa67]/20">
        {!artworkUnavailable ? (
          <Image
            key={refreshAttempt}
            src={currentMetadata.image}
            alt={`${name} artwork`}
            fill
            sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="fame-artwork object-cover"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col justify-end bg-[radial-gradient(circle_at_18%_18%,rgba(201,170,103,0.12),transparent_38%),#11100d] p-4 sm:p-5">
            <div className="mb-auto flex h-10 w-10 items-center justify-center rounded-full border border-[#c9aa67]/35 text-[#c9aa67]">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M7.5 7.5 16.5 16.5M16.5 7.5l-9 9" />
              </svg>
            </div>
            <p className="text-[0.64rem] font-bold uppercase tracking-[0.16em] text-[#c9aa67]">
              Artwork unavailable
            </p>
            <p className="mt-2 max-w-52 text-xs leading-5 text-[#9f9789]">
              {currentMetadata.status === "ready"
                ? "The token image did not load."
                : "The token metadata did not load."}
            </p>
            {refreshError ? (
              <p className="mt-2 text-xs text-[#d9b977]" role="status">
                Refresh failed. Try again.
              </p>
            ) : null}
            <button
              type="button"
              className="fame-action fame-focus mt-4 inline-flex min-h-10 w-fit items-center border border-[#c9aa67]/70 px-4 text-xs font-bold uppercase tracking-[0.12em] text-[#f4eee2] hover:border-[#c9aa67] hover:bg-[#c9aa67]/10 disabled:cursor-wait disabled:opacity-60"
              disabled={isRefreshing}
              onClick={() => void refreshArtwork()}
            >
              {isRefreshing ? "Refreshing…" : "Refresh artwork"}
            </button>
          </div>
        )}
        <span className="absolute left-3 top-3 bg-[#0d0c0a]/85 px-2 py-1 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-[#e4cd96] backdrop-blur">
          {label}
        </span>
      </div>
      <div className="flex items-baseline justify-between gap-3 pt-3">
        <h2 className="text-sm font-medium tracking-[-0.01em]">{name}</h2>
        <span className="font-mono text-[0.68rem] tabular-nums text-[#8f8779]">
          #{tokenId}
        </span>
      </div>
    </article>
  );
}
