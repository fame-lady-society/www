import type { Address } from "viem";
import { FAME_SWAP_ARTIFACT_MANIFEST } from "../artifacts/manifest";
import { tokenForAddress, type FameSwapToken } from "../tokens";
import {
  gapRowForPair,
  isPinnedRouteArtifactId,
  routeArtifactById,
  routeArtifactsForPair,
  supportedDirections,
} from "./artifacts";
import { materializeFameRoute } from "./materializeRoute";
import {
  applySlippageToAmount,
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
  FameSwapRouteDisplayLeg,
} from "./types";

function defaultDeadline(now: Date, seconds?: bigint): bigint {
  return (
    BigInt(Math.floor(now.getTime() / 1000)) +
    (seconds ?? deadlineMinutesToSeconds(DEFAULT_FAME_SWAP_DEADLINE_MINUTES))
  );
}

function notLiveReady(
  request: FameSwapQuoteRequest,
  routeArtifactId: string,
  readiness: Extract<FameSwapReadiness, { status: "not_live_ready" }>,
): FameSwapQuote {
  return {
    status: "not_live_ready",
    tokenIn: request.tokenIn,
    tokenOut: request.tokenOut,
    requestedAmountIn: request.amountIn,
    routeArtifactId,
    readiness,
    message: readiness.message,
    diagnosticsVisibleByDefault: true,
  };
}

function routeDisplay(artifactRouteId: string): FameSwapRouteDisplayLeg[] {
  const artifact = routeArtifactById(artifactRouteId);
  if (!artifact) return [];

  return artifact.route.legs.map((leg) => ({
    tokenIn: tokenForAddress(leg.tokenIn)?.symbol ?? leg.tokenIn,
    tokenOut: tokenForAddress(leg.tokenOut)?.symbol ?? leg.tokenOut,
    venue: leg.venue,
    amountMode: leg.amountMode,
  }));
}

export function quoteFameSwap(request: FameSwapQuoteRequest): FameSwapQuote {
  const routeCandidates = routeArtifactsForPair(request.tokenIn, request.tokenOut);
  const gapRow = gapRowForPair(request.tokenIn, request.tokenOut);
  const preferredRouteArtifactId =
    gapRow?.supported && gapRow.routeArtifactId
      ? gapRow.routeArtifactId
      : routeCandidates[0]?.id;

  if (!preferredRouteArtifactId) {
    return {
      status: "unsupported",
      tokenIn: request.tokenIn,
      tokenOut: request.tokenOut,
      requestedAmountIn: request.amountIn,
      availableDirections: supportedDirections(),
      message: "This FAME router direction is not in the pinned route set.",
      diagnosticsVisibleByDefault: true,
    };
  }

  if (gapRow && (!gapRow.tsGenerated || !gapRow.forkTested || gapRow.executable !== "executable")) {
    return {
      status: "stale_artifact",
      tokenIn: request.tokenIn,
      tokenOut: request.tokenOut,
      requestedAmountIn: request.amountIn,
      reason:
        gapRow.blocker ??
        "The pinned route artifact is not marked generated, executable, and fork-tested.",
      message: "This FAME router route is not ready for execution.",
      diagnosticsVisibleByDefault: true,
    };
  }

  if (!isPinnedRouteArtifactId(preferredRouteArtifactId)) {
    return {
      status: "stale_artifact",
      tokenIn: request.tokenIn,
      tokenOut: request.tokenOut,
      requestedAmountIn: request.amountIn,
      reason: "The gap matrix points at a route id outside the pinned manifest.",
      message: "This FAME router route is not part of the approved artifact set.",
      diagnosticsVisibleByDefault: true,
    };
  }
  const routeArtifactId = preferredRouteArtifactId;

  const artifact = routeArtifactById(routeArtifactId);
  if (!artifact) {
    return {
      status: "stale_artifact",
      tokenIn: request.tokenIn,
      tokenOut: request.tokenOut,
      requestedAmountIn: request.amountIn,
      reason: "The pinned route artifact is missing from the copied route file.",
      message: "This FAME router route is missing its exact route artifact.",
      diagnosticsVisibleByDefault: true,
    };
  }

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
    return notLiveReady(request, routeArtifactId, readiness);
  }

  if (!request.recipient) {
    return notLiveReady(request, routeArtifactId, {
      status: "not_live_ready",
      reason: "missing_recipient",
      message: "Connect a wallet before materializing a FAME router route.",
      routerAddress: readiness.routerAddress,
    });
  }

  const deadline = defaultDeadline(request.now ?? new Date(), request.deadlineSeconds);
  const slippageBps = normalizeSlippageBps(request.config.defaultSlippageBps);
  const materialized = materializeFameRoute(
    artifact.route,
    readiness.routerAddress,
    request.recipient,
    deadline,
    {
      amountIn: request.amountIn,
      minAmountOutAfterFee: 1n,
      slippageBps,
    },
  );
  const inputToken = tokenForAddress(materialized.route.tokenIn);
  const callValue = inputToken?.native ? materialized.route.amountIn : 0n;
  const approval = inputToken?.native
    ? null
    : {
        token: request.tokenIn,
        spender: readiness.routerAddress,
        amount: materialized.route.amountIn,
      };

  return {
    status: "ready",
    tokenIn: request.tokenIn,
    tokenOut: request.tokenOut,
    requestedAmountIn: request.amountIn,
    routerAddress: readiness.routerAddress,
    routeArtifactId,
    fixtureRouteHash: artifact.routeHash,
    materializedRouteHash: materialized.routeHash,
    artifact,
    route: materialized.route,
    approval,
    callValue,
    estimatedOutput: applySlippageToAmount(
      BigInt(artifact.debug.finalPostFeeMinimum),
      slippageBps,
    ),
    minAmountOutAfterFee: materialized.route.minAmountOutAfterFee,
    feePpm: readiness.feePpm,
    capabilities: artifact.capabilities,
    routeDisplay: routeDisplay(routeArtifactId),
    slippageBps,
    expiresAt: new Date(Number(deadline) * 1000),
    warnings: [],
    message: "FAME router route is ready for live wallet simulation.",
    diagnosticsVisibleByDefault: false,
  };
}

export function quoteWithReadyReadiness(
  request: Omit<FameSwapQuoteRequest, "readiness" | "config"> & {
    routerAddress: Address;
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
    },
    readiness: {
      status: "ready",
      routerAddress: request.routerAddress,
      feePpm: 2_222n,
    },
  });
}
