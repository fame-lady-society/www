import type { QueryClient } from "@tanstack/react-query";
import type { Address } from "viem";

export const GALLERY_VISIBLE_TOKEN_BATCH_LIMIT = 24;

export type GalleryQueryIdentity = {
  chainId: number;
  manifestVersion: number;
  marketplaceAddress: Address;
  deploymentBlock: bigint;
};

function normalizedIdentity(identity: GalleryQueryIdentity) {
  return [
    identity.chainId,
    identity.manifestVersion,
    identity.marketplaceAddress.toLowerCase() as Address,
    identity.deploymentBlock.toString(),
  ] as const;
}

export const galleryQueryKeys = {
  all: ["fame-market"] as const,
  stack(identity: GalleryQueryIdentity) {
    return ["fame-market", ...normalizedIdentity(identity)] as const;
  },
  projection(
    identity: GalleryQueryIdentity,
    kind: string,
    blockNumber: bigint,
  ) {
    return [
      ...this.stack(identity),
      kind,
      blockNumber.toString(),
    ] as const;
  },
  global(identity: GalleryQueryIdentity, blockNumber: bigint) {
    return this.projection(identity, "global", blockNumber);
  },
  discovery(identity: GalleryQueryIdentity, blockNumber: bigint) {
    return this.projection(identity, "discovery", blockNumber);
  },
  tokens(identity: GalleryQueryIdentity, blockNumber: bigint) {
    return this.projection(identity, "token", blockNumber);
  },
  token(
    identity: GalleryQueryIdentity,
    blockNumber: bigint,
    tokenId: bigint,
  ) {
    return [
      ...this.tokens(identity, blockNumber),
      tokenId.toString(),
    ] as const;
  },
  accounts(identity: GalleryQueryIdentity, blockNumber: bigint) {
    return this.projection(identity, "account", blockNumber);
  },
  account(
    identity: GalleryQueryIdentity,
    blockNumber: bigint,
    account: Address,
  ) {
    return [
      ...this.accounts(identity, blockNumber),
      account.toLowerCase() as Address,
    ] as const;
  },
  authorities(identity: GalleryQueryIdentity, blockNumber: bigint) {
    return this.projection(identity, "authority", blockNumber);
  },
  authority(
    identity: GalleryQueryIdentity,
    blockNumber: bigint,
    account: Address,
  ) {
    return [
      ...this.authorities(identity, blockNumber),
      account.toLowerCase() as Address,
    ] as const;
  },
  pools(identity: GalleryQueryIdentity) {
    return [...this.stack(identity), "pool"] as const;
  },
  pool(
    identity: GalleryQueryIdentity,
    blockNumber: bigint,
    tokenIds?: readonly bigint[],
  ) {
    return [
      ...this.projection(identity, "pool", blockNumber),
      ...(tokenIds
        ? [tokenIds.map((tokenId) => tokenId.toString())]
        : ["collection"]),
    ] as const;
  },
};

export const GALLERY_CANONICAL_QUERY_OPTIONS = {
  staleTime: Infinity,
  refetchInterval: false,
  refetchOnMount: false,
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
    queryKey: [...galleryQueryKeys.stack(identity), "global"],
  });
}

export async function invalidateGalleryToken(
  queryClient: QueryClient,
  identity: GalleryQueryIdentity,
  tokenId: bigint,
) {
  await queryClient.invalidateQueries({
    predicate: ({ queryKey }) => {
      const prefix = galleryQueryKeys.stack(identity);
      return (
        prefix.every((value, index) => queryKey[index] === value) &&
        queryKey[prefix.length] === "token" &&
        queryKey.at(-1) === tokenId.toString()
      );
    },
  });
}

export async function invalidateGalleryAccount(
  queryClient: QueryClient,
  identity: GalleryQueryIdentity,
  account: Address,
) {
  const normalized = account.toLowerCase();
  await queryClient.invalidateQueries({
    predicate: ({ queryKey }) => {
      const prefix = galleryQueryKeys.stack(identity);
      return (
        prefix.every((value, index) => queryKey[index] === value) &&
        queryKey[prefix.length] === "account" &&
        queryKey.at(-1) === normalized
      );
    },
  });
}

export async function invalidateGalleryDiscovery(
  queryClient: QueryClient,
  identity: GalleryQueryIdentity,
) {
  await queryClient.invalidateQueries({
    queryKey: [...galleryQueryKeys.stack(identity), "discovery"],
  });
}
