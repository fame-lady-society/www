import type { Address } from "viem";
import { FAME_SWAP_ARTIFACT_MANIFEST } from "../../artifacts/manifest";
import type { FamePriceImpactEstimate, FameProtocolEvidence } from "./adapters";

export interface FameSnapshotReserveState {
  poolId: string;
  pool: Address;
  token0: Address;
  token1: Address;
  reserve0: string;
  reserve1: string;
  source: "getReserves";
}

export interface FameSnapshotQuoteEntry {
  poolId: string;
  tokenIn: Address;
  tokenOut: Address;
  amountIn: string;
  amountOut: string;
  evidence: string;
  priceImpact?: {
    preSwapPriceX18: string;
    postSwapPriceX18: string | null;
    executionPriceX18: string;
    marketImpactBps: number | null;
    method: FamePriceImpactEstimate["method"];
  };
  protocolEvidence?: FameProtocolEvidence;
}

export interface FamePoolStateSnapshotFile {
  schemaVersion: number;
  status: "generated-live-liquidity-snapshot";
  snapshotId: string;
  pinnedBaseBlock: number;
  capturedBaseBlock: number;
  generatedAt: string;
  source: string;
  reserveStates: FameSnapshotReserveState[];
  quoteTable: FameSnapshotQuoteEntry[];
  unsupportedQuotePools: Array<{
    poolId: string;
    reason: string;
  }>;
}

function parsePositiveBigint(value: string): bigint | null {
  if (!/^[0-9]+$/.test(value)) return null;
  const parsed = BigInt(value);
  return parsed > 0n ? parsed : null;
}

export function snapshotIntegrityIssue(
  snapshot: FamePoolStateSnapshotFile,
): string | null {
  if (snapshot.schemaVersion !== FAME_SWAP_ARTIFACT_MANIFEST.schemaVersion) {
    return "FAME recorded pool state schema version does not match the manifest.";
  }
  if (
    snapshot.pinnedBaseBlock !== FAME_SWAP_ARTIFACT_MANIFEST.pinnedBaseBlock
  ) {
    return "FAME recorded pool state pinned Base block does not match the manifest.";
  }
  if (!snapshot.snapshotId) {
    return "FAME recorded pool state id is missing.";
  }

  for (const reserve of snapshot.reserveStates) {
    if (
      !parsePositiveBigint(reserve.reserve0) ||
      !parsePositiveBigint(reserve.reserve1)
    ) {
      return `FAME recorded pool state reserve ${reserve.poolId} is malformed.`;
    }
  }

  for (const entry of snapshot.quoteTable) {
    if (
      !parsePositiveBigint(entry.amountIn) ||
      !parsePositiveBigint(entry.amountOut)
    ) {
      return `FAME recorded pool state quote ${entry.poolId} is malformed.`;
    }
  }

  return null;
}
