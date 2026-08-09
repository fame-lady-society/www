import type { Abi, Address } from "viem";
import type { FameArtworkRevision } from "./metadata";

const REVISION_READ_CHUNK_SIZE = 64;
export const FAME_ARTWORK_REVISION_READ_CONCURRENCY = 2;

type RevisionContract = Readonly<{
  address: Address;
  abi: Abi;
  functionName: "tokenURI" | "artworkHash";
  args: readonly [bigint];
}>;

type RevisionResult =
  | Readonly<{ status: "success"; result: unknown }>
  | Readonly<{ status: "failure"; error?: unknown }>;

export type FameArtworkRevisionClient = Readonly<{
  getBlockNumber(): Promise<bigint>;
  multicall(input: {
    allowFailure: true;
    blockNumber: bigint;
    contracts: readonly RevisionContract[];
  }): Promise<readonly RevisionResult[]>;
}>;

export type FameArtworkRevisionSnapshot = Readonly<{
  blockNumber: bigint;
  revisions: readonly FameArtworkRevision[];
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

export async function readFameArtworkRevisions(
  client: FameArtworkRevisionClient,
  creatorMagic: Address,
  creatorMagicAbi: Abi,
  marketplace: Address,
  marketplaceAbi: Abi,
  tokenIds: readonly number[],
  blockNumber?: bigint,
): Promise<FameArtworkRevisionSnapshot> {
  if (
    tokenIds.some(
      (tokenId) =>
        !Number.isSafeInteger(tokenId) || tokenId < 1 || tokenId > 888,
    )
  ) {
    throw new Error("FAME artwork revision token ID is invalid.");
  }

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
