import { isHash, type Hash } from "viem";

export function fameMarketTokenPath(tokenId: number | bigint) {
  return `/fame/market/${tokenId.toString()}`;
}

export function parseFameMarketArtworkHash(
  rawArtworkHash: string,
): Hash | null {
  return isHash(rawArtworkHash) ? (rawArtworkHash.toLowerCase() as Hash) : null;
}

export function fameMarketArtworkPath(artworkHash: string) {
  const parsed = parseFameMarketArtworkHash(artworkHash);
  if (!parsed) throw new Error("FAME artwork hash is invalid.");
  return `/fame/art/${parsed}`;
}

export function fameMarketArtworkOrTokenPath(
  tokenId: number | bigint,
  artworkHash?: string | null,
) {
  return artworkHash
    ? fameMarketArtworkPath(artworkHash)
    : fameMarketTokenPath(tokenId);
}

export function fameMarketTokenFallbackName() {
  return "FAME Society";
}
