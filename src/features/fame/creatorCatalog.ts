import type { Abi, Address } from "viem";
import { baseFameV3Stack } from "@/features/fame/contract";
import {
  FAME_COLLECTION_FIRST_TOKEN_ID,
  FAME_COLLECTION_LAST_TOKEN_ID,
  isFameCollectionTokenId,
} from "@/features/fame/collection";
import { readFameArtworkRevisions } from "@/features/fame/artworkRevisions";
import {
  fameMetadataFailure,
  resolveFameMetadataBatch,
  type FameArtworkRevision,
  type FameMetadataResolver,
  type FameMetadataResult,
} from "@/features/fame/metadata";
import { creatorArtistMagicAbi, universalPoolArtMarketplaceAbi } from "@/wagmi";
import { client as baseClient } from "@/viem/base-client";

export const FAME_CREATOR_CATALOG_SCAN_SIZE = 24;

type CatalogContract = Readonly<{
  address: Address;
  abi: Abi;
  functionName: string;
  args?: readonly unknown[];
}>;

type CatalogResult =
  | Readonly<{ status: "success"; result: unknown }>
  | Readonly<{ status: "failure"; error?: unknown }>;

export type FameCreatorCatalogClient = Readonly<{
  getBlockNumber(): Promise<bigint>;
  multicall(input: {
    allowFailure: true;
    blockNumber: bigint;
    contracts: readonly CatalogContract[];
  }): Promise<readonly CatalogResult[]>;
}>;

export type FameCreatorArtwork = Readonly<{
  tokenId: number;
  revision: FameArtworkRevision | null;
  metadata: FameMetadataResult;
}>;

export type FameCreatorCatalogResult = Readonly<{
  blockNumber: bigint;
  nextTokenId: number;
  artworks: readonly FameCreatorArtwork[];
  nextCursor: number | null;
}>;

export type FameCreatorCatalogPage = Readonly<{
  blockNumber: string;
  nextTokenId: number;
  artworks: readonly FameCreatorArtwork[];
  nextCursor: number | null;
}>;

export type FameCreatorCatalogOptions = Readonly<{
  cursor?: number;
  blockNumber?: bigint;
  tokenId?: number;
  pageSize?: number;
  resolveMetadata?: FameMetadataResolver;
}>;

const productionClient = baseClient as unknown as FameCreatorCatalogClient;

function successful(result: CatalogResult | undefined) {
  return result?.status === "success" ? result.result : null;
}

function releasedTokenIds(
  nextTokenId: number,
  options: FameCreatorCatalogOptions,
) {
  if (options.tokenId !== undefined) {
    if (
      !isFameCollectionTokenId(options.tokenId) ||
      options.tokenId >= nextTokenId
    ) {
      throw new RangeError("Token ID is outside the released FAME range.");
    }
    return { tokenIds: [options.tokenId], nextCursor: null };
  }

  const pageSize = options.pageSize ?? FAME_CREATOR_CATALOG_SCAN_SIZE;
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 128) {
    throw new Error("Creator catalog page size is invalid.");
  }
  const cursor = options.cursor ?? FAME_COLLECTION_FIRST_TOKEN_ID;
  if (
    !Number.isInteger(cursor) ||
    cursor < FAME_COLLECTION_FIRST_TOKEN_ID ||
    cursor > nextTokenId
  ) {
    throw new RangeError(
      "Creator catalog cursor is outside the released range.",
    );
  }

  const end = Math.min(nextTokenId, cursor + pageSize);
  return {
    tokenIds: Array.from(
      { length: end - cursor },
      (_, index) => cursor + index,
    ),
    nextCursor: end < nextTokenId ? end : null,
  };
}

export function serializeFameCreatorCatalog(
  result: FameCreatorCatalogResult,
): FameCreatorCatalogPage {
  return {
    blockNumber: result.blockNumber.toString(),
    nextTokenId: result.nextTokenId,
    artworks: result.artworks,
    nextCursor: result.nextCursor,
  };
}

export async function readFameCreatorCatalog(
  client: FameCreatorCatalogClient = productionClient,
  options: FameCreatorCatalogOptions = {},
): Promise<FameCreatorCatalogResult> {
  const blockNumber = options.blockNumber ?? (await client.getBlockNumber());
  const stack = baseFameV3Stack();
  const boundary = await client.multicall({
    allowFailure: true,
    blockNumber,
    contracts: [
      {
        address: stack.creatorMagic,
        abi: creatorArtistMagicAbi,
        functionName: "nextTokenId",
      },
    ],
  });
  const rawNextTokenId = successful(boundary[0]);
  const nextTokenIdValue =
    typeof rawNextTokenId === "bigint"
      ? rawNextTokenId
      : typeof rawNextTokenId === "number" &&
          Number.isSafeInteger(rawNextTokenId)
        ? BigInt(rawNextTokenId)
        : null;
  if (
    nextTokenIdValue === null ||
    nextTokenIdValue < BigInt(FAME_COLLECTION_FIRST_TOKEN_ID) ||
    nextTokenIdValue > BigInt(FAME_COLLECTION_LAST_TOKEN_ID + 1)
  ) {
    throw new Error(
      "CreatorArtistMagic returned an invalid released boundary.",
    );
  }
  const nextTokenId = Number(nextTokenIdValue);
  const { tokenIds, nextCursor } = releasedTokenIds(nextTokenId, options);

  const snapshot = await readFameArtworkRevisions(
    client,
    stack.creatorMagic,
    creatorArtistMagicAbi,
    stack.marketplace,
    universalPoolArtMarketplaceAbi,
    tokenIds,
    blockNumber,
  );
  const revisions = new Map(
    snapshot.revisions.map((revision) => [Number(revision.tokenId), revision]),
  );
  const resolvable = tokenIds.flatMap((tokenId) => {
    const revision = revisions.get(tokenId);
    return revision ? [revision] : [];
  });
  const metadataResults = await resolveFameMetadataBatch(resolvable, {
    resolveMetadata: options.resolveMetadata,
  });
  const metadataByTokenId = new Map(
    metadataResults.map(({ revision, metadata }) => [
      Number(revision.tokenId),
      metadata,
    ]),
  );

  return {
    blockNumber,
    nextTokenId,
    artworks: tokenIds.map((tokenId) => ({
      tokenId,
      revision: revisions.get(tokenId) ?? null,
      metadata:
        metadataByTokenId.get(tokenId) ??
        fameMetadataFailure("Token metadata could not be loaded"),
    })),
    nextCursor,
  };
}
