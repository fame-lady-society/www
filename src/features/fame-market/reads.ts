import {
  isAddress,
  isAddressEqual,
  isHash,
  type Address,
  type Hash,
} from "viem";
import {
  creatorArtistMagicAbi,
  fameAbi,
  fameMirrorAbi,
  universalPoolArtMarketplaceAbi,
} from "../../wagmi";
import { BASE_SEPOLIA_TEST_GALLERY_CONFIG } from "./config/baseSepoliaTestGallery";
import type { GalleryRuntimeConfig } from "./config/galleryRuntime";
import type {
  GalleryAccountState,
  GalleryArtworkTarget,
  GalleryAuthorityState,
  GalleryCustodyState,
  GalleryGlobalState,
  GalleryPoolState,
  GalleryProjectionFailure,
  GalleryProjectionResult,
  GalleryTargetKind,
  GalleryTokenState,
} from "./types";

export type GalleryMulticallContract = {
  address: Address;
  abi: readonly unknown[];
  functionName: string;
  args?: readonly unknown[];
};

export type GalleryMulticallResult =
  | { status: "success"; result: unknown }
  | { status: "failure"; error?: unknown };

export type GalleryMulticallClient = {
  getBlockNumber: () => Promise<bigint>;
  multicall: (input: {
    allowFailure: true;
    blockNumber: bigint;
    contracts: readonly GalleryMulticallContract[];
  }) => Promise<readonly GalleryMulticallResult[]>;
};

export type GalleryReadAddresses = {
  marketplace: Address;
  fame: Address;
  mirror: Address;
  creatorMagic: Address;
};

/** A deliberately small, block-pinned authority read for the FAME landing. */
export type MarketplaceLandingAuthority = Readonly<{
  marketplace: Address;
  fame: Address;
  mirror: Address;
  creatorMagic: Address;
  paused: boolean;
  premium: bigint;
  totalProviderUnits: bigint;
  activeProviderCount: bigint;
  inventory: bigint;
  unit: bigint;
  totalSupply: bigint;
  decimals: number;
}>;

export const GALLERY_POOL_SCAN_BATCH_SIZE = 64;
export const GALLERY_POOL_SCAN_CONCURRENCY = 2;

const DEFAULT_ADDRESSES: GalleryReadAddresses = {
  marketplace: BASE_SEPOLIA_TEST_GALLERY_CONFIG.addresses.gallery,
  fame: BASE_SEPOLIA_TEST_GALLERY_CONFIG.addresses.fame,
  mirror: BASE_SEPOLIA_TEST_GALLERY_CONFIG.addresses.mirror,
  creatorMagic: BASE_SEPOLIA_TEST_GALLERY_CONFIG.addresses.creatorMagic,
};

export function galleryReadAddresses(
  addresses: GalleryRuntimeConfig["addresses"],
): GalleryReadAddresses {
  return {
    marketplace: addresses.gallery,
    fame: addresses.fame,
    mirror: addresses.mirror,
    creatorMagic: addresses.creatorMagic,
  };
}

function failure(
  message: string,
  blockNumber: bigint | null,
): GalleryProjectionFailure {
  return { status: "failure", blockNumber, message };
}

function successfulResult(result: GalleryMulticallResult | undefined) {
  return result?.status === "success" ? result.result : null;
}

function isAddressValue(value: unknown): value is Address {
  return typeof value === "string" && isAddress(value, { strict: false });
}

function isBigint(value: unknown): value is bigint {
  return typeof value === "bigint";
}

function isHashValue(value: unknown): value is Hash {
  return typeof value === "string" && isHash(value);
}

export async function captureGalleryBlock(client: GalleryMulticallClient) {
  return client.getBlockNumber();
}

export async function readGalleryGlobalState(
  client: GalleryMulticallClient,
  blockNumber: bigint,
  addresses: GalleryReadAddresses = DEFAULT_ADDRESSES,
): Promise<GalleryProjectionResult<GalleryGlobalState>> {
  try {
    const results = await client.multicall({
      allowFailure: true,
      blockNumber,
      contracts: [
        {
          address: addresses.marketplace,
          abi: universalPoolArtMarketplaceAbi,
          functionName: "fame",
        },
        {
          address: addresses.marketplace,
          abi: universalPoolArtMarketplaceAbi,
          functionName: "mirror",
        },
        {
          address: addresses.marketplace,
          abi: universalPoolArtMarketplaceAbi,
          functionName: "creatorMagic",
        },
        {
          address: addresses.marketplace,
          abi: universalPoolArtMarketplaceAbi,
          functionName: "owner",
        },
        {
          address: addresses.marketplace,
          abi: universalPoolArtMarketplaceAbi,
          functionName: "paused",
        },
        {
          address: addresses.marketplace,
          abi: universalPoolArtMarketplaceAbi,
          functionName: "premium",
        },
        {
          address: addresses.marketplace,
          abi: universalPoolArtMarketplaceAbi,
          functionName: "communityFee",
        },
        {
          address: addresses.marketplace,
          abi: universalPoolArtMarketplaceAbi,
          functionName: "providerFee",
        },
        {
          address: addresses.marketplace,
          abi: universalPoolArtMarketplaceAbi,
          functionName: "totalProviderUnits",
        },
        {
          address: addresses.marketplace,
          abi: universalPoolArtMarketplaceAbi,
          functionName: "activeProviderCount",
        },
        {
          address: addresses.marketplace,
          abi: universalPoolArtMarketplaceAbi,
          functionName: "activeProviderCap",
        },
        {
          address: addresses.marketplace,
          abi: universalPoolArtMarketplaceAbi,
          functionName: "feeRecipient",
        },
        {
          address: addresses.marketplace,
          abi: universalPoolArtMarketplaceAbi,
          functionName: "inventory",
        },
        {
          address: addresses.fame,
          abi: fameAbi,
          functionName: "unit",
        },
      ],
    });
    const values = results.map(successfulResult);
    const [
      fame,
      mirror,
      creatorMagic,
      owner,
      paused,
      premium,
      communityFee,
      providerFee,
      totalProviderUnits,
      activeProviderCount,
      activeProviderCap,
      feeRecipient,
      inventory,
      unit,
    ] = values;
    if (
      values.length !== 14 ||
      !isAddressValue(fame) ||
      !isAddressValue(mirror) ||
      !isAddressValue(creatorMagic) ||
      !isAddressValue(owner) ||
      typeof paused !== "boolean" ||
      !isBigint(premium) ||
      !isBigint(communityFee) ||
      !isBigint(providerFee) ||
      !isBigint(totalProviderUnits) ||
      !isBigint(activeProviderCount) ||
      !isBigint(activeProviderCap) ||
      !isAddressValue(feeRecipient) ||
      !isBigint(inventory) ||
      !isBigint(unit)
    ) {
      return failure("Gallery global state is incomplete", blockNumber);
    }
    return {
      status: "success",
      blockNumber,
      data: {
        marketplace: addresses.marketplace,
        fame,
        mirror,
        creatorMagic,
        owner,
        paused,
        premium,
        communityFee,
        providerFee,
        totalProviderUnits,
        activeProviderCount,
        activeProviderCap,
        feeRecipient,
        inventory,
        unit,
      },
    };
  } catch {
    return failure("Gallery global state is unavailable", blockNumber);
  }
}

function chunkIds(tokenIds: readonly bigint[], size: number) {
  const chunks: bigint[][] = [];
  for (let index = 0; index < tokenIds.length; index += size) {
    chunks.push(tokenIds.slice(index, index + size));
  }
  return chunks;
}

export async function runGalleryBatchedReads(
  client: GalleryMulticallClient,
  blockNumber: bigint,
  tokenIds: readonly bigint[],
  contractsFor: (tokenId: bigint) => readonly GalleryMulticallContract[],
) {
  const chunks = chunkIds(tokenIds, GALLERY_POOL_SCAN_BATCH_SIZE);
  const results = new Array<readonly GalleryMulticallResult[]>(chunks.length);
  let nextChunk = 0;
  const worker = async () => {
    while (nextChunk < chunks.length) {
      const index = nextChunk;
      nextChunk += 1;
      const chunk = chunks[index] ?? [];
      results[index] = await client.multicall({
        allowFailure: true,
        blockNumber,
        contracts: chunk.flatMap(contractsFor),
      });
    }
  };
  await Promise.all(
    Array.from(
      { length: Math.min(GALLERY_POOL_SCAN_CONCURRENCY, chunks.length) },
      worker,
    ),
  );
  return chunks.flatMap((chunk, index) => {
    const width = chunk.length === 0 ? 0 : contractsFor(chunk[0]!).length;
    const chunkResults = results[index] ?? [];
    return chunk.map((tokenId, tokenIndex) => ({
      tokenId,
      results: chunkResults.slice(
        tokenIndex * width,
        tokenIndex * width + width,
      ),
    }));
  });
}

function poolTarget(
  kind: Extract<GalleryTargetKind, "mint" | "burn">,
  tokenId: bigint,
  results: readonly GalleryMulticallResult[],
): GalleryArtworkTarget {
  const rawHash = successfulResult(results[0]);
  const rawTokenUri = successfulResult(results[1]);
  const artworkHash = isHashValue(rawHash) ? rawHash : null;
  const tokenUri = typeof rawTokenUri === "string" ? rawTokenUri : null;
  const artworkError =
    artworkHash === null
      ? "Artwork identity is unavailable"
      : tokenUri === null
        ? "Artwork metadata is unavailable"
        : null;
  return {
    targetId: `pool:${kind}:${tokenId.toString()}`,
    kind,
    tokenId,
    artworkHash,
    tokenUri,
    artworkError,
  };
}

export function galleryCollectionTokenIds({
  firstTokenId,
  lastTokenId,
}: {
  firstTokenId: number;
  lastTokenId: number;
}) {
  const ids: bigint[] = [];
  const first = BigInt(firstTokenId);
  const last = BigInt(lastTokenId);
  for (let tokenId = first; tokenId <= last; tokenId += 1n) {
    ids.push(tokenId);
  }
  return ids;
}

export async function readGalleryPoolState(
  client: GalleryMulticallClient,
  blockNumber: bigint,
  tokenIds: readonly bigint[] = galleryCollectionTokenIds(
    BASE_SEPOLIA_TEST_GALLERY_CONFIG.collection,
  ),
  addresses: GalleryReadAddresses = DEFAULT_ADDRESSES,
): Promise<GalleryProjectionResult<GalleryPoolState>> {
  try {
    const membership = await runGalleryBatchedReads(
      client,
      blockNumber,
      tokenIds,
      (tokenId) => [
        {
          address: addresses.creatorMagic,
          abi: creatorArtistMagicAbi,
          functionName: "isTokenInMintPool",
          args: [tokenId],
        },
        {
          address: addresses.creatorMagic,
          abi: creatorArtistMagicAbi,
          functionName: "isTokenInBurnedPool",
          args: [tokenId],
        },
      ],
    );
    const eligible: {
      tokenId: bigint;
      kind: Extract<GalleryTargetKind, "mint" | "burn">;
    }[] = [];
    const failedMembershipTokenIds: bigint[] = [];
    const ambiguousTokenIds: bigint[] = [];
    for (const candidate of membership) {
      const mint = successfulResult(candidate.results[0]);
      const burn = successfulResult(candidate.results[1]);
      if (typeof mint !== "boolean" || typeof burn !== "boolean") {
        failedMembershipTokenIds.push(candidate.tokenId);
      } else if (mint && burn) {
        ambiguousTokenIds.push(candidate.tokenId);
      } else if (mint || burn) {
        eligible.push({
          tokenId: candidate.tokenId,
          kind: mint ? "mint" : "burn",
        });
      }
    }

    const hydration = await runGalleryBatchedReads(
      client,
      blockNumber,
      eligible.map(({ tokenId }) => tokenId),
      (tokenId) => [
        {
          address: addresses.marketplace,
          abi: universalPoolArtMarketplaceAbi,
          functionName: "artworkHash",
          args: [tokenId],
        },
        {
          address: addresses.creatorMagic,
          abi: creatorArtistMagicAbi,
          functionName: "tokenURI",
          args: [tokenId],
        },
      ],
    );
    const targets = eligible.map(({ kind, tokenId }, index) =>
      poolTarget(kind, tokenId, hydration[index]?.results ?? []),
    );
    return {
      status: "success",
      blockNumber,
      data: { targets, failedMembershipTokenIds, ambiguousTokenIds },
    };
  } catch {
    return failure("Gallery pool state is unavailable", blockNumber);
  }
}

export async function readGalleryCustodyStates(
  client: GalleryMulticallClient,
  blockNumber: bigint,
  tokenIds: readonly bigint[],
  addresses: GalleryReadAddresses = DEFAULT_ADDRESSES,
) {
  try {
    const ownership = await runGalleryBatchedReads(
      client,
      blockNumber,
      tokenIds,
      (tokenId) => [
        {
          address: addresses.mirror,
          abi: fameMirrorAbi,
          functionName: "ownerAt",
          args: [tokenId],
        },
      ],
    );
    return new Map<bigint, GalleryProjectionResult<GalleryCustodyState>>(
      ownership.map(({ tokenId, results }) => {
        const owner = successfulResult(results[0]);
        return isAddressValue(owner)
          ? [
              tokenId,
              {
                status: "success" as const,
                blockNumber,
                data: {
                  tokenId,
                  owner,
                  marketplaceHeld: isAddressEqual(owner, addresses.marketplace),
                },
              },
            ]
          : [
              tokenId,
              failure(
                `Gallery token ${tokenId} ownership is unavailable`,
                blockNumber,
              ),
            ];
      }),
    );
  } catch {
    return new Map<bigint, GalleryProjectionResult<GalleryCustodyState>>(
      tokenIds.map((tokenId) => [
        tokenId,
        failure(
          `Gallery token ${tokenId} ownership is unavailable`,
          blockNumber,
        ),
      ]),
    );
  }
}

export async function readGalleryTokenStates(
  client: GalleryMulticallClient,
  blockNumber: bigint,
  tokenIds: readonly bigint[],
  addresses: GalleryReadAddresses = DEFAULT_ADDRESSES,
) {
  const custody = await readGalleryCustodyStates(
    client,
    blockNumber,
    tokenIds,
    addresses,
  );
  const heldIds = tokenIds.filter((tokenId) => {
    const state = custody.get(tokenId);
    return state?.status === "success" && state.data.marketplaceHeld;
  });
  let hydration: Awaited<ReturnType<typeof runGalleryBatchedReads>> = [];
  try {
    hydration = await runGalleryBatchedReads(
      client,
      blockNumber,
      heldIds,
      (tokenId) => [
        {
          address: addresses.marketplace,
          abi: universalPoolArtMarketplaceAbi,
          functionName: "artworkHash",
          args: [tokenId],
        },
        {
          address: addresses.creatorMagic,
          abi: creatorArtistMagicAbi,
          functionName: "tokenURI",
          args: [tokenId],
        },
      ],
    );
  } catch {
    hydration = [];
  }
  const hydrated = new Map(hydration.map((entry) => [entry.tokenId, entry]));
  return new Map<bigint, GalleryProjectionResult<GalleryTokenState>>(
    tokenIds.map((tokenId) => {
      const custodyState = custody.get(tokenId);
      if (!custodyState || custodyState.status === "failure") {
        return [
          tokenId,
          custodyState ??
            failure(
              `Gallery token ${tokenId} ownership is unavailable`,
              blockNumber,
            ),
        ];
      }
      const raw = hydrated.get(tokenId)?.results ?? [];
      const artworkHash = isHashValue(successfulResult(raw[0]))
        ? (successfulResult(raw[0]) as Hash)
        : null;
      const rawTokenUri = successfulResult(raw[1]);
      const tokenUri = typeof rawTokenUri === "string" ? rawTokenUri : null;
      const artworkError = !custodyState.data.marketplaceHeld
        ? null
        : artworkHash === null
          ? "Artwork identity is unavailable"
          : tokenUri === null
            ? "Artwork metadata is unavailable"
            : null;
      return [
        tokenId,
        {
          status: "success" as const,
          blockNumber,
          data: {
            ...custodyState.data,
            artworkHash,
            tokenUri,
            artworkError,
          },
        },
      ];
    }),
  );
}

export async function readGalleryTokenState(
  client: GalleryMulticallClient,
  blockNumber: bigint,
  tokenId: bigint,
  addresses: GalleryReadAddresses = DEFAULT_ADDRESSES,
) {
  const states = await readGalleryTokenStates(
    client,
    blockNumber,
    [tokenId],
    addresses,
  );
  return (
    states.get(tokenId) ??
    failure(`Gallery token ${tokenId} state is unavailable`, blockNumber)
  );
}

export async function readGalleryAccountState(
  client: GalleryMulticallClient,
  blockNumber: bigint,
  account: Address,
  addresses: GalleryReadAddresses = DEFAULT_ADDRESSES,
): Promise<GalleryProjectionResult<GalleryAccountState>> {
  try {
    const results = await client.multicall({
      allowFailure: true,
      blockNumber,
      contracts: [
        {
          address: addresses.fame,
          abi: fameAbi,
          functionName: "balanceOf",
          args: [account],
        },
        {
          address: addresses.fame,
          abi: fameAbi,
          functionName: "allowance",
          args: [account, addresses.marketplace],
        },
      ],
    });
    const balance = successfulResult(results[0]);
    const allowance = successfulResult(results[1]);
    if (!isBigint(balance) || !isBigint(allowance)) {
      return failure("Gallery account state is incomplete", blockNumber);
    }
    return {
      status: "success",
      blockNumber,
      data: { account, balance, allowance },
    };
  } catch {
    return failure("Gallery account state is unavailable", blockNumber);
  }
}

export async function readGalleryAuthority(
  client: GalleryMulticallClient,
  blockNumber: bigint,
  account: Address,
  addresses: GalleryReadAddresses = DEFAULT_ADDRESSES,
): Promise<GalleryProjectionResult<GalleryAuthorityState>> {
  try {
    const results = await client.multicall({
      allowFailure: true,
      blockNumber,
      contracts: [
        {
          address: addresses.marketplace,
          abi: universalPoolArtMarketplaceAbi,
          functionName: "owner",
        },
      ],
    });
    const owner = successfulResult(results[0]);
    if (!isAddressValue(owner)) {
      return failure("Gallery owner is unavailable", blockNumber);
    }
    return {
      status: "success",
      blockNumber,
      data: {
        account,
        owner,
        authority: isAddressEqual(owner, account) ? "owner" : "denied",
      },
    };
  } catch {
    return failure("Gallery owner is unavailable", blockNumber);
  }
}

export async function readMarketplaceLandingAuthority(
  client: GalleryMulticallClient,
  blockNumber: bigint,
  addresses: GalleryReadAddresses,
): Promise<GalleryProjectionResult<MarketplaceLandingAuthority>> {
  try {
    const results = await client.multicall({
      allowFailure: true,
      blockNumber,
      contracts: [
        { address: addresses.marketplace, abi: universalPoolArtMarketplaceAbi, functionName: "fame" },
        { address: addresses.marketplace, abi: universalPoolArtMarketplaceAbi, functionName: "mirror" },
        { address: addresses.marketplace, abi: universalPoolArtMarketplaceAbi, functionName: "creatorMagic" },
        { address: addresses.marketplace, abi: universalPoolArtMarketplaceAbi, functionName: "paused" },
        { address: addresses.marketplace, abi: universalPoolArtMarketplaceAbi, functionName: "premium" },
        { address: addresses.marketplace, abi: universalPoolArtMarketplaceAbi, functionName: "totalProviderUnits" },
        { address: addresses.marketplace, abi: universalPoolArtMarketplaceAbi, functionName: "activeProviderCount" },
        { address: addresses.marketplace, abi: universalPoolArtMarketplaceAbi, functionName: "inventory" },
        { address: addresses.fame, abi: fameAbi, functionName: "unit" },
        { address: addresses.fame, abi: fameAbi, functionName: "totalSupply" },
        { address: addresses.fame, abi: fameAbi, functionName: "decimals" },
      ],
    });
    const values = results.map(successfulResult);
    const [fame, mirror, creatorMagic, paused, premium, totalProviderUnits, activeProviderCount, inventory, unit, totalSupply, decimals] = values;
    if (
      values.length !== 11 ||
      !isAddressValue(fame) || !isAddressEqual(fame, addresses.fame) ||
      !isAddressValue(mirror) || !isAddressEqual(mirror, addresses.mirror) ||
      !isAddressValue(creatorMagic) || !isAddressEqual(creatorMagic, addresses.creatorMagic) ||
      typeof paused !== "boolean" || !isBigint(premium) || !isBigint(totalProviderUnits) ||
      !isBigint(activeProviderCount) || !isBigint(inventory) || !isBigint(unit) ||
      !isBigint(totalSupply) || typeof decimals !== "number" || !Number.isInteger(decimals) || decimals < 0 || decimals > 255
    ) return failure("Marketplace landing authority is incomplete or mismatched", blockNumber);
    return { status: "success", blockNumber, data: { marketplace: addresses.marketplace, fame, mirror, creatorMagic, paused, premium, totalProviderUnits, activeProviderCount, inventory, unit, totalSupply, decimals } };
  } catch {
    return failure("Marketplace landing authority is unavailable", blockNumber);
  }
}
