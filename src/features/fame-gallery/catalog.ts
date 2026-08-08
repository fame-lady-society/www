import {
  isAddress,
  isAddressEqual,
  isHash,
  zeroAddress,
  type Abi,
  type Address,
  type Hash,
} from "viem";
import { base } from "viem/chains";
import { client as baseClient } from "@/viem/base-client";
import {
  baseUniversalMarketplaceAddress,
  creatorArtistMagicAddress,
  societyFromNetwork,
} from "@/features/fame/contract";
import {
  creatorArtistMagicAbi,
  fameMirrorAbi,
  universalPoolArtMarketplaceAbi,
} from "@/wagmi";
import { loadGalleryMetadata } from "@/features/fame-market/metadata/galleryMetadata";
import type { GalleryMetadataResult } from "@/features/fame-market/metadata/testMetadata";
import {
  FAME_COLLECTION_FIRST_TOKEN_ID,
  FAME_COLLECTION_LAST_TOKEN_ID,
} from "@/features/fame/collection";

const CATALOG_BATCH_SIZE = 64;
const CATALOG_READ_CONCURRENCY = 2;
const METADATA_RESOLVE_CONCURRENCY = 8;
export const FAME_GALLERY_PAGE_SCAN_SIZE = 24;

export type FameGalleryArtwork = {
  tokenId: number;
  kind: "mint" | "burn" | "owned";
  owner: Address | null;
  artworkHash: Hash;
  tokenUri: string;
  metadata: GalleryMetadataResult;
};

export type FameGalleryCatalogResult = {
  blockNumber: bigint;
  artworks: FameGalleryArtwork[];
  nextCursor: number | null;
};

export type FameGalleryCatalogPage = {
  blockNumber: string;
  artworks: FameGalleryArtwork[];
  nextCursor: number | null;
};

export function serializeFameGalleryCatalog(
  result: FameGalleryCatalogResult,
): FameGalleryCatalogPage {
  return {
    blockNumber: result.blockNumber.toString(),
    artworks: result.artworks,
    nextCursor: result.nextCursor,
  };
}

type CatalogContract = {
  address: Address;
  abi: Abi;
  functionName: string;
  args?: readonly unknown[];
};

type CatalogResult =
  | { status: "success"; result: unknown }
  | { status: "failure"; error?: unknown };

export type FameGalleryCatalogClient = {
  getBlockNumber(): Promise<bigint>;
  multicall(input: {
    allowFailure: true;
    blockNumber: bigint;
    contracts: readonly CatalogContract[];
  }): Promise<readonly CatalogResult[]>;
};

export type FameGalleryCatalogOptions = {
  marketplace?: Address;
  cursor?: number;
  blockNumber?: bigint;
  pageSize?: number;
};

const productionClient = baseClient as unknown as FameGalleryCatalogClient;

function successfulResult(result: CatalogResult | undefined) {
  return result?.status === "success" ? result.result : null;
}

function isAddressValue(value: unknown): value is Address {
  return typeof value === "string" && isAddress(value, { strict: false });
}

function asSafeBigint(value: unknown): bigint | null {
  if (typeof value === "bigint") return value;
  if (typeof value === "number" && Number.isSafeInteger(value) && value >= 0) {
    return BigInt(value);
  }
  return null;
}

function isNonZeroHash(value: unknown): value is Hash {
  return (
    typeof value === "string" &&
    isHash(value) &&
    value !== `0x${"0".repeat(64)}`
  );
}

function candidateTokenIds(
  nextTokenId: bigint,
  artPoolStart: bigint,
  artPoolEnd: bigint,
  cursor: number | undefined,
  pageSize: number,
) {
  if (
    nextTokenId < BigInt(FAME_COLLECTION_FIRST_TOKEN_ID) ||
    nextTokenId > BigInt(FAME_COLLECTION_LAST_TOKEN_ID + 1) ||
    artPoolStart < BigInt(FAME_COLLECTION_FIRST_TOKEN_ID) ||
    artPoolEnd > BigInt(FAME_COLLECTION_LAST_TOKEN_ID) ||
    artPoolStart > artPoolEnd
  ) {
    throw new Error("CreatorArtistMagic returned invalid gallery boundaries.");
  }

  const startTokenId = BigInt(cursor ?? FAME_COLLECTION_FIRST_TOKEN_ID);
  if (
    startTokenId < BigInt(FAME_COLLECTION_FIRST_TOKEN_ID) ||
    startTokenId > nextTokenId
  ) {
    throw new Error("CreatorArtistMagic returned an invalid gallery cursor.");
  }

  const endTokenId = startTokenId + BigInt(pageSize);
  const ids: bigint[] = [];
  for (
    let tokenId = startTokenId;
    tokenId < nextTokenId && tokenId < endTokenId;
    tokenId += 1n
  ) {
    if (tokenId < artPoolStart || tokenId > artPoolEnd) ids.push(tokenId);
  }
  return {
    ids,
    nextCursor: endTokenId < nextTokenId ? Number(endTokenId) : null,
  };
}

function chunk<T>(values: readonly T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
}

async function batchedReads(
  client: FameGalleryCatalogClient,
  blockNumber: bigint,
  tokenIds: readonly bigint[],
  contractsFor: (tokenId: bigint) => readonly CatalogContract[],
) {
  const chunks = chunk(tokenIds, CATALOG_BATCH_SIZE);
  const results = new Array<readonly CatalogResult[]>(chunks.length);
  let nextChunk = 0;

  const worker = async () => {
    while (nextChunk < chunks.length) {
      const index = nextChunk;
      nextChunk += 1;
      const tokenChunk = chunks[index] ?? [];
      results[index] = await client.multicall({
        allowFailure: true,
        blockNumber,
        contracts: tokenChunk.flatMap(contractsFor),
      });
    }
  };

  await Promise.all(
    Array.from(
      { length: Math.min(CATALOG_READ_CONCURRENCY, chunks.length) },
      worker,
    ),
  );

  return chunks.flatMap((tokenChunk, index) => {
    const width =
      tokenChunk.length > 0 ? contractsFor(tokenChunk[0]!).length : 0;
    const chunkResults = results[index] ?? [];
    return tokenChunk.map((tokenId, tokenIndex) => ({
      tokenId,
      results: chunkResults.slice(
        tokenIndex * width,
        tokenIndex * width + width,
      ),
    }));
  });
}

async function resolveMetadata(artwork: {
  tokenId: bigint;
  kind: FameGalleryArtwork["kind"];
  owner: Address | null;
  artworkHash: Hash;
  tokenUri: string;
}) {
  return {
    tokenId: Number(artwork.tokenId),
    kind: artwork.kind,
    owner: artwork.owner,
    artworkHash: artwork.artworkHash,
    tokenUri: artwork.tokenUri,
    metadata: await loadGalleryMetadata(artwork.tokenUri),
  } satisfies FameGalleryArtwork;
}

async function resolveMetadataBatch(
  artworks: readonly Parameters<typeof resolveMetadata>[0][],
) {
  const resolved = new Array<FameGalleryArtwork>(artworks.length);
  let nextArtwork = 0;
  const worker = async () => {
    while (nextArtwork < artworks.length) {
      const index = nextArtwork;
      nextArtwork += 1;
      resolved[index] = await resolveMetadata(artworks[index]!);
    }
  };

  await Promise.all(
    Array.from(
      { length: Math.min(METADATA_RESOLVE_CONCURRENCY, artworks.length) },
      worker,
    ),
  );
  return resolved;
}

export async function readFameGalleryCatalog(
  client: FameGalleryCatalogClient = productionClient,
  options: FameGalleryCatalogOptions = {},
): Promise<FameGalleryCatalogResult> {
  const pageSize = options.pageSize ?? FAME_GALLERY_PAGE_SCAN_SIZE;
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 128) {
    throw new Error("Gallery page size is invalid.");
  }
  const blockNumber = options.blockNumber ?? (await client.getBlockNumber());
  const creatorMagic = creatorArtistMagicAddress(base.id);
  const mirror = societyFromNetwork(base.id);
  const marketplace = options.marketplace ?? baseUniversalMarketplaceAddress;

  const boundaries = await client.multicall({
    allowFailure: true,
    blockNumber,
    contracts: [
      {
        address: creatorMagic,
        abi: creatorArtistMagicAbi,
        functionName: "nextTokenId",
      },
      {
        address: creatorMagic,
        abi: creatorArtistMagicAbi,
        functionName: "artPoolStartIndex",
      },
      {
        address: creatorMagic,
        abi: creatorArtistMagicAbi,
        functionName: "artPoolEndIndex",
      },
    ],
  });
  const nextTokenId = asSafeBigint(successfulResult(boundaries[0]));
  const artPoolStart = asSafeBigint(successfulResult(boundaries[1]));
  const artPoolEnd = asSafeBigint(successfulResult(boundaries[2]));
  if (nextTokenId === null || artPoolStart === null || artPoolEnd === null) {
    throw new Error("CreatorArtistMagic gallery boundaries are unavailable.");
  }

  // This is the visibility gate. Art Pool IDs are removed before any owner,
  // pool, tokenURI, metadata, or image work is constructed.
  const tokenPage = candidateTokenIds(
    nextTokenId,
    artPoolStart,
    artPoolEnd,
    options.cursor,
    pageSize,
  );
  const tokenIds = tokenPage.ids;
  const membership = await batchedReads(
    client,
    blockNumber,
    tokenIds,
    (tokenId) => [
      {
        address: creatorMagic,
        abi: creatorArtistMagicAbi,
        functionName: "isTokenInMintPool",
        args: [tokenId],
      },
      {
        address: creatorMagic,
        abi: creatorArtistMagicAbi,
        functionName: "isTokenInBurnedPool",
        args: [tokenId],
      },
      {
        address: mirror,
        abi: fameMirrorAbi,
        functionName: "ownerAt",
        args: [tokenId],
      },
    ],
  );

  const eligible: {
    tokenId: bigint;
    kind: FameGalleryArtwork["kind"];
    owner: Address | null;
  }[] = [];
  for (const candidate of membership) {
    const mint = successfulResult(candidate.results[0]);
    const burn = successfulResult(candidate.results[1]);
    const rawOwner = successfulResult(candidate.results[2]);
    if (
      typeof mint !== "boolean" ||
      typeof burn !== "boolean" ||
      !isAddressValue(rawOwner) ||
      (mint && burn)
    ) {
      continue;
    }

    const owner = isAddressEqual(rawOwner, zeroAddress) ? null : rawOwner;
    // Pool membership is authoritative when it conflicts with ownerAt. A
    // marketplace-owned pool token is therefore still a market item.
    const kind = mint ? "mint" : burn ? "burn" : null;
    if (kind) {
      eligible.push({ tokenId: candidate.tokenId, kind, owner });
    } else if (owner && !isAddressEqual(owner, marketplace)) {
      eligible.push({ tokenId: candidate.tokenId, kind: "owned", owner });
    }
  }

  const hydration = await batchedReads(
    client,
    blockNumber,
    eligible.map(({ tokenId }) => tokenId),
    (tokenId) => [
      {
        address: marketplace,
        abi: universalPoolArtMarketplaceAbi,
        functionName: "artworkHash",
        args: [tokenId],
      },
      {
        address: creatorMagic,
        abi: creatorArtistMagicAbi,
        functionName: "tokenURI",
        args: [tokenId],
      },
    ],
  );

  const chainReady = eligible.flatMap((candidate, index) => {
    const results = hydration[index]?.results ?? [];
    const artworkHash = successfulResult(results[0]);
    const tokenUri = successfulResult(results[1]);
    if (
      !isNonZeroHash(artworkHash) ||
      typeof tokenUri !== "string" ||
      tokenUri.trim().length === 0
    ) {
      return [];
    }
    return [
      {
        tokenId: candidate.tokenId,
        kind: candidate.kind,
        owner: candidate.owner,
        artworkHash,
        tokenUri,
      },
    ];
  });

  const resolved = await resolveMetadataBatch(chainReady);
  return {
    blockNumber,
    artworks: resolved.sort((left, right) => left.tokenId - right.tokenId),
    nextCursor: tokenPage.nextCursor,
  };
}
