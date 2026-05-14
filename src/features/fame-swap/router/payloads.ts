import { decodeAbiParameters, encodeAbiParameters, type Address, type Hex } from "viem";
import type { FameRouteLeg } from "./types";

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

export const universalRouterV3PayloadAbi = [
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

export const universalRouterV4PayloadAbi = [
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

function patchSolidlyPayload(data: Hex, deadline: bigint): Hex {
  const [payload] = decodeAbiParameters(solidlyPayloadAbi, data);
  return encodeAbiParameters(solidlyPayloadAbi, [
    {
      ...payload,
      deadline,
    },
  ]);
}

function patchUniswapV2Payload(data: Hex, deadline: bigint): Hex {
  const [payload] = decodeAbiParameters(uniswapV2PayloadAbi, data);
  return encodeAbiParameters(uniswapV2PayloadAbi, [
    {
      ...payload,
      deadline,
    },
  ]);
}

function patchSlipstreamPayload(data: Hex, deadline: bigint): Hex {
  const [payload] = decodeAbiParameters(slipstreamPayloadAbi, data);
  return encodeAbiParameters(slipstreamPayloadAbi, [
    {
      ...payload,
      deadline,
    },
  ]);
}

function patchUniversalRouterV3Payload(
  data: Hex,
  routerAddress: Address,
  deadline: bigint,
): Hex {
  const [payload] = decodeAbiParameters(universalRouterV3PayloadAbi, data);
  return encodeAbiParameters(universalRouterV3PayloadAbi, [
    {
      ...payload,
      recipient: routerAddress,
      deadline,
    },
  ]);
}

function patchUniversalRouterV4Payload(
  data: Hex,
  routerAddress: Address,
  deadline: bigint,
  amountIn: bigint,
  minAmountOut: bigint,
): Hex {
  const [payload] = decodeAbiParameters(universalRouterV4PayloadAbi, data);
  return encodeAbiParameters(universalRouterV4PayloadAbi, [
    {
      ...payload,
      amountIn: payload.amountIn === 0n ? 0n : amountIn,
      minAmountOut,
      recipient: routerAddress,
      deadline,
    },
  ]);
}

export function materializeLegPayload(
  leg: FameRouteLeg,
  routerAddress: Address,
  deadline: bigint,
): Hex {
  switch (leg.venue) {
    case "Solidly":
      return patchSolidlyPayload(leg.data, deadline);
    case "UniswapV2":
      return patchUniswapV2Payload(leg.data, deadline);
    case "Slipstream":
    case "Slipstream2":
      return patchSlipstreamPayload(leg.data, deadline);
    case "UniswapV3":
      return patchUniversalRouterV3Payload(leg.data, routerAddress, deadline);
    case "UniswapV4":
      return patchUniversalRouterV4Payload(
        leg.data,
        routerAddress,
        deadline,
        leg.amount,
        leg.minAmountOut,
      );
  }
}
