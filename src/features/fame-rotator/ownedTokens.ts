import { isAddress, isAddressEqual, type Address } from "viem";

/** Fixed Society collection size on Base (token IDs 1 through 888). */
export const SOCIETY_TOKEN_ID_MIN = 1;
export const SOCIETY_TOKEN_ID_MAX = 888;
export const SOCIETY_TOKEN_ID_COUNT =
  SOCIETY_TOKEN_ID_MAX - SOCIETY_TOKEN_ID_MIN + 1;

export type OwnedTokenScanStatus =
  | "complete"
  | "incomplete"
  | "error";

export type OwnedTokenScanResult =
  | {
      status: "complete";
      account: Address;
      blockNumber: bigint;
      balance: bigint;
      ownedIds: readonly number[];
    }
  | {
      status: "incomplete" | "error";
      account: Address | null;
      blockNumber: bigint | null;
      balance: bigint | null;
      ownedIds: readonly number[];
      reason: string;
    };

export interface OwnerAtChunkResult {
  /** Token IDs included in this chunk, in ascending order. */
  tokenIds: readonly number[];
  /**
   * Parallel owner addresses for each tokenId. Must be the same length as
   * tokenIds. Null entries are treated as read failures.
   */
  owners: readonly (Address | null | undefined)[];
  /** When true, this chunk itself failed and the scan cannot complete. */
  failed?: boolean;
}

/**
 * Pure completeness projection for a block-pinned Society ownership scan.
 *
 * Completeness requires:
 * - a valid account and block
 * - a finite non-negative balanceOf
 * - every token ID from 1..888 covered by chunks at that same block
 * - no failed chunks, null owners, or length mismatches
 * - discovered owner==account count exactly equals balanceOf
 * - no duplicate owned IDs
 */
export function projectOwnedTokenScan({
  account,
  blockNumber,
  balance,
  chunks,
}: {
  account: Address | null | undefined;
  blockNumber: bigint | null | undefined;
  balance: bigint | null | undefined;
  chunks: readonly OwnerAtChunkResult[];
}): OwnedTokenScanResult {
  if (
    typeof account !== "string" ||
    !isAddress(account) ||
    account === "0x0000000000000000000000000000000000000000"
  ) {
    return {
      status: "error",
      account: null,
      blockNumber: blockNumber ?? null,
      balance: balance ?? null,
      ownedIds: [],
      reason: "Ownership scan requires a connected Base account.",
    };
  }

  if (blockNumber === null || blockNumber === undefined) {
    return {
      status: "incomplete",
      account,
      blockNumber: null,
      balance: balance ?? null,
      ownedIds: [],
      reason: "Ownership scan is missing a pinned Base block.",
    };
  }

  if (balance === null || balance === undefined) {
    return {
      status: "incomplete",
      account,
      blockNumber,
      balance: null,
      ownedIds: [],
      reason: "Mirror balanceOf is unavailable for this snapshot.",
    };
  }

  if (balance < 0n) {
    return {
      status: "error",
      account,
      blockNumber,
      balance,
      ownedIds: [],
      reason: "Mirror balanceOf returned an invalid value.",
    };
  }

  const covered = new Set<number>();
  const owned: number[] = [];
  const ownedSeen = new Set<number>();

  for (const chunk of chunks) {
    if (chunk.failed) {
      return {
        status: "incomplete",
        account,
        blockNumber,
        balance,
        ownedIds: [],
        reason: "An ownership chunk failed before the scan could complete.",
      };
    }

    if (chunk.tokenIds.length !== chunk.owners.length) {
      return {
        status: "incomplete",
        account,
        blockNumber,
        balance,
        ownedIds: [],
        reason: "Ownership chunk length does not match owner results.",
      };
    }

    for (let i = 0; i < chunk.tokenIds.length; i++) {
      const tokenId = chunk.tokenIds[i];
      if (
        !Number.isInteger(tokenId) ||
        tokenId < SOCIETY_TOKEN_ID_MIN ||
        tokenId > SOCIETY_TOKEN_ID_MAX
      ) {
        return {
          status: "error",
          account,
          blockNumber,
          balance,
          ownedIds: [],
          reason: `Ownership scan included out-of-range token ID ${String(tokenId)}.`,
        };
      }

      if (covered.has(tokenId)) {
        return {
          status: "error",
          account,
          blockNumber,
          balance,
          ownedIds: [],
          reason: `Ownership scan covered token ID ${tokenId} more than once.`,
        };
      }
      covered.add(tokenId);

      const owner = chunk.owners[i];
      if (owner === null || owner === undefined) {
        return {
          status: "incomplete",
          account,
          blockNumber,
          balance,
          ownedIds: [],
          reason: `Owner read failed for token ID ${tokenId}.`,
        };
      }

      if (!isAddress(owner)) {
        return {
          status: "error",
          account,
          blockNumber,
          balance,
          ownedIds: [],
          reason: `Owner read returned an invalid address for token ID ${tokenId}.`,
        };
      }

      if (isAddressEqual(owner, account)) {
        if (ownedSeen.has(tokenId)) {
          return {
            status: "error",
            account,
            blockNumber,
            balance,
            ownedIds: [],
            reason: `Duplicate owned token ID ${tokenId} in scan results.`,
          };
        }
        ownedSeen.add(tokenId);
        owned.push(tokenId);
      }
    }
  }

  if (covered.size !== SOCIETY_TOKEN_ID_COUNT) {
    return {
      status: "incomplete",
      account,
      blockNumber,
      balance,
      ownedIds: [],
      reason: `Ownership scan covered ${covered.size} of ${SOCIETY_TOKEN_ID_COUNT} token IDs.`,
    };
  }

  for (let id = SOCIETY_TOKEN_ID_MIN; id <= SOCIETY_TOKEN_ID_MAX; id++) {
    if (!covered.has(id)) {
      return {
        status: "incomplete",
        account,
        blockNumber,
        balance,
        ownedIds: [],
        reason: `Ownership scan is missing token ID ${id}.`,
      };
    }
  }

  if (BigInt(owned.length) !== balance) {
    return {
      status: "incomplete",
      account,
      blockNumber,
      balance,
      ownedIds: [],
      reason: `Discovered ${owned.length} owned tokens but mirror balanceOf is ${balance.toString()}.`,
    };
  }

  owned.sort((a, b) => a - b);

  return {
    status: "complete",
    account,
    blockNumber,
    balance,
    ownedIds: owned,
  };
}

/**
 * True when a scan result is still valid for the live account and key.
 * Stale account/block keys must be discarded after disconnect or change.
 */
export function isOwnedTokenScanCurrent(
  scan: OwnedTokenScanResult,
  liveAccount: Address | null | undefined,
  liveBlockNumber: bigint | null | undefined,
): boolean {
  if (!liveAccount || !isAddress(liveAccount)) return false;
  if (scan.account === null || !isAddressEqual(scan.account, liveAccount)) {
    return false;
  }
  if (
    liveBlockNumber !== null &&
    liveBlockNumber !== undefined &&
    scan.blockNumber !== null &&
    scan.blockNumber !== liveBlockNumber
  ) {
    return false;
  }
  return true;
}

/** Build sequential token-ID chunks for bounded concurrent ownerAt reads. */
export function buildOwnerAtChunks(chunkSize = 50): number[][] {
  if (!Number.isInteger(chunkSize) || chunkSize <= 0) {
    throw new Error("ownerAt chunk size must be a positive integer");
  }
  const chunks: number[][] = [];
  for (
    let start = SOCIETY_TOKEN_ID_MIN;
    start <= SOCIETY_TOKEN_ID_MAX;
    start += chunkSize
  ) {
    const end = Math.min(start + chunkSize - 1, SOCIETY_TOKEN_ID_MAX);
    const ids: number[] = [];
    for (let id = start; id <= end; id++) ids.push(id);
    chunks.push(ids);
  }
  return chunks;
}
