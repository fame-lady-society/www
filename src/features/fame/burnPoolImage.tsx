import NextImage from "next/image";
import Link from "next/link";

export type BurnPoolToken = {
  tokenId: number;
  image: string;
};

/**
 * Burn-pool grid entry: keyboard-accessible link to the canonical rotate route.
 * Target identity is the token ID in the href/aria-label, independent of image success.
 */
export function BurnPoolImage({ tokenId, image }: BurnPoolToken) {
  return (
    <Link
      href={`/fame/rotate/${tokenId}`}
      aria-label={`Select Society NFT ${tokenId} for burn pool rotation`}
    >
      <NextImage
        src={image}
        alt={`Burned token ${tokenId}`}
        width={400}
        height={400}
        sizes="(min-width: 900px) 25vw, 50vw"
      />
    </Link>
  );
}
