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
      className="group block overflow-hidden rounded border border-amber-500/40 bg-black focus:outline-none focus:ring-2 focus:ring-amber-300"
    >
      <NextImage
        src={image}
        alt={`Society #${tokenId}`}
        width={400}
        height={400}
        sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
        className="aspect-square w-full object-cover transition-opacity group-hover:opacity-85"
      />
      <span className="block px-3 py-2 text-sm text-amber-50">
        Society #{tokenId}
        {position === undefined ? null : (
          <span className="ml-2 text-amber-200/70">#{position} in line</span>
        )}
      </span>
    </Link>
  );
}
