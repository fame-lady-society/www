import type { Address } from "viem";
import { FAME_SWAP_ARTIFACT_MANIFEST } from "../artifacts/manifest";
import { supportedDirections } from "./artifacts";
import { solveFameSwapAmount, solveFameSwapAmountAsync } from "./amountSolver";
import type { FameAsyncQuoteAdapter, FameQuoteAdapter } from "./quotes/adapters";
import { routeCandidatesForPair } from "./graph/candidates";
import {
  DEFAULT_FAME_SWAP_SLIPPAGE_BPS,
  normalizeSlippageBps,
} from "./slippage";
import {
  deadlineMinutesToSeconds,
  DEFAULT_FAME_SWAP_DEADLINE_MINUTES,
} from "./deadline";
import type {
  FameSwapQuote,
  FameSwapQuoteRequest,
  FameSwapReadiness,
} from "./types";

function defaultDeadline(now: Date, seconds?: bigint): bigint {
  return (
    BigInt(Math.floor(now.getTime() / 1000)) +
    (seconds ?? deadlineMinutesToSeconds(DEFAULT_FAME_SWAP_DEADLINE_MINUTES))
  );
}

function notLiveReady(
  request: FameSwapQuoteRequest,
  readiness: Extract<FameSwapReadiness, { status: "not_live_ready" }>,
): FameSwapQuote {
  return {
    status: "not_live_ready",
    tokenIn: request.tokenIn,
    tokenOut: request.tokenOut,
    requestedAmountIn: request.amountIn,
    readiness,
    message: readiness.message,
    diagnosticsVisibleByDefault: true,
  };
}

export function quoteFameSwap(
  request: FameSwapQuoteRequest & { adapter?: FameQuoteAdapter },
): FameSwapQuote {
  if (request.amountIn <= 0n) {
    return {
      status: "unsupported",
      tokenIn: request.tokenIn,
      tokenOut: request.tokenOut,
      requestedAmountIn: request.amountIn,
      availableDirections: supportedDirections(),
      message: "Enter an amount greater than zero.",
      diagnosticsVisibleByDefault: false,
    };
  }

  const candidateSet = routeCandidatesForPair(
    request.tokenIn.address,
    request.tokenOut.address,
  );
  if (
    candidateSet.candidates.length === 0 &&
    candidateSet.rejected[0]?.reason === "unsupported_pair"
  ) {
    return {
      status: "unsupported",
      tokenIn: request.tokenIn,
      tokenOut: request.tokenOut,
      requestedAmountIn: request.amountIn,
      availableDirections: supportedDirections(),
      message: candidateSet.rejected[0].detail,
      diagnosticsVisibleByDefault: true,
    };
  }

  const readiness =
    request.readiness ??
    ({
      status: "not_live_ready",
      reason: "read_error",
      message:
        "Live FAME router readiness has not been checked for this quote.",
      routerAddress: request.config.routerAddress,
    } as const);
  if (readiness.status === "not_live_ready") {
    return notLiveReady(request, readiness);
  }

  if (!request.recipient) {
    return notLiveReady(request, {
      status: "not_live_ready",
      reason: "missing_recipient",
      message: "Connect a wallet before materializing a FAME router route.",
      routerAddress: readiness.routerAddress,
    });
  }

  const deadline = defaultDeadline(
    request.now ?? new Date(),
    request.deadlineSeconds,
  );
  const slippageBps = normalizeSlippageBps(request.config.defaultSlippageBps);
  const solved = solveFameSwapAmount({
    tokenIn: request.tokenIn,
    tokenOut: request.tokenOut,
    amountIn: request.amountIn,
    routerAddress: readiness.routerAddress,
    recipient: request.recipient,
    deadline,
    feePpm: readiness.feePpm,
    slippageBps,
    adapter: request.adapter,
  });

  if (solved.status === "unsupported") {
    return {
      status: "unsupported",
      tokenIn: request.tokenIn,
      tokenOut: request.tokenOut,
      requestedAmountIn: request.amountIn,
      availableDirections: supportedDirections(),
      message: solved.message,
      diagnosticsVisibleByDefault: true,
    };
  }

  if (solved.status === "no_safe_route") {
    return {
      status: "no_safe_route",
      tokenIn: request.tokenIn,
      tokenOut: request.tokenOut,
      requestedAmountIn: request.amountIn,
      rejectedCandidates: solved.rejectedCandidates,
      message: solved.message,
      diagnosticsVisibleByDefault: true,
    };
  }

  if (solved.status === "quote_adapter_failure") {
    return {
      status: "quote_adapter_failure",
      tokenIn: request.tokenIn,
      tokenOut: request.tokenOut,
      requestedAmountIn: request.amountIn,
      rejectedCandidates: solved.rejectedCandidates,
      message: solved.message,
      diagnosticsVisibleByDefault: true,
    };
  }

  if (solved.status !== "ready") {
    return {
      status: "quote_adapter_failure",
      tokenIn: request.tokenIn,
      tokenOut: request.tokenOut,
      requestedAmountIn: request.amountIn,
      rejectedCandidates: solved.rejectedCandidates,
      message: solved.message,
      diagnosticsVisibleByDefault: true,
    };
  }

  const inputToken = request.tokenIn;
  const callValue = inputToken.native ? solved.route.amountIn : 0n;
  const approval = inputToken.native
    ? null
    : {
        token: request.tokenIn,
        spender: readiness.routerAddress,
        amount: solved.route.amountIn,
      };

  return {
    status: "ready",
    tokenIn: request.tokenIn,
    tokenOut: request.tokenOut,
    requestedAmountIn: request.amountIn,
    routerAddress: readiness.routerAddress,
    routeArtifactId: solved.routeArtifactId,
    routeSource: "generated",
    fixtureRouteHash: solved.routeHash,
    materializedRouteHash: solved.routeHash,
    poolIds: solved.poolIds,
    route: solved.route,
    approval,
    callValue,
    grossEstimatedOutput: solved.plan.grossAmountOut,
    routerFeeAmount: solved.plan.routerFeeAmount,
    estimatedOutput: solved.plan.netAmountOut,
    minAmountOutAfterFee: solved.route.minAmountOutAfterFee,
    feeBreakdown: solved.plan.feeBreakdown,
    quoteContext: solved.plan.quoteContext,
    feePpm: readiness.feePpm,
    capabilities: solved.capabilities,
    routeDisplay: solved.routeDisplay,
    rejectedCandidates: solved.rejectedCandidates,
    slippageBps,
    expiresAt: new Date(Number(deadline) * 1000),
    warnings: solved.warnings,
    message: "FAME router route is ready for live wallet simulation.",
    diagnosticsVisibleByDefault: false,
  };
}

export async function quoteFameSwapAsync(
  request: FameSwapQuoteRequest & { adapter: FameAsyncQuoteAdapter },
): Promise<FameSwapQuote> {
  if (request.amountIn <= 0n) {
    return {
      status: "unsupported",
      tokenIn: request.tokenIn,
      tokenOut: request.tokenOut,
      requestedAmountIn: request.amountIn,
      availableDirections: supportedDirections(),
      message: "Enter an amount greater than zero.",
      diagnosticsVisibleByDefault: false,
    };
  }

  const candidateSet = routeCandidatesForPair(
    request.tokenIn.address,
    request.tokenOut.address,
  );
  if (
    candidateSet.candidates.length === 0 &&
    candidateSet.rejected[0]?.reason === "unsupported_pair"
  ) {
    return {
      status: "unsupported",
      tokenIn: request.tokenIn,
      tokenOut: request.tokenOut,
      requestedAmountIn: request.amountIn,
      availableDirections: supportedDirections(),
      message: candidateSet.rejected[0].detail,
      diagnosticsVisibleByDefault: true,
    };
  }

  const readiness =
    request.readiness ??
    ({
      status: "not_live_ready",
      reason: "read_error",
      message:
        "Live FAME router readiness has not been checked for this quote.",
      routerAddress: request.config.routerAddress,
    } as const);
  if (readiness.status === "not_live_ready") {
    return notLiveReady(request, readiness);
  }

  if (!request.recipient) {
    return notLiveReady(request, {
      status: "not_live_ready",
      reason: "missing_recipient",
      message: "Connect a wallet before materializing a FAME router route.",
      routerAddress: readiness.routerAddress,
    });
  }

  const deadline = defaultDeadline(
    request.now ?? new Date(),
    request.deadlineSeconds,
  );
  const slippageBps = normalizeSlippageBps(request.config.defaultSlippageBps);
  const solved = await solveFameSwapAmountAsync({
    tokenIn: request.tokenIn,
    tokenOut: request.tokenOut,
    amountIn: request.amountIn,
    routerAddress: readiness.routerAddress,
    recipient: request.recipient,
    deadline,
    feePpm: readiness.feePpm,
    slippageBps,
    adapter: request.adapter,
  });

  if (solved.status === "unsupported") {
    return {
      status: "unsupported",
      tokenIn: request.tokenIn,
      tokenOut: request.tokenOut,
      requestedAmountIn: request.amountIn,
      availableDirections: supportedDirections(),
      message: solved.message,
      diagnosticsVisibleByDefault: true,
    };
  }

  if (solved.status === "no_safe_route") {
    return {
      status: "no_safe_route",
      tokenIn: request.tokenIn,
      tokenOut: request.tokenOut,
      requestedAmountIn: request.amountIn,
      rejectedCandidates: solved.rejectedCandidates,
      message: solved.message,
      diagnosticsVisibleByDefault: true,
    };
  }

  if (solved.status === "quote_adapter_failure") {
    return {
      status: "quote_adapter_failure",
      tokenIn: request.tokenIn,
      tokenOut: request.tokenOut,
      requestedAmountIn: request.amountIn,
      rejectedCandidates: solved.rejectedCandidates,
      message: solved.message,
      diagnosticsVisibleByDefault: true,
    };
  }

  if (solved.status !== "ready") {
    return {
      status: "quote_adapter_failure",
      tokenIn: request.tokenIn,
      tokenOut: request.tokenOut,
      requestedAmountIn: request.amountIn,
      rejectedCandidates: solved.rejectedCandidates,
      message: solved.message,
      diagnosticsVisibleByDefault: true,
    };
  }

  const inputToken = request.tokenIn;
  const callValue = inputToken.native ? solved.route.amountIn : 0n;
  const approval = inputToken.native
    ? null
    : {
        token: request.tokenIn,
        spender: readiness.routerAddress,
        amount: solved.route.amountIn,
      };

  return {
    status: "ready",
    tokenIn: request.tokenIn,
    tokenOut: request.tokenOut,
    requestedAmountIn: request.amountIn,
    routerAddress: readiness.routerAddress,
    routeArtifactId: solved.routeArtifactId,
    routeSource: "generated",
    fixtureRouteHash: solved.routeHash,
    materializedRouteHash: solved.routeHash,
    poolIds: solved.poolIds,
    route: solved.route,
    approval,
    callValue,
    grossEstimatedOutput: solved.plan.grossAmountOut,
    routerFeeAmount: solved.plan.routerFeeAmount,
    estimatedOutput: solved.plan.netAmountOut,
    minAmountOutAfterFee: solved.route.minAmountOutAfterFee,
    feeBreakdown: solved.plan.feeBreakdown,
    quoteContext: solved.plan.quoteContext,
    feePpm: readiness.feePpm,
    capabilities: solved.capabilities,
    routeDisplay: solved.routeDisplay,
    rejectedCandidates: solved.rejectedCandidates,
    slippageBps,
    expiresAt: new Date(Number(deadline) * 1000),
    warnings: solved.warnings,
    message: "FAME router route is ready for live wallet simulation.",
    diagnosticsVisibleByDefault: false,
  };
}

export function quoteWithReadyReadiness(
  request: Omit<FameSwapQuoteRequest, "readiness" | "config"> & {
    routerAddress: Address;
    adapter: FameQuoteAdapter;
  },
): FameSwapQuote {
  return quoteFameSwap({
    ...request,
    config: {
      routerAddress: request.routerAddress,
      defaultSlippageBps: DEFAULT_FAME_SWAP_SLIPPAGE_BPS,
      expectedSchemaVersion: FAME_SWAP_ARTIFACT_MANIFEST.schemaVersion,
      expectedPinnedBaseBlock: FAME_SWAP_ARTIFACT_MANIFEST.pinnedBaseBlock,
      expectedSolverRoutesHash: FAME_SWAP_ARTIFACT_MANIFEST.solverRoutesJsonHash,
      expectedGapMatrixHash: FAME_SWAP_ARTIFACT_MANIFEST.gapMatrixJsonHash,
      expectedParityVectorsHash:
        FAME_SWAP_ARTIFACT_MANIFEST.parityVectorsJsonHash,
      expectedPoolsHash: FAME_SWAP_ARTIFACT_MANIFEST.poolsJsonHash,
      expectedPoolStateSnapshotHash:
        FAME_SWAP_ARTIFACT_MANIFEST.poolStateSnapshotJsonHash,
    },
    readiness: {
      status: "ready",
      routerAddress: request.routerAddress,
      feePpm: 2_222n,
    },
    adapter: request.adapter,
  });
}
