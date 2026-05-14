import type { Address } from "viem";
import snapshotJson from "../../artifacts/base-v1-pool-state-snapshot.json";
import { FAME_SWAP_ARTIFACT_MANIFEST } from "../../artifacts/manifest";
import type {
  FameEdgeQuoteRequest,
  FameEdgeQuoteResult,
  FamePriceImpactEstimate,
  FameQuoteAdapter,
} from "./adapters";
import type { FameQuoteContext } from "./quoteContext";
import { constantProductPriceImpact } from "./routeMath";

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

export const poolStateSnapshotFile =
  snapshotJson as FamePoolStateSnapshotFile;

function key(
  poolId: string,
  tokenIn: Address,
  tokenOut: Address,
  amountIn?: bigint,
): string {
  return [
    poolId,
    tokenIn.toLowerCase(),
    tokenOut.toLowerCase(),
    amountIn?.toString() ?? "any",
  ].join(":");
}

function sameAddress(left: Address, right: Address): boolean {
  return left.toLowerCase() === right.toLowerCase();
}

function parsePositiveBigint(value: string): bigint | null {
  if (!/^[0-9]+$/.test(value)) return null;
  const parsed = BigInt(value);
  return parsed > 0n ? parsed : null;
}

function constantProductAmountOut(
  amountIn: bigint,
  reserveIn: bigint,
  reserveOut: bigint,
  feeBps: number,
): bigint {
  if (amountIn <= 0n || reserveIn <= 0n || reserveOut <= 0n) return 0n;

  const feeDenominator = 10_000n;
  const feeNumerator = feeDenominator - BigInt(feeBps);
  if (feeNumerator <= 0n) return 0n;

  const amountInWithFee = amountIn * feeNumerator;
  return (amountInWithFee * reserveOut) /
    (reserveIn * feeDenominator + amountInWithFee);
}

export function snapshotIntegrityIssue(
  snapshot: FamePoolStateSnapshotFile = poolStateSnapshotFile,
): string | null {
  if (snapshot.schemaVersion !== FAME_SWAP_ARTIFACT_MANIFEST.schemaVersion) {
    return "FAME recorded pool state schema version does not match the manifest.";
  }
  if (snapshot.pinnedBaseBlock !== FAME_SWAP_ARTIFACT_MANIFEST.pinnedBaseBlock) {
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

function quoteContext(snapshot: FamePoolStateSnapshotFile): FameQuoteContext {
  return {
    source: "snapshot",
    snapshotId: snapshot.snapshotId,
    pinnedBaseBlock: snapshot.pinnedBaseBlock,
  };
}

function priceImpactFromSnapshot(
  entry: FameSnapshotQuoteEntry,
): FamePriceImpactEstimate | undefined {
  if (!entry.priceImpact) return undefined;
  return {
    preSwapPriceX18: BigInt(entry.priceImpact.preSwapPriceX18),
    postSwapPriceX18:
      entry.priceImpact.postSwapPriceX18 === null
        ? null
        : BigInt(entry.priceImpact.postSwapPriceX18),
    executionPriceX18: BigInt(entry.priceImpact.executionPriceX18),
    marketImpactBps: entry.priceImpact.marketImpactBps,
    method: entry.priceImpact.method,
  };
}

function quoteFromTable(
  request: FameEdgeQuoteRequest,
  entry: FameSnapshotQuoteEntry,
  context: FameQuoteContext,
): FameEdgeQuoteResult {
  return {
    status: "quoted",
    amountIn: request.amountIn,
    amountOut: BigInt(entry.amountOut),
    capacityIn: null,
    fee: request.edge.fee,
    evidence: entry.evidence,
    context,
    priceImpact: priceImpactFromSnapshot(entry),
  };
}

function directedReserves(
  request: FameEdgeQuoteRequest,
  reserve: FameSnapshotReserveState,
): readonly [bigint, bigint] | null {
  const reserve0 = BigInt(reserve.reserve0);
  const reserve1 = BigInt(reserve.reserve1);
  if (sameAddress(request.edge.tokenIn, reserve.token0)) {
    return [reserve0, reserve1];
  }
  if (sameAddress(request.edge.tokenIn, reserve.token1)) {
    return [reserve1, reserve0];
  }
  return null;
}

function quoteFromReserves(
  request: FameEdgeQuoteRequest,
  reserve: FameSnapshotReserveState,
  context: FameQuoteContext,
): FameEdgeQuoteResult {
  const reserveReplaySupported =
    request.edge.pool.venue === "uniswap-v2" ||
    (request.edge.pool.venue === "solidly" && request.edge.pool.stable === false);
  if (!reserveReplaySupported) {
    return {
      status: "failed",
      reason: "no_quote_evidence",
      message: `${request.edge.poolId} recorded reserve replay is only validated for constant-product pools.`,
    };
  }
  if (request.edge.fee.status !== "available") {
    return {
      status: "failed",
      reason: "no_quote_evidence",
      message: `${request.edge.poolId} has no fee metadata for recorded reserve math.`,
    };
  }

  const reserves = directedReserves(request, reserve);
  if (!reserves) {
    return {
      status: "failed",
      reason: "adapter_failure",
      message: `${request.edge.poolId} recorded reserve direction is malformed.`,
    };
  }

  const amountOut = constantProductAmountOut(
    request.amountIn,
    reserves[0],
    reserves[1],
    request.edge.fee.feeBps,
  );
  if (amountOut <= 0n) {
    return {
      status: "failed",
      reason: "zero_output",
      message: `${request.edge.poolId} recorded reserve quote returned zero output.`,
    };
  }

  return {
    status: "quoted",
    amountIn: request.amountIn,
    amountOut,
    capacityIn: null,
    fee: request.edge.fee,
    evidence: `recorded reserves ${reserve.source} for ${reserve.poolId}`,
    context,
    priceImpact: constantProductPriceImpact({
      amountIn: request.amountIn,
      amountOut,
      reserveIn: reserves[0],
      reserveOut: reserves[1],
    }),
  };
}

export function createSnapshotQuoteAdapter(
  snapshot: FamePoolStateSnapshotFile = poolStateSnapshotFile,
): FameQuoteAdapter {
  const issue = snapshotIntegrityIssue(snapshot);
  const context = quoteContext(snapshot);
  const quotesByKey = new Map(
    snapshot.quoteTable.map((entry) => [
      key(
        entry.poolId,
        entry.tokenIn,
        entry.tokenOut,
        BigInt(entry.amountIn),
      ),
      entry,
    ]),
  );
  const reservesByKey = new Map(
    snapshot.reserveStates.map((reserve) => [
      key(reserve.poolId, reserve.token0, reserve.token1),
      reserve,
    ]),
  );

  return {
    quoteContext: context,
    quoteEdge(request) {
      if (issue) {
        return {
          status: "failed",
          reason: "adapter_failure",
          message: issue,
        };
      }

      const tableEntry = quotesByKey.get(
        key(
          request.edge.poolId,
          request.edge.tokenIn,
          request.edge.tokenOut,
          request.amountIn,
        ),
      );
      if (tableEntry) return quoteFromTable(request, tableEntry, context);

      const reserve =
        "token0" in request.edge.pool
          ? reservesByKey.get(
              key(
                request.edge.poolId,
                request.edge.pool.token0,
                request.edge.pool.token1,
              ),
            )
          : undefined;
      if (reserve) return quoteFromReserves(request, reserve, context);

      return {
        status: "failed",
        reason: "no_quote_evidence",
        message: `No recorded quote evidence for ${request.edge.poolId} at input ${request.amountIn.toString()}.`,
      };
    },
  };
}
