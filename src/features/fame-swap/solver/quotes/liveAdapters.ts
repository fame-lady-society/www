import type { Address } from "viem";
import type {
  FameAsyncQuoteAdapter,
  FameEdgeQuoteRequest,
  FameEdgeQuoteResult,
  FamePriceImpactEstimate,
  FameQuoteAdapter,
} from "./adapters";
import type { FameQuoteContext } from "./quoteContext";
import {
  concentratedLiquidityPriceImpact,
  constantProductPriceImpact,
} from "./routeMath";

type FameBlockQuoteContext = Extract<
  FameQuoteContext,
  { source: "live" | "fork" }
>;

interface ReadContractRequest {
  address: Address;
  abi: readonly unknown[];
  functionName: string;
  args?: readonly unknown[];
  blockNumber?: bigint;
}

export interface FameLiveQuoteClient {
  getBlockNumber?: () => Promise<bigint>;
  readContract: (request: ReadContractRequest) => Promise<unknown>;
}

export interface FameLiveQuoteAdapterOptions {
  client: FameLiveQuoteClient;
  chainId: number;
  blockNumber?: bigint;
  contextSource?: FameBlockQuoteContext["source"];
  forkUrlLabel?: string;
  readTimeoutMs?: number;
  slipstreamQuoterAddress?: Address;
  uniswapV3QuoterAddress?: Address;
  uniswapV4QuoterAddress?: Address;
}

const DEFAULT_READ_TIMEOUT_MS = 2_500;
const MAX_UINT128 = (1n << 128n) - 1n;

export const BASE_SLIPSTREAM_QUOTER_V2 =
  "0x254cF9E1E6e233aa1AC962CB9B05b2cfeAaE15b0" as const satisfies Address;
export const BASE_UNISWAP_V3_QUOTER_V2 =
  "0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a" as const satisfies Address;
export const BASE_UNISWAP_V4_QUOTER =
  "0x0d5e0f971ed27fbff6c2837bf31316121532048d" as const satisfies Address;

const getReservesAbi = [
  {
    type: "function",
    name: "getReserves",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { name: "reserve0", type: "uint112" },
      { name: "reserve1", type: "uint112" },
      { name: "blockTimestampLast", type: "uint32" },
    ],
  },
] as const;

const solidlyGetAmountOutAbi = [
  {
    type: "function",
    name: "getAmountOut",
    stateMutability: "view",
    inputs: [
      { name: "amountIn", type: "uint256" },
      { name: "tokenIn", type: "address" },
    ],
    outputs: [{ name: "amountOut", type: "uint256" }],
  },
] as const;

const uniswapV3Slot0Abi = [
  {
    type: "function",
    name: "slot0",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { name: "sqrtPriceX96", type: "uint160" },
      { name: "tick", type: "int24" },
      { name: "observationIndex", type: "uint16" },
      { name: "observationCardinality", type: "uint16" },
      { name: "observationCardinalityNext", type: "uint16" },
      { name: "feeProtocol", type: "uint8" },
      { name: "unlocked", type: "bool" },
    ],
  },
] as const;

const slipstreamSlot0Abi = [
  {
    type: "function",
    name: "slot0",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { name: "sqrtPriceX96", type: "uint160" },
      { name: "tick", type: "int24" },
      { name: "observationIndex", type: "uint16" },
      { name: "observationCardinality", type: "uint16" },
      { name: "observationCardinalityNext", type: "uint16" },
      { name: "unlocked", type: "bool" },
    ],
  },
] as const;

const uniswapV4StateViewSlot0Abi = [
  {
    type: "function",
    name: "getSlot0",
    stateMutability: "view",
    inputs: [{ name: "poolId", type: "bytes32" }],
    outputs: [
      { name: "sqrtPriceX96", type: "uint160" },
      { name: "tick", type: "int24" },
      { name: "protocolFee", type: "uint24" },
      { name: "lpFee", type: "uint24" },
    ],
  },
] as const;

const concentratedQuoteTupleOutputs = [
  { name: "amountOut", type: "uint256" },
  { name: "sqrtPriceX96After", type: "uint160" },
  { name: "initializedTicksCrossed", type: "uint32" },
  { name: "gasEstimate", type: "uint256" },
] as const;

const slipstreamQuoterAbi = [
  {
    type: "function",
    name: "quoteExactInputSingle",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "params",
        type: "tuple",
        components: [
          { name: "tokenIn", type: "address" },
          { name: "tokenOut", type: "address" },
          { name: "amountIn", type: "uint256" },
          { name: "tickSpacing", type: "int24" },
          { name: "sqrtPriceLimitX96", type: "uint160" },
        ],
      },
    ],
    outputs: concentratedQuoteTupleOutputs,
  },
] as const;

const uniswapV3QuoterV2Abi = [
  {
    type: "function",
    name: "quoteExactInputSingle",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "params",
        type: "tuple",
        components: [
          { name: "tokenIn", type: "address" },
          { name: "tokenOut", type: "address" },
          { name: "amountIn", type: "uint256" },
          { name: "fee", type: "uint24" },
          { name: "sqrtPriceLimitX96", type: "uint160" },
        ],
      },
    ],
    outputs: concentratedQuoteTupleOutputs,
  },
] as const;

const uniswapV4QuoterAbi = [
  {
    type: "function",
    name: "quoteExactInputSingle",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "params",
        type: "tuple",
        components: [
          {
            name: "poolKey",
            type: "tuple",
            components: [
              { name: "currency0", type: "address" },
              { name: "currency1", type: "address" },
              { name: "fee", type: "uint24" },
              { name: "tickSpacing", type: "int24" },
              { name: "hooks", type: "address" },
            ],
          },
          { name: "zeroForOne", type: "bool" },
          { name: "exactAmount", type: "uint128" },
          { name: "hookData", type: "bytes" },
        ],
      },
    ],
    outputs: [
      { name: "amountOut", type: "uint256" },
      { name: "gasEstimate", type: "uint256" },
    ],
  },
] as const;

function unavailable(message: string): FameEdgeQuoteResult {
  return {
    status: "failed",
    reason: "adapter_failure",
    message,
  };
}

function displaySafeErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  const firstLine = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.length > 0);
  return (firstLine ?? "Unknown live quote error.")
    .replace(/https?:\/\/\S+/g, "[redacted-url]")
    .replace(/0x[a-fA-F0-9]{96,}/g, "[redacted-hex]");
}

function liveQuoteFailure(poolId: string, error: unknown): FameEdgeQuoteResult {
  return unavailable(`${poolId} live quote failed: ${displaySafeErrorMessage(error)}`);
}

export function unavailableLiveQuoteAdapter(message: string): FameQuoteAdapter {
  return {
    quoteEdge() {
      return unavailable(message);
    },
  };
}

export function unavailableLiveAsyncQuoteAdapter(
  message: string,
): FameAsyncQuoteAdapter {
  return {
    async quoteEdge() {
      return unavailable(message);
    },
  };
}

function noEvidence(request: FameEdgeQuoteRequest): FameEdgeQuoteResult {
  return {
    status: "failed",
    reason: "no_quote_evidence",
    message: `No live liquidity quote adapter for ${request.edge.poolId}.`,
  };
}

function asReserveTuple(value: unknown): readonly [bigint, bigint] | null {
  if (!Array.isArray(value) || value.length < 2) return null;
  const [reserve0, reserve1] = value;
  if (typeof reserve0 !== "bigint" || typeof reserve1 !== "bigint") {
    return null;
  }
  return [reserve0, reserve1];
}

interface ConcentratedQuoteOutput {
  amountOut: bigint;
  sqrtPriceX96After: bigint | null;
}

function concentratedQuoteOutput(value: unknown): ConcentratedQuoteOutput | null {
  if (typeof value === "bigint") {
    return {
      amountOut: value,
      sqrtPriceX96After: null,
    };
  }

  if (
    value &&
    typeof value === "object" &&
    "amountOut" in value &&
    typeof (value as { amountOut?: unknown }).amountOut === "bigint"
  ) {
    const raw = value as {
      amountOut: bigint;
      sqrtPriceX96After?: unknown;
    };
    return {
      amountOut: raw.amountOut,
      sqrtPriceX96After:
        typeof raw.sqrtPriceX96After === "bigint"
          ? raw.sqrtPriceX96After
          : null,
    };
  }

  if (!Array.isArray(value) || value.length < 1) return null;
  const [amountOut, sqrtPriceX96After] = value;
  return typeof amountOut === "bigint"
    ? {
        amountOut,
        sqrtPriceX96After:
          typeof sqrtPriceX96After === "bigint" ? sqrtPriceX96After : null,
      }
    : null;
}

function amountOutFromQuoteTuple(value: unknown): bigint | null {
  return concentratedQuoteOutput(value)?.amountOut ?? null;
}

function sqrtPriceX96FromSlot0(value: unknown): bigint | null {
  if (
    value &&
    typeof value === "object" &&
    "sqrtPriceX96" in value &&
    typeof (value as { sqrtPriceX96?: unknown }).sqrtPriceX96 === "bigint"
  ) {
    return (value as { sqrtPriceX96: bigint }).sqrtPriceX96;
  }

  if (!Array.isArray(value) || value.length < 1) return null;
  const [sqrtPriceX96] = value;
  return typeof sqrtPriceX96 === "bigint" ? sqrtPriceX96 : null;
}

async function readSlot0SqrtPriceX96(
  client: FameLiveQuoteClient,
  request: ReadContractRequest,
  timeoutMs: number,
): Promise<bigint | null> {
  const raw = await readLiveContract(client, request, timeoutMs);
  return sqrtPriceX96FromSlot0(raw);
}

function sameAddress(left: Address, right: Address): boolean {
  return left.toLowerCase() === right.toLowerCase();
}

function reservesForDirection(
  request: FameEdgeQuoteRequest,
  reserves: readonly [bigint, bigint],
): readonly [bigint, bigint] | null {
  const pool = request.edge.pool;
  if (!("token0" in pool)) return null;

  if (sameAddress(request.edge.tokenIn, pool.token0)) {
    return [reserves[0], reserves[1]];
  }
  if (sameAddress(request.edge.tokenIn, pool.token1)) {
    return [reserves[1], reserves[0]];
  }
  return null;
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

function feeBpsFor(request: FameEdgeQuoteRequest): number | null {
  const fee = request.edge.fee;
  return fee.status === "available" ? fee.feeBps : null;
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  message: string,
): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_resolve, reject) => {
        timeout = setTimeout(() => reject(new Error(message)), timeoutMs);
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

function readLiveContract(
  client: FameLiveQuoteClient,
  request: ReadContractRequest,
  timeoutMs: number,
): Promise<unknown> {
  return withTimeout(
    client.readContract(request),
    timeoutMs,
    `${request.functionName} timed out after ${timeoutMs}ms`,
  );
}

async function quoteFromPoolGetAmountOut(
  request: FameEdgeQuoteRequest,
  client: FameLiveQuoteClient,
  context: FameBlockQuoteContext,
  timeoutMs: number,
): Promise<FameEdgeQuoteResult> {
  const pool = request.edge.pool;
  if (!("pool" in pool)) return noEvidence(request);

  const amountOut = await readLiveContract(
    client,
    {
      address: pool.pool,
      abi: solidlyGetAmountOutAbi,
      functionName: "getAmountOut",
      args: [request.amountIn, request.edge.tokenIn],
      blockNumber: context.blockNumber,
    },
    timeoutMs,
  );

  if (typeof amountOut !== "bigint" || amountOut <= 0n) {
    return {
      status: "failed",
      reason: "zero_output",
      message: `${request.edge.poolId} live pool quote returned zero output.`,
    };
  }

  let priceImpact: FamePriceImpactEstimate | undefined;
  if (pool.venue === "solidly" && pool.stable === false) {
    const rawReserves = await readLiveContract(
      client,
      {
        address: pool.pool,
        abi: getReservesAbi,
        functionName: "getReserves",
        blockNumber: context.blockNumber,
      },
      timeoutMs,
    );
    const reserves = asReserveTuple(rawReserves);
    const directed = reserves ? reservesForDirection(request, reserves) : null;
    if (directed) {
      priceImpact = constantProductPriceImpact({
        amountIn: request.amountIn,
        amountOut,
        reserveIn: directed[0],
        reserveOut: directed[1],
      });
    }
  }

  return {
    status: "quoted",
    amountIn: request.amountIn,
    amountOut,
    capacityIn: null,
    fee: request.edge.fee,
    evidence: `live pool getAmountOut at ${context.source} block ${context.blockNumber.toString()}`,
    context,
    priceImpact,
  };
}

async function quoteFromReserves(
  request: FameEdgeQuoteRequest,
  client: FameLiveQuoteClient,
  context: FameBlockQuoteContext,
  timeoutMs: number,
): Promise<FameEdgeQuoteResult> {
  if (!("pool" in request.edge.pool)) return noEvidence(request);

  const feeBps = feeBpsFor(request);
  if (feeBps === null) {
    return {
      status: "failed",
      reason: "no_quote_evidence",
      message: `${request.edge.poolId} has no fee metadata for reserve math.`,
    };
  }

  const rawReserves = await readLiveContract(
    client,
    {
      address: request.edge.pool.pool,
      abi: getReservesAbi,
      functionName: "getReserves",
      blockNumber: context.blockNumber,
    },
    timeoutMs,
  );
  const reserves = asReserveTuple(rawReserves);
  const directed = reserves ? reservesForDirection(request, reserves) : null;
  if (!directed) {
    return {
      status: "failed",
      reason: "adapter_failure",
      message: `${request.edge.poolId} returned malformed reserve data.`,
    };
  }

  const amountOut = constantProductAmountOut(
    request.amountIn,
    directed[0],
    directed[1],
    feeBps,
  );
  if (amountOut <= 0n) {
    return {
      status: "failed",
      reason: "zero_output",
      message: `${request.edge.poolId} reserve quote returned zero output.`,
    };
  }

  return {
    status: "quoted",
    amountIn: request.amountIn,
    amountOut,
    capacityIn: null,
    fee: request.edge.fee,
    evidence: `live reserves at ${context.source} block ${context.blockNumber.toString()}`,
    context,
    priceImpact: constantProductPriceImpact({
      amountIn: request.amountIn,
      amountOut,
      reserveIn: directed[0],
      reserveOut: directed[1],
    }),
  };
}

async function quoteFromSlipstreamQuoter(
  request: FameEdgeQuoteRequest,
  client: FameLiveQuoteClient,
  context: FameBlockQuoteContext,
  timeoutMs: number,
  quoterAddress: Address,
): Promise<FameEdgeQuoteResult> {
  const pool = request.edge.pool;
  if (pool.venue !== "aerodrome-slipstream") {
    return {
      status: "failed",
      reason: "no_quote_evidence",
      message: `${request.edge.poolId} has no validated live Slipstream2 quoter.`,
    };
  }

  const preSwapSqrtPriceX96 = await readSlot0SqrtPriceX96(
    client,
    {
      address: pool.pool,
      abi: slipstreamSlot0Abi,
      functionName: "slot0",
      blockNumber: context.blockNumber,
    },
    timeoutMs,
  );

  const rawQuote = await readLiveContract(
    client,
    {
      address: quoterAddress,
      abi: slipstreamQuoterAbi,
      functionName: "quoteExactInputSingle",
      args: [
        {
          tokenIn: request.edge.tokenIn,
          tokenOut: request.edge.tokenOut,
          amountIn: request.amountIn,
          tickSpacing: pool.tickSpacing,
          sqrtPriceLimitX96: 0n,
        },
      ],
      blockNumber: context.blockNumber,
    },
    timeoutMs,
  );

  const quote = concentratedQuoteOutput(rawQuote);
  if (!quote || quote.amountOut <= 0n) {
    return {
      status: "failed",
      reason: "zero_output",
      message: `${request.edge.poolId} Slipstream quoter returned zero output.`,
    };
  }

  return {
    status: "quoted",
    amountIn: request.amountIn,
    amountOut: quote.amountOut,
    capacityIn: null,
    fee: request.edge.fee,
    evidence: `live Slipstream quoter at ${context.source} block ${context.blockNumber.toString()}`,
    context,
    priceImpact: preSwapSqrtPriceX96
      ? concentratedLiquidityPriceImpact({
          amountIn: request.amountIn,
          amountOut: quote.amountOut,
          tokenIn: request.edge.tokenIn,
          tokenOut: request.edge.tokenOut,
          token0: pool.token0,
          token1: pool.token1,
          preSwapSqrtPriceX96,
          postSwapSqrtPriceX96: quote.sqrtPriceX96After,
        })
      : undefined,
  };
}

async function quoteFromUniswapV3Quoter(
  request: FameEdgeQuoteRequest,
  client: FameLiveQuoteClient,
  context: FameBlockQuoteContext,
  timeoutMs: number,
  quoterAddress: Address,
): Promise<FameEdgeQuoteResult> {
  const pool = request.edge.pool;
  if (pool.venue !== "uniswap-v3") return noEvidence(request);

  const preSwapSqrtPriceX96 = await readSlot0SqrtPriceX96(
    client,
    {
      address: pool.pool,
      abi: uniswapV3Slot0Abi,
      functionName: "slot0",
      blockNumber: context.blockNumber,
    },
    timeoutMs,
  );

  const rawQuote = await readLiveContract(
    client,
    {
      address: quoterAddress,
      abi: uniswapV3QuoterV2Abi,
      functionName: "quoteExactInputSingle",
      args: [
        {
          tokenIn: request.edge.tokenIn,
          tokenOut: request.edge.tokenOut,
          amountIn: request.amountIn,
          fee: pool.fee,
          sqrtPriceLimitX96: 0n,
        },
      ],
      blockNumber: context.blockNumber,
    },
    timeoutMs,
  );

  const quote = concentratedQuoteOutput(rawQuote);
  if (!quote || quote.amountOut <= 0n) {
    return {
      status: "failed",
      reason: "zero_output",
      message: `${request.edge.poolId} Uniswap V3 quoter returned zero output.`,
    };
  }

  return {
    status: "quoted",
    amountIn: request.amountIn,
    amountOut: quote.amountOut,
    capacityIn: null,
    fee: request.edge.fee,
    evidence: `live Uniswap V3 quoter at ${context.source} block ${context.blockNumber.toString()}`,
    context,
    priceImpact: preSwapSqrtPriceX96
      ? concentratedLiquidityPriceImpact({
          amountIn: request.amountIn,
          amountOut: quote.amountOut,
          tokenIn: request.edge.tokenIn,
          tokenOut: request.edge.tokenOut,
          token0: pool.token0,
          token1: pool.token1,
          preSwapSqrtPriceX96,
          postSwapSqrtPriceX96: quote.sqrtPriceX96After,
        })
      : undefined,
  };
}

async function quoteFromUniswapV4Quoter(
  request: FameEdgeQuoteRequest,
  client: FameLiveQuoteClient,
  context: FameBlockQuoteContext,
  timeoutMs: number,
  quoterAddress: Address,
): Promise<FameEdgeQuoteResult> {
  const pool = request.edge.pool;
  if (pool.venue !== "uniswap-v4") return noEvidence(request);

  if (request.amountIn > MAX_UINT128) {
    return {
      status: "failed",
      reason: "adapter_failure",
      message: `${request.edge.poolId} input exceeds Uniswap V4 quoter uint128 exactAmount.`,
    };
  }

  const preSwapSqrtPriceX96 = await readSlot0SqrtPriceX96(
    client,
    {
      address: pool.stateView,
      abi: uniswapV4StateViewSlot0Abi,
      functionName: "getSlot0",
      args: [pool.poolId],
      blockNumber: context.blockNumber,
    },
    timeoutMs,
  );

  const rawQuote = await readLiveContract(
    client,
    {
      address: quoterAddress,
      abi: uniswapV4QuoterAbi,
      functionName: "quoteExactInputSingle",
      args: [
        {
          poolKey: {
            currency0: pool.currency0,
            currency1: pool.currency1,
            fee: pool.fee,
            tickSpacing: pool.tickSpacing,
            hooks: pool.hooks,
          },
          zeroForOne: sameAddress(request.edge.tokenIn, pool.currency0),
          exactAmount: request.amountIn,
          hookData: pool.hookData ?? "0x",
        },
      ],
      blockNumber: context.blockNumber,
    },
    timeoutMs,
  );

  const amountOut = amountOutFromQuoteTuple(rawQuote);
  if (amountOut === null || amountOut <= 0n) {
    return {
      status: "failed",
      reason: "zero_output",
      message: `${request.edge.poolId} Uniswap V4 quoter returned zero output.`,
    };
  }

  return {
    status: "quoted",
    amountIn: request.amountIn,
    amountOut,
    capacityIn: null,
    fee: request.edge.fee,
    evidence: `live Uniswap V4 quoter at ${context.source} block ${context.blockNumber.toString()}`,
    context,
    priceImpact: preSwapSqrtPriceX96
      ? concentratedLiquidityPriceImpact({
          amountIn: request.amountIn,
          amountOut,
          tokenIn: request.edge.tokenIn,
          tokenOut: request.edge.tokenOut,
          token0: pool.currency0,
          token1: pool.currency1,
          preSwapSqrtPriceX96,
          postSwapSqrtPriceX96: null,
        })
      : undefined,
  };
}

async function quoteLiveEdge(
  request: FameEdgeQuoteRequest,
  client: FameLiveQuoteClient,
  context: FameBlockQuoteContext,
  timeoutMs: number,
  quoterAddresses: {
    slipstream: Address;
    uniswapV3: Address;
    uniswapV4: Address;
  },
): Promise<FameEdgeQuoteResult> {
  try {
    if (request.edge.pool.venue === "solidly") {
      return await quoteFromPoolGetAmountOut(
        request,
        client,
        context,
        timeoutMs,
      );
    }

    if (request.edge.pool.venue === "uniswap-v2") {
      return await quoteFromReserves(request, client, context, timeoutMs);
    }

    if (
      request.edge.pool.venue === "aerodrome-slipstream" ||
      request.edge.pool.venue === "aerodrome-slipstream2"
    ) {
      return await quoteFromSlipstreamQuoter(
        request,
        client,
        context,
        timeoutMs,
        quoterAddresses.slipstream,
      );
    }

    if (request.edge.pool.venue === "uniswap-v3") {
      return await quoteFromUniswapV3Quoter(
        request,
        client,
        context,
        timeoutMs,
        quoterAddresses.uniswapV3,
      );
    }

    if (request.edge.pool.venue === "uniswap-v4") {
      return await quoteFromUniswapV4Quoter(
        request,
        client,
        context,
        timeoutMs,
        quoterAddresses.uniswapV4,
      );
    }

    return noEvidence(request);
  } catch (error) {
    return liveQuoteFailure(request.edge.poolId, error);
  }
}

export async function createLiveLiquidityQuoteAdapter(
  options: FameLiveQuoteAdapterOptions,
): Promise<FameAsyncQuoteAdapter> {
  const readTimeoutMs = options.readTimeoutMs ?? DEFAULT_READ_TIMEOUT_MS;
  const quoterAddresses = {
    slipstream: options.slipstreamQuoterAddress ?? BASE_SLIPSTREAM_QUOTER_V2,
    uniswapV3: options.uniswapV3QuoterAddress ?? BASE_UNISWAP_V3_QUOTER_V2,
    uniswapV4: options.uniswapV4QuoterAddress ?? BASE_UNISWAP_V4_QUOTER,
  };
  let blockNumber: bigint | undefined;
  try {
    blockNumber =
      options.blockNumber ??
      (options.client.getBlockNumber
        ? await withTimeout(
            options.client.getBlockNumber(),
            readTimeoutMs,
            `getBlockNumber timed out after ${readTimeoutMs}ms`,
          )
        : undefined);
  } catch (error) {
    return unavailableLiveAsyncQuoteAdapter(
      `Live quote block context failed: ${displaySafeErrorMessage(error)}`,
    );
  }

  if (blockNumber === undefined) {
    return {
      quoteContext: undefined,
      async quoteEdge(request) {
        return unavailable(
          `${request.edge.poolId} live quote requires a block number.`,
        );
      },
    };
  }

  const source = options.contextSource ?? "live";
  const quoteContext: FameQuoteContext =
    source === "fork"
      ? {
          source,
          chainId: options.chainId,
          blockNumber,
          forkUrlLabel: options.forkUrlLabel,
        }
      : {
          source,
          chainId: options.chainId,
          blockNumber,
        };

  return {
    quoteContext,
    quoteEdge(request) {
      return quoteLiveEdge(
        request,
        options.client,
        quoteContext,
        readTimeoutMs,
        quoterAddresses,
      );
    },
  };
}
