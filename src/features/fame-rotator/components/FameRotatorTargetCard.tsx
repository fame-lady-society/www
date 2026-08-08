import NextImage from "next/image";
import Link from "next/link";

export type FameRotatorTargetCardProps = {
  tokenId: number;
  image: string;
  position?: number;
};

/**
 * A visual entry point to the exact-target rotator flow. Token identity lives
 * in the link and accessible name, so a fallback image never removes a target.
 */
export function FameRotatorTargetCard({
  tokenId,
  image,
  position,
}: FameRotatorTargetCardProps) {
  return (
    <Link
      href={`/fame/rotate/${tokenId}`}
      aria-label={`Choose Society #${tokenId} for rotation`}
      className="group fame-focus block"
    >
      <span className="relative block aspect-square overflow-hidden bg-[#16140f] ring-1 ring-inset ring-[#c9aa67]/20">
        <NextImage
          src={image}
          alt={`Society #${tokenId}`}
          width={500}
          height={500}
          sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
          className="fame-artwork aspect-square w-full object-cover"
        />
        {position === undefined ? null : (
          <span className="absolute left-3 top-3 bg-[#0d0c0a]/85 px-2 py-1 font-mono text-[0.65rem] tabular-nums text-[#e4cd96] backdrop-blur">
            {String(position).padStart(2, "0")} / queue
          </span>
        )}
      </span>
      <span className="flex items-baseline justify-between gap-3 pt-3 text-sm text-[#f4eee2]">
        <span className="font-medium">Society #{tokenId}</span>
        <span className="text-xs text-[#8f8779] transition-colors group-hover:text-[#c9aa67]">
          Choose ↗
        </span>
      </span>
    </Link>
  );
}
