import {
  encodeAbiParameters,
  encodePacked,
  type Address,
  type Hex,
} from "viem";
import type { FamePoolEdge } from "../solver/poolUniverse";
import {
  amountModeOrdinals,
  type AmountModeName,
  type FameRouteLeg,
} from "./types";

const solidlyPayloadAbi = [
  {
    type: "tuple",
    components: [
      {
        name: "routes",
        type: "tuple[]",
        components: [
          { name: "from", type: "address" },
          { name: "to", type: "address" },
          { name: "stable", type: "bool" },
        ],
      },
      { name: "deadline", type: "uint256" },
    ],
  },
] as const;

const uniswapV2PayloadAbi = [
  {
    type: "tuple",
    components: [
      { name: "path", type: "address[]" },
      { name: "deadline", type: "uint256" },
    ],
  },
] as const;

const slipstreamPayloadAbi = [
  {
    type: "tuple",
    components: [
      { name: "router", type: "address" },
      { name: "factory", type: "address" },
      { name: "tokenIn", type: "address" },
      { name: "tokenOut", type: "address" },
      { name: "tickSpacing", type: "int24" },
      { name: "sqrtPriceLimitX96", type: "uint160" },
      { name: "deadline", type: "uint256" },
    ],
  },
] as const;

const universalRouterV3PayloadAbi = [
  {
    type: "tuple",
    components: [
      { name: "path", type: "bytes" },
      { name: "deadline", type: "uint256" },
      { name: "payerIsUser", type: "bool" },
      { name: "recipient", type: "address" },
    ],
  },
] as const;

const universalRouterV4PayloadAbi = [
  {
    type: "tuple",
    components: [
      { name: "tokenIn", type: "address" },
      { name: "tokenOut", type: "address" },
      { name: "amountIn", type: "uint256" },
      { name: "minAmountOut", type: "uint256" },
      { name: "currency0", type: "address" },
      { name: "currency1", type: "address" },
      { name: "zeroForOne", type: "bool" },
      { name: "fee", type: "uint24" },
      { name: "tickSpacing", type: "int24" },
      { name: "hooks", type: "address" },
      { name: "hookData", type: "bytes" },
      { name: "deadline", type: "uint256" },
      { name: "recipient", type: "address" },
      { name: "payerIsUser", type: "bool" },
    ],
  },
] as const;

export interface BuildFameRouteLegInput {
  edge: FamePoolEdge;
  amountMode: AmountModeName;
  amount: bigint;
  minAmountOut: bigint;
  routerAddress: Address;
  deadline: bigint;
}

function encodeSolidlyPayload(edge: FamePoolEdge, deadline: bigint): Hex {
  if (edge.pool.venue !== "solidly") throw new Error("Expected Solidly pool.");

  return encodeAbiParameters(solidlyPayloadAbi, [
    {
      routes: [
        {
          from: edge.tokenIn,
          to: edge.tokenOut,
          stable: edge.pool.stable,
        },
      ],
      deadline,
    },
  ]);
}

function encodeUniswapV2Payload(edge: FamePoolEdge, deadline: bigint): Hex {
  return encodeAbiParameters(uniswapV2PayloadAbi, [
    {
      path: [edge.tokenIn, edge.tokenOut],
      deadline,
    },
  ]);
}

function encodeSlipstreamPayload(edge: FamePoolEdge, deadline: bigint): Hex {
  if (
    edge.pool.venue !== "aerodrome-slipstream" &&
    edge.pool.venue !== "aerodrome-slipstream2"
  ) {
    throw new Error("Expected Slipstream pool.");
  }

  return encodeAbiParameters(slipstreamPayloadAbi, [
    {
      router: edge.pool.router,
      factory: edge.pool.factory,
      tokenIn: edge.tokenIn,
      tokenOut: edge.tokenOut,
      tickSpacing: edge.pool.tickSpacing,
      sqrtPriceLimitX96: 0n,
      deadline,
    },
  ]);
}

function encodeV3Path(tokenIn: Address, fee: number, tokenOut: Address): Hex {
  return encodePacked(["address", "uint24", "address"], [tokenIn, fee, tokenOut]);
}

function encodeUniversalRouterV3Payload(
  edge: FamePoolEdge,
  routerAddress: Address,
  deadline: bigint,
): Hex {
  if (edge.pool.venue !== "uniswap-v3") throw new Error("Expected V3 pool.");

  return encodeAbiParameters(universalRouterV3PayloadAbi, [
    {
      path: encodeV3Path(edge.tokenIn, edge.pool.fee, edge.tokenOut),
      deadline,
      payerIsUser: true,
      recipient: routerAddress,
    },
  ]);
}

function encodeUniversalRouterV4Payload(
  input: BuildFameRouteLegInput,
): Hex {
  const { edge } = input;
  if (edge.pool.venue !== "uniswap-v4") throw new Error("Expected V4 pool.");

  const amountIn = input.amountMode === "All" ? 0n : input.amount;
  const zeroForOne =
    edge.pool.currency0.toLowerCase() === edge.tokenIn.toLowerCase();

  return encodeAbiParameters(universalRouterV4PayloadAbi, [
    {
      tokenIn: edge.tokenIn,
      tokenOut: edge.tokenOut,
      amountIn,
      minAmountOut: input.minAmountOut,
      currency0: edge.pool.currency0,
      currency1: edge.pool.currency1,
      zeroForOne,
      fee: edge.pool.fee,
      tickSpacing: edge.pool.tickSpacing,
      hooks: edge.pool.hooks,
      hookData: edge.pool.hookData ?? "0x",
      deadline: input.deadline,
      recipient: input.routerAddress,
      payerIsUser: false,
    },
  ]);
}

function payloadForLeg(input: BuildFameRouteLegInput): Hex {
  switch (input.edge.venue) {
    case "Solidly":
      return encodeSolidlyPayload(input.edge, input.deadline);
    case "UniswapV2":
      return encodeUniswapV2Payload(input.edge, input.deadline);
    case "Slipstream":
    case "Slipstream2":
      return encodeSlipstreamPayload(input.edge, input.deadline);
    case "UniswapV3":
      return encodeUniversalRouterV3Payload(
        input.edge,
        input.routerAddress,
        input.deadline,
      );
    case "UniswapV4":
      return encodeUniversalRouterV4Payload(input);
    case "NativeWrap":
      return "0x";
  }
}

export function buildFameRouteLeg(
  input: BuildFameRouteLegInput,
): FameRouteLeg {
  return {
    tokenIn: input.edge.tokenIn,
    tokenOut: input.edge.tokenOut,
    venue: input.edge.venue,
    venueOrdinal: input.edge.venueOrdinal,
    amountMode: input.amountMode,
    amountModeOrdinal: amountModeOrdinals[input.amountMode],
    amount: input.amountMode === "All" ? 0n : input.amount,
    minAmountOut: input.edge.venue === "NativeWrap" ? 0n : input.minAmountOut,
    target: input.edge.target,
    data: payloadForLeg(input),
  };
}
