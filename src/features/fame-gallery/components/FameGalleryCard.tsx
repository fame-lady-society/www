import Image from "next/image";
import type { FameGalleryArtwork } from "../catalog";

export function FameGalleryCard({ artwork }: { artwork: FameGalleryArtwork }) {
  const { metadata, tokenId, kind, artworkHash } = artwork;
  const label = kind === "owned" ? "Owned" : "Available";
  const name =
    metadata.status === "ready" && metadata.name
      ? metadata.name
      : `FAME #${tokenId}`;
  return (
    <article
      className="overflow-hidden border border-[#a8813d]/40 bg-[#16120b] text-[#f5eddc]"
      data-artwork-hash={artworkHash}
    >
      <div className="relative aspect-square w-full">
        <Image
          src={metadata.image}
          alt={
            metadata.status === "ready"
              ? `${name} artwork`
              : "Artwork unavailable"
          }
          fill
          sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          className="object-cover"
        />
      </div>
      <div className="flex items-center justify-between gap-2 p-3">
        <h2 className="text-sm font-medium">{name}</h2>
        <span className="text-xs text-[#d7b979]">{label}</span>
      </div>
    </article>
  );
}
