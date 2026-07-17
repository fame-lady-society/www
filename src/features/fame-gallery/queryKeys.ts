import type { QueryClient } from "@tanstack/react-query";
import type { Address } from "viem";
import type { GalleryPoolKind } from "./types";

export const GALLERY_VISIBLE_TOKEN_BATCH_LIMIT = 24;

export type GalleryQueryIdentity = {
  chainId: number;
  galleryAddress: Address;
};

function normalizedIdentity(identity: GalleryQueryIdentity) {
  return [
    identity.chainId,
    identity.galleryAddress.toLowerCase() as Address,
  ] as const;
}

export const galleryQueryKeys = {
  all: ["fame-gallery"] as const,
  stack(identity: GalleryQueryIdentity) {
    return ["fame-gallery", ...normalizedIdentity(identity)] as const;
  },
  global(identity: GalleryQueryIdentity) {
    return [...this.stack(identity), "global"] as const;
  },
  discovery(identity: GalleryQueryIdentity) {
    return [...this.stack(identity), "discovery"] as const;
  },
  tokens(identity: GalleryQueryIdentity) {
    return [...this.stack(identity), "token"] as const;
  },
  token(identity: GalleryQueryIdentity, tokenId: bigint) {
    return [...this.tokens(identity), tokenId.toString()] as const;
  },
  accounts(identity: GalleryQueryIdentity) {
    return [...this.stack(identity), "account"] as const;
  },
  account(identity: GalleryQueryIdentity, account: Address) {
    return [
      ...this.accounts(identity),
      account.toLowerCase() as Address,
    ] as const;
  },
  authorities(identity: GalleryQueryIdentity) {
    return [...this.stack(identity), "authority"] as const;
  },
  authority(identity: GalleryQueryIdentity, account: Address) {
    return [
      ...this.authorities(identity),
      account.toLowerCase() as Address,
    ] as const;
  },
  pools(identity: GalleryQueryIdentity) {
    return [...this.stack(identity), "pool"] as const;
  },
  pool(
    identity: GalleryQueryIdentity,
    kind: GalleryPoolKind,
    tokenIds: readonly bigint[],
  ) {
    return [
      ...this.pools(identity),
      kind,
      tokenIds.map((tokenId) => tokenId.toString()),
    ] as const;
  },
};

export const GALLERY_CANONICAL_QUERY_OPTIONS = {
  staleTime: Infinity,
  refetchInterval: false,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  retry: false,
} as const;

export function chunkGalleryTokenIds(tokenIds: readonly bigint[]) {
  const unique = [...new Set(tokenIds)].sort((left, right) =>
    left < right ? -1 : left > right ? 1 : 0,
  );
  const chunks: bigint[][] = [];

  for (
    let index = 0;
    index < unique.length;
    index += GALLERY_VISIBLE_TOKEN_BATCH_LIMIT
  ) {
    chunks.push(unique.slice(index, index + GALLERY_VISIBLE_TOKEN_BATCH_LIMIT));
  }
  return chunks;
}

export async function invalidateGalleryGlobal(
  queryClient: QueryClient,
  identity: GalleryQueryIdentity,
) {
  await queryClient.invalidateQueries({
    queryKey: galleryQueryKeys.global(identity),
    exact: true,
  });
}

export async function invalidateGalleryToken(
  queryClient: QueryClient,
  identity: GalleryQueryIdentity,
  tokenId: bigint,
) {
  await queryClient.invalidateQueries({
    queryKey: galleryQueryKeys.token(identity, tokenId),
    exact: true,
  });
}

export async function invalidateGalleryAccount(
  queryClient: QueryClient,
  identity: GalleryQueryIdentity,
  account: Address,
) {
  await queryClient.invalidateQueries({
    queryKey: galleryQueryKeys.account(identity, account),
    exact: true,
  });
}
