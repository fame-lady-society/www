import type { FameGalleryStatus } from "../status";

export function FameGalleryCard({ tokenId, status }: { tokenId: number; status: FameGalleryStatus }) {
  const label = status === "available" ? "Available" : status === "owned" ? "Owned" : status === "unknown" ? "Status unavailable" : null;
  return (
    <article className="overflow-hidden border border-[#a8813d]/40 bg-[#16120b] text-[#f5eddc]">
      <img
        src={`/fame/token/image/${tokenId}`}
        alt={`FAME #${tokenId}`}
        loading="lazy"
        className="aspect-square w-full object-cover"
      />
      <div className="flex items-center justify-between gap-2 p-3">
        <h2 className="text-sm font-medium">FAME #{tokenId}</h2>
        {label ? <span className="text-xs text-[#d7b979]">{label}</span> : null}
      </div>
    </article>
  );
}
