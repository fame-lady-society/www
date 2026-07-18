import { isAddress, isAddressEqual, type Address } from "viem";
import {
  closedLoopGallerySwapAbi,
  creatorArtistMagicAbi,
  fameAbi,
  fameMirrorAbi,
} from "../../wagmi";
import { BASE_SEPOLIA_TEST_GALLERY_CONFIG } from "./config/baseSepoliaTestGallery";
import {
  GALLERY_VISIBLE_TOKEN_BATCH_LIMIT,
  chunkGalleryTokenIds,
} from "./queryKeys";
import type {
  GalleryAccountState,
  GalleryAuthorityState,
  GalleryCandidateState,
  GalleryGlobalState,
  GalleryPoolKind,
  GalleryPoolState,
  GalleryProjectionFailure,
  GalleryProjectionResult,
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
  gallery: Address;
  fame: Address;
  mirror: Address;
  creatorMagic: Address;
};

export const GALLERY_POOL_SCAN_BATCH_SIZE = 64;
export const GALLERY_POOL_SCAN_CONCURRENCY = 2;

const DEFAULT_ADDRESSES: GalleryReadAddresses = {
  gallery: BASE_SEPOLIA_TEST_GALLERY_CONFIG.addresses.gallery,
  fame: BASE_SEPOLIA_TEST_GALLERY_CONFIG.addresses.fame,
  mirror: BASE_SEPOLIA_TEST_GALLERY_CONFIG.addresses.mirror,
  creatorMagic: BASE_SEPOLIA_TEST_GALLERY_CONFIG.addresses.creatorMagic,
};

function failure(
  message: string,
  blockNumber: bigint | null,
): GalleryProjectionFailure {
  return {
    status: "failure",
    blockNumber,
    message,
  };
}

function successfulValues(
  results: readonly GalleryMulticallResult[],
  expectedLength: number,
) {
  if (
    results.length !== expectedLength ||
    results.some((result) => result.status !== "success")
  ) {
    return null;
  }
  return results.map((result) =>
    result.status === "success" ? result.result : undefined,
  );
}

function isAddressValue(value: unknown): value is Address {
  return typeof value === "string" && isAddress(value, { strict: false });
}

function isBigint(value: unknown): value is bigint {
  return typeof value === "bigint";
}

async function captureMulticall(
  client: GalleryMulticallClient,
  contracts: readonly GalleryMulticallContract[],
) {
  const blockNumber = await client.getBlockNumber();
  const results = await client.multicall({
    allowFailure: true,
    blockNumber,
    contracts,
  });
  return { blockNumber, results };
}

export async function readGalleryGlobalState(
  client: GalleryMulticallClient,
  addresses: GalleryReadAddresses = DEFAULT_ADDRESSES,
): Promise<GalleryProjectionResult<GalleryGlobalState>> {
  let blockNumber: bigint | null = null;
  try {
    const captured = await captureMulticall(client, [
      {
        address: addresses.gallery,
        abi: closedLoopGallerySwapAbi,
        functionName: "fame",
      },
      {
        address: addresses.gallery,
        abi: closedLoopGallerySwapAbi,
        functionName: "mirror",
      },
      {
        address: addresses.gallery,
        abi: closedLoopGallerySwapAbi,
        functionName: "creatorMagic",
      },
      {
        address: addresses.creatorMagic,
        abi: creatorArtistMagicAbi,
        functionName: "childRenderer",
      },
      {
        address: addresses.gallery,
        abi: closedLoopGallerySwapAbi,
        functionName: "feeRecipient",
      },
      {
        address: addresses.gallery,
        abi: closedLoopGallerySwapAbi,
        functionName: "accruedProtocolFees",
      },
      {
        address: addresses.fame,
        abi: fameAbi,
        functionName: "unit",
      },
      {
        address: addresses.mirror,
        abi: fameMirrorAbi,
        functionName: "balanceOf",
        args: [addresses.gallery],
      },
    ]);
    blockNumber = captured.blockNumber;
    const values = successfulValues(captured.results, 8);
    if (!values) {
      return failure("Gallery global state is incomplete", blockNumber);
    }
    const [
      fame,
      mirror,
      creatorMagic,
      renderer,
      feeRecipient,
      accruedProtocolFees,
      unit,
      inventory,
    ] = values;
    if (
      !isAddressValue(fame) ||
      !isAddressValue(mirror) ||
      !isAddressValue(creatorMagic) ||
      !isAddressValue(renderer) ||
      !isAddressValue(feeRecipient) ||
      !isBigint(accruedProtocolFees) ||
      !isBigint(unit) ||
      !isBigint(inventory)
    ) {
      return failure("Gallery global state is malformed", blockNumber);
    }

    return {
      status: "success",
      blockNumber,
      data: {
        gallery: addresses.gallery,
        fame,
        mirror,
        creatorMagic,
        renderer,
        feeRecipient,
        accruedProtocolFees,
        unit,
        inventory,
      },
    };
  } catch {
    return failure("Gallery global state is unavailable", blockNumber);
  }
}

function tokenContracts(
  tokenIds: readonly bigint[],
  addresses: GalleryReadAddresses,
): GalleryMulticallContract[] {
  return tokenIds.flatMap((tokenId) => [
    {
      address: addresses.gallery,
      abi: closedLoopGallerySwapAbi,
      functionName: "listings",
      args: [tokenId],
    },
    {
      address: addresses.mirror,
      abi: fameMirrorAbi,
      functionName: "ownerAt",
      args: [tokenId],
    },
    {
      address: addresses.mirror,
      abi: fameMirrorAbi,
      functionName: "tokenURI",
      args: [tokenId],
    },
  ]);
}

function tokenResult(
  tokenId: bigint,
  blockNumber: bigint,
  results: readonly GalleryMulticallResult[],
): GalleryProjectionResult<GalleryTokenState> {
  const values = successfulValues(results, 3);
  if (!values) {
    return failure(`Gallery token ${tokenId} state is incomplete`, blockNumber);
  }
  const [listing, owner, tokenUri] = values;
  if (
    !Array.isArray(listing) ||
    !isBigint(listing[0]) ||
    typeof listing[1] !== "boolean" ||
    !isAddressValue(owner) ||
    typeof tokenUri !== "string"
  ) {
    return failure(`Gallery token ${tokenId} state is malformed`, blockNumber);
  }

  return {
    status: "success",
    blockNumber,
    data: {
      tokenId,
      listing: {
        premium: listing[0],
        active: listing[1],
      },
      owner,
      tokenUri,
    },
  };
}

export async function readGalleryTokenStates(
  client: GalleryMulticallClient,
  tokenIds: readonly bigint[],
  addresses: GalleryReadAddresses = DEFAULT_ADDRESSES,
) {
  if (
    tokenIds.length === 0 ||
    tokenIds.length > GALLERY_VISIBLE_TOKEN_BATCH_LIMIT
  ) {
    throw new Error(
      `Gallery token reads require between 1 and ${GALLERY_VISIBLE_TOKEN_BATCH_LIMIT} token IDs`,
    );
  }

  let blockNumber: bigint | null = null;
  try {
    const captured = await captureMulticall(
      client,
      tokenContracts(tokenIds, addresses),
    );
    blockNumber = captured.blockNumber;
    const projections = new Map<
      bigint,
      GalleryProjectionResult<GalleryTokenState>
    >();
    tokenIds.forEach((tokenId, index) => {
      projections.set(
        tokenId,
        tokenResult(
          tokenId,
          captured.blockNumber,
          captured.results.slice(index * 3, index * 3 + 3),
        ),
      );
    });
    return projections;
  } catch {
    return new Map(
      tokenIds.map((tokenId) => [
        tokenId,
        failure(`Gallery token ${tokenId} state is unavailable`, blockNumber),
      ]),
    );
  }
}

export async function readGalleryTokenState(
  client: GalleryMulticallClient,
  tokenId: bigint,
  addresses: GalleryReadAddresses = DEFAULT_ADDRESSES,
) {
  const results = await readGalleryTokenStates(client, [tokenId], addresses);
  return (
    results.get(tokenId) ??
    failure(`Gallery token ${tokenId} state is unavailable`, null)
  );
}

export async function readGalleryCandidateStates(
  client: GalleryMulticallClient,
  tokenIds: readonly bigint[],
  addresses: GalleryReadAddresses = DEFAULT_ADDRESSES,
) {
  if (
    tokenIds.length === 0 ||
    tokenIds.length > GALLERY_VISIBLE_TOKEN_BATCH_LIMIT
  ) {
    throw new Error(
      `Gallery candidate reads require between 1 and ${GALLERY_VISIBLE_TOKEN_BATCH_LIMIT} token IDs`,
    );
  }

  let blockNumber: bigint | null = null;
  try {
    const captured = await captureMulticall(
      client,
      tokenIds.flatMap((tokenId) => [
        {
          address: addresses.gallery,
          abi: closedLoopGallerySwapAbi,
          functionName: "listings",
          args: [tokenId],
        },
        {
          address: addresses.mirror,
          abi: fameMirrorAbi,
          functionName: "ownerAt",
          args: [tokenId],
        },
      ]),
    );
    blockNumber = captured.blockNumber;
    return new Map<bigint, GalleryProjectionResult<GalleryCandidateState>>(
      tokenIds.map((tokenId, index) => {
        const values = successfulValues(
          captured.results.slice(index * 2, index * 2 + 2),
          2,
        );
        const [listing, owner] = values ?? [];
        if (
          !values ||
          !Array.isArray(listing) ||
          !isBigint(listing[0]) ||
          typeof listing[1] !== "boolean" ||
          !isAddressValue(owner)
        ) {
          return [
            tokenId,
            failure(
              `Gallery candidate ${tokenId} state is incomplete`,
              blockNumber,
            ),
          ];
        }
        return [
          tokenId,
          {
            status: "success" as const,
            blockNumber: captured.blockNumber,
            data: {
              tokenId,
              listing: {
                premium: listing[0],
                active: listing[1],
              },
              owner,
            },
          },
        ];
      }),
    );
  } catch {
    return new Map<bigint, GalleryProjectionResult<GalleryCandidateState>>(
      tokenIds.map((tokenId) => [
        tokenId,
        failure(
          `Gallery candidate ${tokenId} state is unavailable`,
          blockNumber,
        ),
      ]),
    );
  }
}

export interface GalleryTokenReadBatcher {
  load: (
    tokenId: bigint,
  ) => Promise<GalleryProjectionResult<GalleryTokenState>>;
}

export function createGalleryTokenReadBatcher(
  client: GalleryMulticallClient,
  addresses: GalleryReadAddresses = DEFAULT_ADDRESSES,
): GalleryTokenReadBatcher {
  const pending = new Map<
    bigint,
    {
      promise: Promise<GalleryProjectionResult<GalleryTokenState>>;
      resolve: (result: GalleryProjectionResult<GalleryTokenState>) => void;
    }
  >();
  let scheduled = false;

  const flush = async () => {
    scheduled = false;
    const requests = [...pending.entries()];
    pending.clear();
    const entries = new Map(requests);
    const chunks = chunkGalleryTokenIds(requests.map(([tokenId]) => tokenId));

    await Promise.all(
      chunks.map(async (chunk) => {
        const results = await readGalleryTokenStates(client, chunk, addresses);
        chunk.forEach((tokenId) => {
          entries
            .get(tokenId)
            ?.resolve(
              results.get(tokenId) ??
                failure(`Gallery token ${tokenId} state is unavailable`, null),
            );
        });
      }),
    );
  };

  return {
    load(tokenId) {
      const existing = pending.get(tokenId);
      if (existing) return existing.promise;

      let resolve!: (
        result: GalleryProjectionResult<GalleryTokenState>,
      ) => void;
      const promise = new Promise<GalleryProjectionResult<GalleryTokenState>>(
        (resolvePromise) => {
          resolve = resolvePromise;
        },
      );
      pending.set(tokenId, { promise, resolve });

      if (!scheduled) {
        scheduled = true;
        queueMicrotask(() => {
          void flush();
        });
      }
      return promise;
    },
  };
}

export async function readGalleryAccountState(
  client: GalleryMulticallClient,
  account: Address,
  addresses: GalleryReadAddresses = DEFAULT_ADDRESSES,
): Promise<GalleryProjectionResult<GalleryAccountState>> {
  let blockNumber: bigint | null = null;
  try {
    const captured = await captureMulticall(client, [
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
        args: [account, addresses.gallery],
      },
    ]);
    blockNumber = captured.blockNumber;
    const values = successfulValues(captured.results, 2);
    if (!values || !isBigint(values[0]) || !isBigint(values[1])) {
      return failure("Gallery account state is incomplete", blockNumber);
    }
    return {
      status: "success",
      blockNumber,
      data: {
        account,
        balance: values[0],
        allowance: values[1],
      },
    };
  } catch {
    return failure("Gallery account state is unavailable", blockNumber);
  }
}

export async function readGalleryAuthority(
  client: GalleryMulticallClient,
  account: Address,
  addresses: GalleryReadAddresses = DEFAULT_ADDRESSES,
): Promise<GalleryProjectionResult<GalleryAuthorityState>> {
  let blockNumber: bigint | null = null;
  try {
    const captured = await captureMulticall(client, [
      {
        address: addresses.gallery,
        abi: closedLoopGallerySwapAbi,
        functionName: "owner",
      },
      {
        address: addresses.gallery,
        abi: closedLoopGallerySwapAbi,
        functionName: "roleOperator",
      },
      {
        address: addresses.gallery,
        abi: closedLoopGallerySwapAbi,
        functionName: "rolesOf",
        args: [account],
      },
    ]);
    blockNumber = captured.blockNumber;
    const values = successfulValues(captured.results, 3);
    if (
      !values ||
      !isAddressValue(values[0]) ||
      !isBigint(values[1]) ||
      !isBigint(values[2])
    ) {
      return failure("Gallery authority is incomplete", blockNumber);
    }
    const [owner, operatorRole, accountRoles] = values;
    const authority = isAddressEqual(owner, account)
      ? "owner"
      : (accountRoles & operatorRole) !== 0n
        ? "operator"
        : "denied";
    return {
      status: "success",
      blockNumber,
      data: {
        account,
        owner,
        operatorRole,
        accountRoles,
        authority,
      },
    };
  } catch {
    return failure("Gallery authority is unavailable", blockNumber);
  }
}

export async function readGalleryPoolState(
  client: GalleryMulticallClient,
  kind: GalleryPoolKind,
  tokenIds: readonly bigint[],
  addresses: GalleryReadAddresses = DEFAULT_ADDRESSES,
): Promise<GalleryProjectionResult<GalleryPoolState>> {
  if (tokenIds.length > GALLERY_VISIBLE_TOKEN_BATCH_LIMIT) {
    throw new Error(
      `Gallery pool reads accept at most ${GALLERY_VISIBLE_TOKEN_BATCH_LIMIT} candidates`,
    );
  }

  let blockNumber: bigint | null = null;
  try {
    const captured = await captureMulticall(client, [
      {
        address: addresses.creatorMagic,
        abi: creatorArtistMagicAbi,
        functionName: "getMintPoolStart",
      },
      {
        address: addresses.creatorMagic,
        abi: creatorArtistMagicAbi,
        functionName: "getMintPoolEnd",
      },
      {
        address: addresses.creatorMagic,
        abi: creatorArtistMagicAbi,
        functionName: "getTotalNFTSupply",
      },
      {
        address: addresses.creatorMagic,
        abi: creatorArtistMagicAbi,
        functionName: "getMaxNFTSupply",
      },
      ...tokenIds.map((tokenId) => ({
        address: addresses.creatorMagic,
        abi: creatorArtistMagicAbi,
        functionName:
          kind === "mint" ? "isTokenInMintPool" : "isTokenInBurnedPool",
        args: [tokenId],
      })),
    ]);
    blockNumber = captured.blockNumber;
    const values = successfulValues(captured.results, 4 + tokenIds.length);
    if (
      !values ||
      !isBigint(values[0]) ||
      !isBigint(values[1]) ||
      !isBigint(values[2]) ||
      !isBigint(values[3]) ||
      values.slice(4).some((value) => typeof value !== "boolean")
    ) {
      return failure("Gallery pool state is incomplete", blockNumber);
    }
    return {
      status: "success",
      blockNumber,
      data: {
        kind,
        mintPoolStart: values[0],
        mintPoolEnd: values[1],
        totalNftSupply: values[2],
        maxNftSupply: values[3],
        candidates: tokenIds.map((tokenId, index) => ({
          tokenId,
          eligible: values[index + 4] as boolean,
        })),
      },
    };
  } catch {
    return failure("Gallery pool state is unavailable", blockNumber);
  }
}

function poolCandidateTokenIds(
  kind: GalleryPoolKind,
  {
    mintPoolStart,
    mintPoolEnd,
    totalNftSupply,
  }: Pick<GalleryPoolState, "mintPoolStart" | "mintPoolEnd" | "totalNftSupply">,
) {
  const collectionEnd = BigInt(
    BASE_SEPOLIA_TEST_GALLERY_CONFIG.collection.lastTokenId,
  );
  const first = kind === "mint" ? mintPoolStart : 1n;
  const exclusiveEnd =
    kind === "mint"
      ? mintPoolEnd
      : totalNftSupply < collectionEnd
        ? totalNftSupply + 1n
        : collectionEnd + 1n;
  const boundedEnd =
    exclusiveEnd < collectionEnd + 1n ? exclusiveEnd : collectionEnd + 1n;
  const tokenIds: bigint[] = [];
  for (let tokenId = first; tokenId < boundedEnd; tokenId += 1n) {
    tokenIds.push(tokenId);
  }
  return tokenIds;
}

export async function readGalleryPoolCandidates(
  client: GalleryMulticallClient,
  kind: GalleryPoolKind,
  addresses: GalleryReadAddresses = DEFAULT_ADDRESSES,
): Promise<GalleryProjectionResult<GalleryPoolState>> {
  let blockNumber: bigint | null = null;
  try {
    const capturedBlockNumber = await client.getBlockNumber();
    blockNumber = capturedBlockNumber;
    const baseContracts = [
      {
        address: addresses.creatorMagic,
        abi: creatorArtistMagicAbi,
        functionName: "getMintPoolStart",
      },
      {
        address: addresses.creatorMagic,
        abi: creatorArtistMagicAbi,
        functionName: "getMintPoolEnd",
      },
      {
        address: addresses.creatorMagic,
        abi: creatorArtistMagicAbi,
        functionName: "getTotalNFTSupply",
      },
      {
        address: addresses.creatorMagic,
        abi: creatorArtistMagicAbi,
        functionName: "getMaxNFTSupply",
      },
    ] as const;
    const baseResults = await client.multicall({
      allowFailure: true,
      blockNumber: capturedBlockNumber,
      contracts: baseContracts,
    });
    const baseValues = successfulValues(baseResults, 4);
    if (!baseValues || baseValues.some((value) => !isBigint(value))) {
      return failure("Gallery pool state is incomplete", blockNumber);
    }
    const [mintPoolStart, mintPoolEnd, totalNftSupply, maxNftSupply] =
      baseValues as [bigint, bigint, bigint, bigint];
    const tokenIds = poolCandidateTokenIds(kind, {
      mintPoolStart,
      mintPoolEnd,
      totalNftSupply,
    });
    const chunks: bigint[][] = [];
    for (
      let index = 0;
      index < tokenIds.length;
      index += GALLERY_POOL_SCAN_BATCH_SIZE
    ) {
      chunks.push(tokenIds.slice(index, index + GALLERY_POOL_SCAN_BATCH_SIZE));
    }

    const candidates = new Array<GalleryPoolState["candidates"][number]>(
      tokenIds.length,
    );
    let nextChunk = 0;
    const worker = async () => {
      while (nextChunk < chunks.length) {
        const chunkIndex = nextChunk;
        nextChunk += 1;
        const chunk = chunks[chunkIndex];
        const results = await client.multicall({
          allowFailure: true,
          blockNumber: capturedBlockNumber,
          contracts: chunk.map((tokenId) => ({
            address: addresses.creatorMagic,
            abi: creatorArtistMagicAbi,
            functionName:
              kind === "mint" ? "isTokenInMintPool" : "isTokenInBurnedPool",
            args: [tokenId],
          })),
        });
        const values = successfulValues(results, chunk.length);
        if (!values || values.some((value) => typeof value !== "boolean")) {
          throw new Error("Gallery pool candidate state is incomplete");
        }
        const start = chunkIndex * GALLERY_POOL_SCAN_BATCH_SIZE;
        chunk.forEach((tokenId, index) => {
          candidates[start + index] = {
            tokenId,
            eligible: values[index] as boolean,
          };
        });
      }
    };
    await Promise.all(
      Array.from(
        { length: Math.min(GALLERY_POOL_SCAN_CONCURRENCY, chunks.length) },
        () => worker(),
      ),
    );

    return {
      status: "success",
      blockNumber: capturedBlockNumber,
      data: {
        kind,
        mintPoolStart,
        mintPoolEnd,
        totalNftSupply,
        maxNftSupply,
        candidates,
      },
    };
  } catch {
    return failure("Gallery pool state is unavailable", blockNumber);
  }
}
