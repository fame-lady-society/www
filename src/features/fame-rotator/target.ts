import type { OrderedBurnPoolSnapshot } from "@/service/fame";
import { FAME_METADATA_FALLBACK_IMAGE } from "@/service/fameMetadata";

/** Fixed Society collection size on Base (IDs 1..888). */
export const SOCIETY_TOKEN_ID_MAX = 888;

/**
 * Canonical positive decimal token ID only: no empty, signed, fractional,
 * zero-padded, non-numeric, zero, negative, or out-of-range values.
 */
const CANONICAL_TOKEN_ID_PATTERN = /^[1-9]\d*$/;

export type ParsedTargetId =
  | { status: "invalid_id"; raw: string }
  | { status: "valid"; tokenId: number; raw: string };

export type BurnPoolTargetResolution =
  | {
      status: "invalid_id";
      raw: string;
    }
  | {
      status: "unavailable";
      tokenId: number;
      raw: string;
      returnHref: "/fame";
    }
  | {
      status: "retryable_read_failure";
      tokenId: number;
      raw: string;
      message: string;
    }
  | {
      status: "available";
      tokenId: number;
      raw: string;
      /** 1-based FIFO display position. */
      position: number;
      /** Automatic rotation bound: zero-based index + 1. */
      maxRotations: number;
      /** Zero-based index in the ordered pool. */
      index: number;
      blockNumber: bigint;
      /** Presentation image; never required for identity/eligibility. */
      image: string;
    };

/**
 * Strictly parse a route param into a canonical Society token ID.
 * Rejects empty, signed, fractional, padded, nonnumeric, zero, negative,
 * and values outside 1..SOCIETY_TOKEN_ID_MAX.
 */
export function parseTargetIdParam(raw: string): ParsedTargetId {
  if (!CANONICAL_TOKEN_ID_PATTERN.test(raw)) {
    return { status: "invalid_id", raw };
  }

  // Safe: pattern guarantees a positive integer decimal string with no leading zeros.
  const tokenId = Number(raw);
  if (
    !Number.isSafeInteger(tokenId) ||
    tokenId < 1 ||
    tokenId > SOCIETY_TOKEN_ID_MAX
  ) {
    return { status: "invalid_id", raw };
  }

  return { status: "valid", tokenId, raw };
}

export type ResolveBurnPoolTargetInput = {
  rawTargetId: string;
  /**
   * Coherent ordered snapshot when the pool read succeeded.
   * Omit or pass null only when using `poolReadError`.
   */
  snapshot?: OrderedBurnPoolSnapshot | null;
  /**
   * When set, a valid ID resolves to retryable_read_failure instead of
   * unavailable — never masquerade a transport failure as absence.
   */
  poolReadError?: unknown;
  /**
   * Optional presentation image. Failure/absence must not affect eligibility;
   * the shared fallback is applied when missing.
   */
  image?: string | null;
};

/**
 * Resolve a rotate-route target into a trustworthy projection:
 * invalid_id | unavailable | retryable_read_failure | available.
 */
export function resolveBurnPoolTarget(
  input: ResolveBurnPoolTargetInput,
): BurnPoolTargetResolution {
  const parsed = parseTargetIdParam(input.rawTargetId);
  if (parsed.status === "invalid_id") {
    return { status: "invalid_id", raw: parsed.raw };
  }

  const { tokenId, raw } = parsed;

  if (input.poolReadError !== undefined && input.poolReadError !== null) {
    const message =
      input.poolReadError instanceof Error
        ? input.poolReadError.message
        : "Failed to read the current burn pool";
    return {
      status: "retryable_read_failure",
      tokenId,
      raw,
      message,
    };
  }

  const snapshot = input.snapshot;
  if (!snapshot) {
    return {
      status: "retryable_read_failure",
      tokenId,
      raw,
      message: "Burn pool snapshot is unavailable",
    };
  }

  const index = snapshot.tokenIds.indexOf(tokenId);
  if (index < 0) {
    return {
      status: "unavailable",
      tokenId,
      raw,
      returnHref: "/fame",
    };
  }

  const image =
    typeof input.image === "string" && input.image.length > 0
      ? input.image
      : FAME_METADATA_FALLBACK_IMAGE;

  return {
    status: "available",
    tokenId,
    raw,
    index,
    position: index + 1,
    maxRotations: index + 1,
    blockNumber: snapshot.blockNumber,
    image,
  };
}

/** Plain-language exchange explanation required by R3. */
export const ROTATION_EXCHANGE_EXPLANATION =
  "You offer one Society NFT that you explicitly select. Either you receive the selected burn-pool target, or the transaction reverts and you keep your NFT. The website chooses the rotation bound automatically from the target's current FIFO position, and the paired FAME unit remains conserved.";
