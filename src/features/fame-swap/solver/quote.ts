import type { Address } from "viem";
import { FAME_SWAP_ARTIFACT_MANIFEST } from "../artifacts/manifest";
import { supportedDirections } from "./artifacts";
import {
  solveFameSwapAmount,
  solveFameSwapAmountAsync,
  type FameAmountSolverResult,
} from "./amountSolver";
import type {
  FameAsyncQuoteAdapter,
  FameQuoteAdapter,
} from "./quotes/adapters";
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

type ReadyReadiness = Extract<FameSwapReadiness, { status: "ready" }>;

export const FAME_SWAP_PREVIEW_RECIPIENT =
  "0x0000000000000000000000000000000000000001" as Address;

type PreparedQuoteRequest =
  | {
      status: "blocked";
      quote: FameSwapQuote;
    }
  | {
      status: "ready";
      readiness: ReadyReadiness;
      recipient: Address;
      deadline: bigint;
      slippageBps: number;
    };

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

function readinessForRequest(request: FameSwapQuoteRequest): FameSwapReadiness {
  return (
    request.readiness ??
    ({
      status: "not_live_ready",
      reason: "read_error",
      message:
        "Live FAME router readiness has not been checked for this quote.",
      routerAddress: request.config.routerAddress,
    } as const)
  );
}

function prepareQuoteRequest(
  request: FameSwapQuoteRequest,
): PreparedQuoteRequest {
  if (request.amountIn <= 0n) {
    return {
      status: "blocked",
      quote: {
        status: "unsupported",
        tokenIn: request.tokenIn,
        tokenOut: request.tokenOut,
        requestedAmountIn: request.amountIn,
        availableDirections: supportedDirections(),
        message: "Enter an amount greater than zero.",
        diagnosticsVisibleByDefault: false,
      },
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
      status: "blocked",
      quote: {
        status: "unsupported",
        tokenIn: request.tokenIn,
        tokenOut: request.tokenOut,
        requestedAmountIn: request.amountIn,
        availableDirections: supportedDirections(),
        message: candidateSet.rejected[0].detail,
        diagnosticsVisibleByDefault: true,
      },
    };
  }

  const readiness = readinessForRequest(request);
  if (readiness.status === "not_live_ready") {
    return {
      status: "blocked",
      quote: notLiveReady(request, readiness),
    };
  }

  const deadline = defaultDeadline(
    request.now ?? new Date(),
    request.deadlineSeconds,
  );

  return {
    status: "ready",
    readiness,
    recipient: request.recipient ?? FAME_SWAP_PREVIEW_RECIPIENT,
    deadline,
    slippageBps: normalizeSlippageBps(request.config.defaultSlippageBps),
  };
}

function quoteFromSolverResult(
  request: FameSwapQuoteRequest,
  prepared: Extract<PreparedQuoteRequest, { status: "ready" }>,
  solved: FameAmountSolverResult,
): FameSwapQuote {
  if (solved.status !== "ready") {
    switch (solved.status) {
      case "unsupported":
        return {
          status: "unsupported",
          tokenIn: request.tokenIn,
          tokenOut: request.tokenOut,
          requestedAmountIn: request.amountIn,
          availableDirections: supportedDirections(),
          message: solved.message,
          diagnosticsVisibleByDefault: true,
        };
      case "no_safe_route":
        return {
          status: "no_safe_route",
          tokenIn: request.tokenIn,
          tokenOut: request.tokenOut,
          requestedAmountIn: request.amountIn,
          rejectedCandidates: solved.rejectedCandidates,
          message: solved.message,
          diagnosticsVisibleByDefault: true,
        };
      case "quote_adapter_failure":
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
  }

  const inputToken = request.tokenIn;
  const callValue = inputToken.native ? solved.route.amountIn : 0n;
  const approval = inputToken.native
    ? null
    : {
        token: request.tokenIn,
        spender: prepared.readiness.routerAddress,
        amount: solved.route.amountIn,
      };

  return {
    status: "ready",
    tokenIn: request.tokenIn,
    tokenOut: request.tokenOut,
    requestedAmountIn: request.amountIn,
    routerAddress: prepared.readiness.routerAddress,
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
    feePpm: prepared.readiness.feePpm,
    capabilities: solved.capabilities,
    routeDisplay: solved.routeDisplay,
    rejectedCandidates: solved.rejectedCandidates,
    slippageBps: prepared.slippageBps,
    expiresAt: new Date(Number(prepared.deadline) * 1000),
    warnings: solved.warnings,
    message: "FAME router route is ready for live wallet simulation.",
    diagnosticsVisibleByDefault: false,
  };
}

export function quoteFameSwap(
  request: FameSwapQuoteRequest & { adapter?: FameQuoteAdapter },
): FameSwapQuote {
  const prepared = prepareQuoteRequest(request);
  if (prepared.status === "blocked") return prepared.quote;

  const solved = solveFameSwapAmount({
    tokenIn: request.tokenIn,
    tokenOut: request.tokenOut,
    amountIn: request.amountIn,
    routerAddress: prepared.readiness.routerAddress,
    recipient: prepared.recipient,
    deadline: prepared.deadline,
    feePpm: prepared.readiness.feePpm,
    slippageBps: prepared.slippageBps,
    adapter: request.adapter,
  });

  return quoteFromSolverResult(request, prepared, solved);
}

export async function quoteFameSwapAsync(
  request: FameSwapQuoteRequest & { adapter: FameAsyncQuoteAdapter },
): Promise<FameSwapQuote> {
  const prepared = prepareQuoteRequest(request);
  if (prepared.status === "blocked") return prepared.quote;

  const solved = await solveFameSwapAmountAsync({
    tokenIn: request.tokenIn,
    tokenOut: request.tokenOut,
    amountIn: request.amountIn,
    routerAddress: prepared.readiness.routerAddress,
    recipient: prepared.recipient,
    deadline: prepared.deadline,
    feePpm: prepared.readiness.feePpm,
    slippageBps: prepared.slippageBps,
    adapter: request.adapter,
  });

  return quoteFromSolverResult(request, prepared, solved);
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
      expectedSolverRoutesHash:
        FAME_SWAP_ARTIFACT_MANIFEST.solverRoutesJsonHash,
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
