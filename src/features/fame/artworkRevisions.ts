import { isHash, type Abi, type Address, type Hash } from "viem";
import type { FameArtworkRevision } from "./metadata";
import {
  asFameReleasedTokenBoundary,
  FAME_COLLECTION_FIRST_TOKEN_ID,
  isFameCollectionTokenId,
} from "./collection";

const REVISION_READ_CHUNK_SIZE = 64;
const ARTWORK_LOCATION_SCAN_SIZE = 64;
const ARTWORK_LOCATION_MULTICALL_BATCH_SIZE = 1_048_576;
export const FAME_ARTWORK_REVISION_READ_CONCURRENCY = 2;

type RevisionContract = Readonly<{
  address: Address;
  abi: Abi;
  functionName: "nextTokenId" | "tokenURI" | "artworkHash";
  args?: readonly [bigint];
}>;

type RevisionResult =
  | Readonly<{ status: "success"; result: unknown }>
  | Readonly<{ status: "failure"; error?: unknown }>;

export type FameArtworkRevisionClient = Readonly<{
  getBlockNumber(): Promise<bigint>;
  multicall(input: {
    allowFailure: true;
    batchSize?: number;
    blockNumber: bigint;
    contracts: readonly RevisionContract[];
  }): Promise<readonly RevisionResult[]>;
}>;

export type FameArtworkRevisionSnapshot = Readonly<{
  blockNumber: bigint;
  revisions: readonly FameArtworkRevision[];
}>;

export type FameArtworkLocation = Readonly<{
  tokenId: number;
  artworkHash: Hash;
}>;

export type FameArtworkLocationMatchSnapshot = Readonly<{
  blockNumber: bigint;
  location: FameArtworkLocation | null;
}>;

function chunks<T>(values: readonly T[], size: number) {
  const result: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    result.push(values.slice(index, index + size));
  }
  return result;
}

function successful(result: RevisionResult | undefined) {
  return result?.status === "success" ? result.result : null;
}

function validateTokenIds(tokenIds: readonly number[]) {
  if (
    tokenIds.some(
      (tokenId) =>
        !Number.isSafeInteger(tokenId) || !isFameCollectionTokenId(tokenId),
    )
  ) {
    throw new Error("FAME artwork revision token ID is invalid.");
  }
}

export async function findFameReleasedArtworkLocation(
  client: FameArtworkRevisionClient,
  creatorMagic: Address,
  creatorMagicAbi: Abi,
  marketplace: Address,
  marketplaceAbi: Abi,
  targetArtworkHash: Hash,
  blockNumber?: bigint,
): Promise<FameArtworkLocationMatchSnapshot> {
  const pinnedBlock = blockNumber ?? (await client.getBlockNumber());
  const boundary = await client.multicall({
    allowFailure: true,
    blockNumber: pinnedBlock,
    contracts: [
      {
        address: creatorMagic,
        abi: creatorMagicAbi,
        functionName: "nextTokenId",
      },
    ],
  });
  const nextTokenId = asFameReleasedTokenBoundary(successful(boundary[0]));
  const normalizedTarget = targetArtworkHash.toLowerCase();

  for (
    let firstTokenId = FAME_COLLECTION_FIRST_TOKEN_ID;
    firstTokenId < nextTokenId;
    firstTokenId += ARTWORK_LOCATION_SCAN_SIZE
  ) {
    const tokenIds = Array.from(
      {
        length: Math.min(
          ARTWORK_LOCATION_SCAN_SIZE,
          nextTokenId - firstTokenId,
        ),
      },
      (_, index) => firstTokenId + index,
    );
    const results = await client.multicall({
      allowFailure: true,
      batchSize: ARTWORK_LOCATION_MULTICALL_BATCH_SIZE,
      blockNumber: pinnedBlock,
      contracts: tokenIds.map((tokenId) => ({
        address: marketplace,
        abi: marketplaceAbi,
        functionName: "artworkHash" as const,
        args: [BigInt(tokenId)] as const,
      })),
    });
    const matchIndex = results.findIndex((result) => {
      const artworkHash = successful(result);
      return (
        typeof artworkHash === "string" &&
        isHash(artworkHash) &&
        artworkHash.toLowerCase() === normalizedTarget
      );
    });
    if (matchIndex >= 0) {
      return {
        blockNumber: pinnedBlock,
        location: {
          tokenId: tokenIds[matchIndex]!,
          artworkHash: targetArtworkHash,
        },
      };
    }
  }

  return { blockNumber: pinnedBlock, location: null };
}

export async function readFameArtworkRevisions(
  client: FameArtworkRevisionClient,
  creatorMagic: Address,
  creatorMagicAbi: Abi,
  marketplace: Address,
  marketplaceAbi: Abi,
  tokenIds: readonly number[],
  blockNumber?: bigint,
): Promise<FameArtworkRevisionSnapshot> {
  validateTokenIds(tokenIds);

  const pinnedBlock = blockNumber ?? (await client.getBlockNumber());
  const tokenChunks = chunks([...new Set(tokenIds)], REVISION_READ_CHUNK_SIZE);
  const revisionsByChunk = new Array<FameArtworkRevision[]>(tokenChunks.length);
  let nextChunk = 0;

  const worker = async () => {
    while (nextChunk < tokenChunks.length) {
      const chunkIndex = nextChunk;
      nextChunk += 1;
      const tokenChunk = tokenChunks[chunkIndex] ?? [];
      const results = await client.multicall({
        allowFailure: true,
        blockNumber: pinnedBlock,
        contracts: tokenChunk.flatMap((tokenId) => [
          {
            address: creatorMagic,
            abi: creatorMagicAbi,
            functionName: "tokenURI" as const,
            args: [BigInt(tokenId)] as const,
          },
          {
            address: marketplace,
            abi: marketplaceAbi,
            functionName: "artworkHash" as const,
            args: [BigInt(tokenId)] as const,
          },
        ]),
      });

      revisionsByChunk[chunkIndex] = tokenChunk.flatMap((tokenId, index) => {
        const tokenUri = successful(results[index * 2]);
        const artworkHash = successful(results[index * 2 + 1]);
        if (typeof tokenUri !== "string" || tokenUri.trim().length === 0) {
          return [];
        }
        return [
          {
            tokenId: tokenId.toString(),
            tokenUri,
            ...(typeof artworkHash === "string" &&
            /^0x[0-9a-fA-F]{64}$/.test(artworkHash)
              ? { artworkHash: artworkHash as `0x${string}` }
              : {}),
          },
        ];
      });
    }
  };

  await Promise.all(
    Array.from(
      {
        length: Math.min(
          FAME_ARTWORK_REVISION_READ_CONCURRENCY,
          tokenChunks.length,
        ),
      },
      worker,
    ),
  );

  return { blockNumber: pinnedBlock, revisions: revisionsByChunk.flat() };
}
