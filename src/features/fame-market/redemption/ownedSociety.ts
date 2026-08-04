import {
  isAddress,
  isAddressEqual,
  zeroAddress,
  type Address,
  type PublicClient,
} from "viem";
import { fameMarketplaceCheckoutAbi, fameMirrorAbi } from "../../../wagmi";

export const SOCIETY_TOKEN_ID_START = 1n;
export const SOCIETY_TOKEN_ID_END_EXCLUSIVE = 889n;
export const DEFAULT_OWNED_SOCIETY_RANGE_SIZE = 128n;

export type OwnedSocietyRangeResult = Readonly<{
  start: bigint;
  endExclusive: bigint;
  tokenIds: readonly bigint[];
}>;

export type OwnedSocietyProjection =
  | Readonly<{
      status: "ready";
      account: Address;
      blockNumber: bigint;
      balance: bigint;
      tokenIds: readonly bigint[];
    }>
  | Readonly<{
      status: "error";
      account: Address | null;
      blockNumber: bigint | null;
      message: string;
    }>;

type OwnedSocietyClient = Pick<PublicClient, "getBlockNumber" | "readContract">;

function projectionError(
  message: string,
  account: Address | null,
  blockNumber: bigint | null,
): OwnedSocietyProjection {
  return { status: "error", account, blockNumber, message };
}

export function buildOwnedSocietyRanges(
  rangeSize = DEFAULT_OWNED_SOCIETY_RANGE_SIZE,
) {
  if (rangeSize <= 0n) {
    throw new Error("Owned Society range size must be positive.");
  }
  const ranges: Array<{ start: bigint; endExclusive: bigint }> = [];
  for (
    let start = SOCIETY_TOKEN_ID_START;
    start < SOCIETY_TOKEN_ID_END_EXCLUSIVE;
    start += rangeSize
  ) {
    ranges.push({
      start,
      endExclusive:
        start + rangeSize < SOCIETY_TOKEN_ID_END_EXCLUSIVE
          ? start + rangeSize
          : SOCIETY_TOKEN_ID_END_EXCLUSIVE,
    });
  }
  return ranges;
}

export function projectOwnedSocietyIds(input: {
  account: Address | null | undefined;
  blockNumber: bigint | null | undefined;
  balance: bigint | null | undefined;
  ranges: readonly OwnedSocietyRangeResult[];
}): OwnedSocietyProjection {
  const account = input.account ?? null;
  const blockNumber = input.blockNumber ?? null;
  if (!account || !isAddress(account) || isAddressEqual(account, zeroAddress)) {
    return projectionError(
      "Owned Society discovery requires a connected Base account.",
      null,
      blockNumber,
    );
  }
  if (blockNumber === null) {
    return projectionError(
      "Owned Society discovery is missing a pinned Base block.",
      account,
      null,
    );
  }
  if (
    input.balance === null ||
    input.balance === undefined ||
    input.balance < 0n
  ) {
    return projectionError(
      "Mirror balanceOf is unavailable for this ownership snapshot.",
      account,
      blockNumber,
    );
  }
  if (input.ranges.length === 0) {
    return projectionError(
      "Owned Society discovery returned no token ranges.",
      account,
      blockNumber,
    );
  }

  let expectedStart = SOCIETY_TOKEN_ID_START;
  let previousTokenId: bigint | null = null;
  const tokenIds: bigint[] = [];
  for (const range of input.ranges) {
    if (
      range.start !== expectedStart ||
      range.endExclusive <= range.start ||
      range.endExclusive > SOCIETY_TOKEN_ID_END_EXCLUSIVE
    ) {
      return projectionError(
        "Owned Society ranges must cover [1, 889) exactly once without gaps or overlaps.",
        account,
        blockNumber,
      );
    }
    for (const tokenId of range.tokenIds) {
      if (tokenId < range.start || tokenId >= range.endExclusive) {
        return projectionError(
          `Owned Society token ${tokenId.toString()} is outside its requested range.`,
          account,
          blockNumber,
        );
      }
      if (previousTokenId !== null && tokenId <= previousTokenId) {
        return projectionError(
          "Owned Society token IDs must be sorted and unique.",
          account,
          blockNumber,
        );
      }
      previousTokenId = tokenId;
      tokenIds.push(tokenId);
    }
    expectedStart = range.endExclusive;
  }
  if (expectedStart !== SOCIETY_TOKEN_ID_END_EXCLUSIVE) {
    return projectionError(
      "Owned Society ranges must cover [1, 889) exactly once without gaps or overlaps.",
      account,
      blockNumber,
    );
  }
  if (BigInt(tokenIds.length) !== input.balance) {
    return projectionError(
      `Discovered ${tokenIds.length} owned Society NFTs but mirror balanceOf is ${input.balance.toString()}.`,
      account,
      blockNumber,
    );
  }

  return {
    status: "ready",
    account,
    blockNumber,
    balance: input.balance,
    tokenIds,
  };
}

async function readOwnedRange(input: {
  client: OwnedSocietyClient;
  checkout: Address;
  account: Address;
  blockNumber: bigint;
  start: bigint;
  endExclusive: bigint;
}): Promise<OwnedSocietyRangeResult> {
  const tokenIds = (await input.client.readContract({
    abi: fameMarketplaceCheckoutAbi,
    address: input.checkout,
    functionName: "ownedSocietyTokenIds",
    args: [input.account, input.start, input.endExclusive],
    blockNumber: input.blockNumber,
  })) as readonly bigint[];
  return {
    start: input.start,
    endExclusive: input.endExclusive,
    tokenIds,
  };
}

export function isOwnedSocietyProviderLimitError(cause: unknown): boolean {
  const messages: string[] = [];
  const visited = new Set<unknown>();
  let current = cause;
  while (current && !visited.has(current)) {
    visited.add(current);
    if (typeof current === "string") {
      messages.push(current);
      break;
    }
    if (typeof current !== "object") break;
    const record = current as Record<string, unknown>;
    for (const key of ["message", "shortMessage", "details"]) {
      if (typeof record[key] === "string") messages.push(record[key]);
    }
    current = record.cause;
  }
  const message = messages.join(" ").toLowerCase();
  return [
    "response too large",
    "response exceeds provider limit",
    "response size exceeds",
    "returned data limit",
    "returned data is too large",
    "return data is too large",
    "eth_call gas limit",
    "gas required exceeds allowance",
    "maximum call gas",
    "max call gas",
    "out of gas",
  ].some((marker) => message.includes(marker));
}

export async function readOwnedSocietyIds(input: {
  client: OwnedSocietyClient;
  account: Address;
  checkout: Address;
  mirror: Address;
  fallbackRangeSize?: bigint;
}): Promise<OwnedSocietyProjection> {
  const blockNumber = await input.client.getBlockNumber();
  const balancePromise = input.client.readContract({
    abi: fameMirrorAbi,
    address: input.mirror,
    functionName: "balanceOf",
    args: [input.account],
    blockNumber,
  }) as Promise<bigint>;

  const rangesPromise = readOwnedRange({
    ...input,
    blockNumber,
    start: SOCIETY_TOKEN_ID_START,
    endExclusive: SOCIETY_TOKEN_ID_END_EXCLUSIVE,
  })
    .then((range) => [range] as readonly OwnedSocietyRangeResult[])
    .catch((cause) => {
      if (!isOwnedSocietyProviderLimitError(cause)) throw cause;
      return Promise.all(
        buildOwnedSocietyRanges(input.fallbackRangeSize).map((range) =>
          readOwnedRange({ ...input, blockNumber, ...range }),
        ),
      );
    });

  const [balance, ranges] = await Promise.all([balancePromise, rangesPromise]);

  return projectOwnedSocietyIds({
    account: input.account,
    blockNumber,
    balance,
    ranges,
  });
}
