import type { Address } from "viem";
import { parsedFameSwapArtifactFiles } from "../artifactFiles";
import type {
  FameEdgeQuoteRequest,
  FameEdgeQuoteResult,
  FamePriceImpactEstimate,
  FameProtocolEvidence,
  FameProtocolEvidenceItem,
  FameQuoteAdapter,
} from "./adapters";
import type { FameQuoteContext } from "./quoteContext";
import { constantProductPriceImpact } from "./routeMath";
import {
  snapshotIntegrityIssue as snapshotIntegrityIssueForFile,
  type FamePoolStateSnapshotFile,
  type FameSnapshotQuoteEntry,
  type FameSnapshotReserveState,
} from "./snapshotTypes";

export type {
  FamePoolStateSnapshotFile,
  FameSnapshotQuoteEntry,
  FameSnapshotReserveState,
} from "./snapshotTypes";

export interface FameReserveReplayState {
  poolId: string;
  token0: Address;
  token1: Address;
  reserve0: string;
  reserve1: string;
}

export const poolStateSnapshotFile =
  parsedFameSwapArtifactFiles().poolStateSnapshot;

export function snapshotIntegrityIssue(
  snapshot: FamePoolStateSnapshotFile = poolStateSnapshotFile,
): string | null {
  return snapshotIntegrityIssueForFile(snapshot);
}

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
  return (
    (amountInWithFee * reserveOut) /
    (reserveIn * feeDenominator + amountInWithFee)
  );
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

function availableEvidence(
  source: string,
  value?: bigint | number | string | null,
): FameProtocolEvidenceItem {
  return {
    status: "available",
    source,
    ...(value === undefined || value === null
      ? {}
      : { value: value.toString() }),
  };
}

function unavailableEvidence(
  source: string,
  reason: string,
): FameProtocolEvidenceItem {
  return {
    status: "unavailable",
    source,
    reason,
  };
}

function notApplicableEvidence(
  source: string,
  reason: string,
): FameProtocolEvidenceItem {
  return {
    status: "not_applicable",
    source,
    reason,
  };
}

function protocolEvidenceFromPriceImpact(options: {
  source: string;
  amountOut: bigint;
  priceImpact?: FamePriceImpactEstimate;
  activeLiquidity?: FameProtocolEvidenceItem;
}): FameProtocolEvidence {
  const priceImpact = options.priceImpact;
  return {
    quote: availableEvidence(options.source, options.amountOut),
    prePrice: priceImpact
      ? availableEvidence(options.source, priceImpact.preSwapPriceX18)
      : unavailableEvidence(
          options.source,
          "Recorded pre-price evidence is unavailable.",
        ),
    postPrice: priceImpact
      ? priceImpact.postSwapPriceX18 === null
        ? unavailableEvidence(
            options.source,
            "Recorded post-price evidence is unavailable.",
          )
        : availableEvidence(options.source, priceImpact.postSwapPriceX18)
      : unavailableEvidence(
          options.source,
          "Recorded post-price evidence is unavailable.",
        ),
    marketImpact:
      priceImpact?.marketImpactBps === undefined ||
      priceImpact.marketImpactBps === null
        ? unavailableEvidence(
            options.source,
            "Recorded market-impact evidence is unavailable.",
          )
        : availableEvidence(options.source, priceImpact.marketImpactBps),
    activeLiquidity:
      options.activeLiquidity ??
      notApplicableEvidence(
        options.source,
        "Recorded active liquidity evidence is not applicable for this adapter.",
      ),
  };
}

function quoteFromTable(
  request: FameEdgeQuoteRequest,
  entry: FameSnapshotQuoteEntry,
  context: FameQuoteContext,
): FameEdgeQuoteResult {
  const priceImpact = priceImpactFromSnapshot(entry);
  return {
    status: "quoted",
    amountIn: request.amountIn,
    amountOut: BigInt(entry.amountOut),
    capacityIn: null,
    fee: request.edge.fee,
    evidence: entry.evidence,
    context,
    priceImpact,
    protocolEvidence:
      entry.protocolEvidence ??
      protocolEvidenceFromPriceImpact({
        source: entry.evidence,
        amountOut: BigInt(entry.amountOut),
        priceImpact,
        activeLiquidity:
          request.edge.pool.venue === "uniswap-v4"
            ? unavailableEvidence(
                "recorded-state quote evidence",
                "Recorded snapshot does not include V4 StateView.getLiquidity evidence.",
              )
            : undefined,
      }),
  };
}

function directedReserves(
  request: FameEdgeQuoteRequest,
  reserve: FameReserveReplayState,
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

export function quoteFromReserveReplay(options: {
  request: FameEdgeQuoteRequest;
  reserve: FameReserveReplayState;
  context: FameQuoteContext;
  source: string;
}): FameEdgeQuoteResult {
  const { request, reserve, context, source } = options;
  const reserveReplaySupported =
    request.edge.pool.venue === "uniswap-v2" ||
    (request.edge.pool.venue === "solidly" &&
      request.edge.pool.stable === false) ||
    (request.edge.pool.venue === "aerodrome-v2" &&
      request.edge.pool.stable === false);
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

  const priceImpact = constantProductPriceImpact({
    amountIn: request.amountIn,
    amountOut,
    reserveIn: reserves[0],
    reserveOut: reserves[1],
  });

  return {
    status: "quoted",
    amountIn: request.amountIn,
    amountOut,
    capacityIn: null,
    fee: request.edge.fee,
    evidence: source,
    context,
    priceImpact,
    protocolEvidence: protocolEvidenceFromPriceImpact({
      source,
      amountOut,
      priceImpact,
      activeLiquidity: notApplicableEvidence(
        source,
        "Constant-product reserve replay uses reserves, not V4 active liquidity.",
      ),
    }),
  };
}

function quoteFromReserves(
  request: FameEdgeQuoteRequest,
  reserve: FameSnapshotReserveState,
  context: FameQuoteContext,
): FameEdgeQuoteResult {
  return quoteFromReserveReplay({
    request,
    reserve,
    context,
    source: `recorded reserves ${reserve.source} for ${reserve.poolId}`,
  });
}

function quoteFromNativeWrap(
  request: FameEdgeQuoteRequest,
  context: FameQuoteContext,
): FameEdgeQuoteResult {
  const source = "native WETH wrap/unwrap identity quote";
  return {
    status: "quoted",
    amountIn: request.amountIn,
    amountOut: request.amountIn,
    capacityIn: null,
    fee: request.edge.fee,
    evidence: source,
    context,
    protocolEvidence: {
      quote: availableEvidence(source, request.amountIn),
      prePrice: notApplicableEvidence(
        source,
        "Native wrap is a 1:1 token operation, not a priced pool swap.",
      ),
      postPrice: notApplicableEvidence(
        source,
        "Native wrap is a 1:1 token operation, not a priced pool swap.",
      ),
      marketImpact: notApplicableEvidence(
        source,
        "Native wrap has no market impact.",
      ),
      activeLiquidity: notApplicableEvidence(
        source,
        "Native wrap uses canonical WETH deposit/withdraw, not pool liquidity.",
      ),
    },
  };
}

export function createSnapshotQuoteAdapter(
  snapshot: FamePoolStateSnapshotFile = poolStateSnapshotFile,
): FameQuoteAdapter {
  const issue = snapshotIntegrityIssue(snapshot);
  const context = quoteContext(snapshot);
  const quotesByKey = new Map(
    snapshot.quoteTable.map((entry) => [
      key(entry.poolId, entry.tokenIn, entry.tokenOut, BigInt(entry.amountIn)),
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

      if (request.edge.venue === "NativeWrap") {
        return quoteFromNativeWrap(request, context);
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
