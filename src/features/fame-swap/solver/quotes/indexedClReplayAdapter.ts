import type { Address } from "viem";
import type {
  FameAsyncQuoteAdapter,
  FameEdgeQuoteRequest,
  FameEdgeQuoteResult,
  FameQuoteAdapter,
} from "./adapters";
import type { FameQuoteContext } from "./quoteContext";
import { concentratedLiquidityPriceImpact } from "./routeMath";
import type {
  FameIndexedPoolStateBatchResponse,
  FameIndexedClReplayFreshEntry,
  FameIndexedPoolStateEntry,
} from "./indexedPoolStateClient";

type FameIndexedClReplayPoolState = FameIndexedClReplayFreshEntry;
type FameIndexedQuoteContext = Extract<FameQuoteContext, { source: "indexed" }>;

export type FameIndexedClReplayFallbackReason =
  | "fresh-replay-state-missing"
  | "malformed-replay-state"
  | "outside-indexed-tick-range"
  | "replay-failed"
  | "source-registry-mismatch"
  | "token-direction-mismatch"
  | "unsupported-pool";

export interface FameSlipstreamReplayQuote {
  amountOut: bigint;
  sqrtPriceX96After: bigint;
}

interface ReplayTick {
  tick: number;
  liquidityGross: bigint;
  liquidityNet: bigint;
}

const MIN_TICK = -887_272;
const MAX_TICK = 887_272;
const MIN_SQRT_RATIO = 4_295_128_739n;
const MAX_SQRT_RATIO =
  1_461_446_703_485_210_103_287_273_052_203_988_822_378_723_970_342n;
const Q96 = 2n ** 96n;
const FEE_DENOMINATOR = 1_000_000n;
const MAX_UINT256 = 2n ** 256n - 1n;

function isAsyncQuoteAdapter(
  adapter: FameQuoteAdapter | FameAsyncQuoteAdapter,
): adapter is FameAsyncQuoteAdapter {
  return adapter.quoteEdge.constructor.name === "AsyncFunction";
}

function toAsyncQuoteAdapter(
  adapter: FameQuoteAdapter | FameAsyncQuoteAdapter,
): FameAsyncQuoteAdapter {
  if (isAsyncQuoteAdapter(adapter)) return adapter;
  return {
    quoteContext: adapter.quoteContext,
    async quoteEdge(request) {
      return adapter.quoteEdge(request);
    },
  };
}

function sameAddress(left: Address, right: Address): boolean {
  return left.toLowerCase() === right.toLowerCase();
}

function parseUnsignedDecimal(value: string): bigint | null {
  if (!/^(0|[1-9][0-9]*)$/.test(value)) return null;
  return BigInt(value);
}

function parseSignedDecimal(value: string): bigint | null {
  if (!/^-?(0|[1-9][0-9]*)$/.test(value) || value === "-0") return null;
  return BigInt(value);
}

function indexedContext(
  indexedState: FameIndexedPoolStateBatchResponse,
): FameIndexedQuoteContext {
  return {
    source: "indexed",
    chainId:
      indexedState.pools.find((pool) => "chainId" in pool)?.chainId ?? 8453,
    currentBlock: indexedState.currentBlock,
    sourceRegistryId: indexedState.sourceRegistryId,
    effectiveMaxFreshnessBlocks: indexedState.effectiveMaxFreshnessBlocks,
    statusCounts: indexedState.pools.reduce(
      (counts, pool) => ({
        ...counts,
        [pool.status]: counts[pool.status] + 1,
      }),
      {
        fresh: 0,
        stale: 0,
        unknown: 0,
        unsupported: 0,
      },
    ),
  };
}

function divRoundingUp(numerator: bigint, denominator: bigint): bigint {
  const quotient = numerator / denominator;
  return numerator % denominator === 0n ? quotient : quotient + 1n;
}

function mulDivRoundingUp(
  left: bigint,
  right: bigint,
  denominator: bigint,
): bigint {
  return divRoundingUp(left * right, denominator);
}

function getSqrtRatioAtTick(tick: number): bigint {
  if (tick < MIN_TICK || tick > MAX_TICK) {
    throw new Error("Tick is outside the supported CL range.");
  }
  const absTick = tick < 0 ? -tick : tick;
  let ratio =
    (absTick & 0x1) !== 0
      ? 0xfffcb933bd6fad37aa2d162d1a594001n
      : 0x100000000000000000000000000000000n;
  if ((absTick & 0x2) !== 0)
    ratio = (ratio * 0xfff97272373d413259a46990580e213an) >> 128n;
  if ((absTick & 0x4) !== 0)
    ratio = (ratio * 0xfff2e50f5f656932ef12357cf3c7fdccn) >> 128n;
  if ((absTick & 0x8) !== 0)
    ratio = (ratio * 0xffe5caca7e10e4e61c3624eaa0941cd0n) >> 128n;
  if ((absTick & 0x10) !== 0)
    ratio = (ratio * 0xffcb9843d60f6159c9db58835c926644n) >> 128n;
  if ((absTick & 0x20) !== 0)
    ratio = (ratio * 0xff973b41fa98c081472e6896dfb254c0n) >> 128n;
  if ((absTick & 0x40) !== 0)
    ratio = (ratio * 0xff2ea16466c96a3843ec78b326b52861n) >> 128n;
  if ((absTick & 0x80) !== 0)
    ratio = (ratio * 0xfe5dee046a99a2a811c461f1969c3053n) >> 128n;
  if ((absTick & 0x100) !== 0)
    ratio = (ratio * 0xfcbe86c7900a88aedcffc83b479aa3a4n) >> 128n;
  if ((absTick & 0x200) !== 0)
    ratio = (ratio * 0xf987a7253ac413176f2b074cf7815e54n) >> 128n;
  if ((absTick & 0x400) !== 0)
    ratio = (ratio * 0xf3392b0822b70005940c7a398e4b70f3n) >> 128n;
  if ((absTick & 0x800) !== 0)
    ratio = (ratio * 0xe7159475a2c29b7443b29c7fa6e889d9n) >> 128n;
  if ((absTick & 0x1000) !== 0)
    ratio = (ratio * 0xd097f3bdfd2022b8845ad8f792aa5825n) >> 128n;
  if ((absTick & 0x2000) !== 0)
    ratio = (ratio * 0xa9f746462d870fdf8a65dc1f90e061e5n) >> 128n;
  if ((absTick & 0x4000) !== 0)
    ratio = (ratio * 0x70d869a156d2a1b890bb3df62baf32f7n) >> 128n;
  if ((absTick & 0x8000) !== 0)
    ratio = (ratio * 0x31be135f97d08fd981231505542fcfa6n) >> 128n;
  if ((absTick & 0x10000) !== 0)
    ratio = (ratio * 0x9aa508b5b7a84e1c677de54f3e99bc9n) >> 128n;
  if ((absTick & 0x20000) !== 0)
    ratio = (ratio * 0x5d6af8dedb81196699c329225ee604n) >> 128n;
  if ((absTick & 0x40000) !== 0)
    ratio = (ratio * 0x2216e584f5fa1ea926041bedfe98n) >> 128n;
  if ((absTick & 0x80000) !== 0)
    ratio = (ratio * 0x48a170391f7dc42444e8fa2n) >> 128n;
  if (tick > 0) ratio = MAX_UINT256 / ratio;
  return ratio % 2n ** 32n === 0n ? ratio >> 32n : (ratio >> 32n) + 1n;
}

function amount0Delta(
  sqrtA: bigint,
  sqrtB: bigint,
  liquidity: bigint,
  roundUp: boolean,
): bigint {
  const lower = sqrtA < sqrtB ? sqrtA : sqrtB;
  const upper = sqrtA < sqrtB ? sqrtB : sqrtA;
  const numerator1 = liquidity << 96n;
  const numerator2 = upper - lower;
  if (roundUp) {
    return divRoundingUp(
      mulDivRoundingUp(numerator1, numerator2, upper),
      lower,
    );
  }
  return (numerator1 * numerator2) / upper / lower;
}

function amount1Delta(
  sqrtA: bigint,
  sqrtB: bigint,
  liquidity: bigint,
  roundUp: boolean,
): bigint {
  const lower = sqrtA < sqrtB ? sqrtA : sqrtB;
  const upper = sqrtA < sqrtB ? sqrtB : sqrtA;
  return roundUp
    ? mulDivRoundingUp(liquidity, upper - lower, Q96)
    : (liquidity * (upper - lower)) / Q96;
}

function nextSqrtPriceFromInput(
  sqrtPriceX96: bigint,
  liquidity: bigint,
  amountIn: bigint,
  zeroForOne: boolean,
): bigint {
  if (amountIn === 0n) return sqrtPriceX96;
  if (zeroForOne) {
    const numerator1 = liquidity << 96n;
    return mulDivRoundingUp(
      numerator1,
      sqrtPriceX96,
      numerator1 + amountIn * sqrtPriceX96,
    );
  }
  return sqrtPriceX96 + (amountIn * Q96) / liquidity;
}

function computeSwapStep(options: {
  sqrtPriceX96: bigint;
  sqrtTargetX96: bigint;
  liquidity: bigint;
  amountRemaining: bigint;
  feePips: bigint;
  zeroForOne: boolean;
}): {
  sqrtNextX96: bigint;
  amountIn: bigint;
  amountOut: bigint;
  feeAmount: bigint;
} {
  const amountRemainingLessFee =
    (options.amountRemaining * (FEE_DENOMINATOR - options.feePips)) /
    FEE_DENOMINATOR;
  const amountInAtTarget = options.zeroForOne
    ? amount0Delta(
        options.sqrtTargetX96,
        options.sqrtPriceX96,
        options.liquidity,
        true,
      )
    : amount1Delta(
        options.sqrtPriceX96,
        options.sqrtTargetX96,
        options.liquidity,
        true,
      );
  const reachesTarget = amountRemainingLessFee >= amountInAtTarget;
  const sqrtNextX96 = reachesTarget
    ? options.sqrtTargetX96
    : nextSqrtPriceFromInput(
        options.sqrtPriceX96,
        options.liquidity,
        amountRemainingLessFee,
        options.zeroForOne,
      );
  const amountIn = reachesTarget
    ? amountInAtTarget
    : options.zeroForOne
      ? amount0Delta(sqrtNextX96, options.sqrtPriceX96, options.liquidity, true)
      : amount1Delta(
          options.sqrtPriceX96,
          sqrtNextX96,
          options.liquidity,
          true,
        );
  const amountOut = options.zeroForOne
    ? amount1Delta(sqrtNextX96, options.sqrtPriceX96, options.liquidity, false)
    : amount0Delta(options.sqrtPriceX96, sqrtNextX96, options.liquidity, false);
  const feeAmount = reachesTarget
    ? mulDivRoundingUp(
        amountIn,
        options.feePips,
        FEE_DENOMINATOR - options.feePips,
      )
    : options.amountRemaining - amountIn;
  return { sqrtNextX96, amountIn, amountOut, feeAmount };
}

function nextInitializedTick(
  ticks: readonly ReplayTick[],
  currentTick: number,
  zeroForOne: boolean,
): ReplayTick | null {
  if (zeroForOne) {
    for (let index = ticks.length - 1; index >= 0; index -= 1) {
      const tick = ticks[index];
      if (tick && tick.tick <= currentTick) return tick;
    }
    return null;
  }
  return ticks.find((tick) => tick.tick > currentTick) ?? null;
}

function replayTicks(state: FameIndexedClReplayPoolState): ReplayTick[] | null {
  const ticks = state.initializedTicks.map((tick) => {
    const liquidityGross = parseUnsignedDecimal(tick.liquidityGross);
    const liquidityNet = parseSignedDecimal(tick.liquidityNet);
    if (liquidityGross === null || liquidityNet === null) return null;
    return {
      tick: tick.tick,
      liquidityGross,
      liquidityNet,
    };
  });
  if (ticks.some((tick) => tick === null)) return null;
  return ticks
    .filter((tick): tick is ReplayTick => tick !== null)
    .sort((left, right) => left.tick - right.tick);
}

export function replaySlipstreamExactInput(options: {
  state: FameIndexedClReplayPoolState;
  zeroForOne: boolean;
  amountIn: bigint;
}): FameSlipstreamReplayQuote | FameIndexedClReplayFallbackReason {
  const sqrtPriceX96 = parseUnsignedDecimal(options.state.sqrtPriceX96);
  const liquidityStart = parseUnsignedDecimal(options.state.liquidity);
  const feePips = parseUnsignedDecimal(options.state.fee);
  const ticks = replayTicks(options.state);
  if (
    sqrtPriceX96 === null ||
    liquidityStart === null ||
    feePips === null ||
    feePips >= FEE_DENOMINATOR ||
    ticks === null ||
    options.state.tick < MIN_TICK ||
    options.state.tick > MAX_TICK ||
    sqrtPriceX96 < MIN_SQRT_RATIO ||
    sqrtPriceX96 > MAX_SQRT_RATIO
  ) {
    return "malformed-replay-state";
  }
  let sqrt = sqrtPriceX96;
  let tick = options.state.tick;
  let liquidity = liquidityStart;
  let amountRemaining = options.amountIn;
  let amountOut = 0n;

  while (amountRemaining > 0n) {
    if (liquidity <= 0n) return "outside-indexed-tick-range";
    const nextTick = nextInitializedTick(ticks, tick, options.zeroForOne);
    const targetTick =
      nextTick?.tick ?? (options.zeroForOne ? MIN_TICK : MAX_TICK);
    const sqrtTarget = getSqrtRatioAtTick(targetTick);
    const step = computeSwapStep({
      sqrtPriceX96: sqrt,
      sqrtTargetX96: sqrtTarget,
      liquidity,
      amountRemaining,
      feePips,
      zeroForOne: options.zeroForOne,
    });
    if (
      step.amountIn === 0n &&
      step.amountOut === 0n &&
      step.sqrtNextX96 !== sqrtTarget
    ) {
      return "replay-failed";
    }
    amountRemaining -= step.amountIn + step.feeAmount;
    amountOut += step.amountOut;
    sqrt = step.sqrtNextX96;
    if (sqrt !== sqrtTarget) break;
    if (!nextTick) {
      return amountRemaining > 0n
        ? "outside-indexed-tick-range"
        : { amountOut, sqrtPriceX96After: sqrt };
    }
    liquidity = options.zeroForOne
      ? liquidity - nextTick.liquidityNet
      : liquidity + nextTick.liquidityNet;
    tick = options.zeroForOne ? nextTick.tick - 1 : nextTick.tick;
  }

  return amountOut > 0n
    ? { amountOut, sqrtPriceX96After: sqrt }
    : "replay-failed";
}

function replayStateForRequest(
  state: FameIndexedPoolStateEntry | undefined,
  request: FameEdgeQuoteRequest,
  expectedSourceRegistryId: string,
): FameIndexedClReplayPoolState | FameIndexedClReplayFallbackReason {
  if (request.edge.pool.venue !== "aerodrome-slipstream")
    return "unsupported-pool";
  if (!state || state.status !== "fresh") return "fresh-replay-state-missing";
  if (!("stateKind" in state) || state.stateKind !== "cl-replay-v1") {
    return "fresh-replay-state-missing";
  }
  if (state.sourceRegistryId !== expectedSourceRegistryId) {
    return "source-registry-mismatch";
  }
  if (!sameAddress(state.poolAddress, request.edge.pool.pool)) {
    return "fresh-replay-state-missing";
  }
  const direct =
    sameAddress(request.edge.tokenIn, state.token0) &&
    sameAddress(request.edge.tokenOut, state.token1);
  const reverse =
    sameAddress(request.edge.tokenIn, state.token1) &&
    sameAddress(request.edge.tokenOut, state.token0);
  if (!direct && !reverse) return "token-direction-mismatch";
  return state;
}

export function quoteFromIndexedSlipstreamReplay(options: {
  indexedState: FameIndexedPoolStateEntry | undefined;
  request: FameEdgeQuoteRequest;
  context: FameIndexedQuoteContext;
  expectedSourceRegistryId?: string;
}): FameEdgeQuoteResult {
  const state = replayStateForRequest(
    options.indexedState,
    options.request,
    options.expectedSourceRegistryId ?? options.context.sourceRegistryId,
  );
  if (typeof state === "string") {
    return {
      status: "failed",
      reason: "no_quote_evidence",
      message: `Indexed CL replay unavailable: ${state}.`,
    };
  }
  const replay = replaySlipstreamExactInput({
    state,
    zeroForOne: sameAddress(options.request.edge.tokenIn, state.token0),
    amountIn: options.request.amountIn,
  });
  if (typeof replay === "string") {
    return {
      status: "failed",
      reason: "no_quote_evidence",
      message: `Indexed CL replay unavailable: ${replay}.`,
    };
  }
  const source = `indexed Slipstream CL replay for ${state.poolId} snapshot ${state.snapshotId}`;
  return {
    status: "quoted",
    amountIn: options.request.amountIn,
    amountOut: replay.amountOut,
    capacityIn: null,
    fee: options.request.edge.fee,
    evidence: source,
    context: options.context,
    indexedEvidence: {
      source: "indexed",
      kind: "raw-replay",
      quoteKind: "cl-replay-v1",
      evidenceId: state.snapshotId,
      poolId: state.poolId,
    },
    priceImpact: concentratedLiquidityPriceImpact({
      amountIn: options.request.amountIn,
      amountOut: replay.amountOut,
      tokenIn: options.request.edge.tokenIn,
      tokenOut: options.request.edge.tokenOut,
      token0: state.token0,
      token1: state.token1,
      preSwapSqrtPriceX96: BigInt(state.sqrtPriceX96),
      postSwapSqrtPriceX96: replay.sqrtPriceX96After,
    }),
  };
}

export function createIndexedClReplayQuoteAdapter(options: {
  indexedState: FameIndexedPoolStateBatchResponse;
  fallback: FameQuoteAdapter | FameAsyncQuoteAdapter;
  expectedSourceRegistryId?: string;
  mode?: "local" | "shadow";
}): FameAsyncQuoteAdapter {
  const fallback = toAsyncQuoteAdapter(options.fallback);
  const mode = options.mode ?? "shadow";
  if (
    options.expectedSourceRegistryId &&
    options.indexedState.sourceRegistryId !== options.expectedSourceRegistryId
  ) {
    return fallback;
  }
  const context = indexedContext(options.indexedState);
  const expectedSourceRegistryId =
    options.expectedSourceRegistryId ?? options.indexedState.sourceRegistryId;
  const indexedByPoolId = new Map<string, FameIndexedPoolStateEntry>();
  for (const state of options.indexedState.pools) {
    if ("poolId" in state) indexedByPoolId.set(state.poolId, state);
  }

  return {
    async quoteEdge(request) {
      let localQuote: FameEdgeQuoteResult;
      try {
        localQuote = quoteFromIndexedSlipstreamReplay({
          indexedState: indexedByPoolId.get(request.edge.poolId),
          request,
          context,
          expectedSourceRegistryId,
        });
      } catch {
        return fallback.quoteEdge(request);
      }
      if (mode === "local" && localQuote.status === "quoted") return localQuote;
      return fallback.quoteEdge(request);
    },
  };
}
