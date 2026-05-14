import { encodeAbiParameters, keccak256, type Hex } from "viem";
import {
  routeFromJson,
  type FameRoute,
  type JsonFameRoute,
} from "./types";
import { fameRouteToCall } from "./callRoute";

export const fameRouteAbiParameters = [
  {
    type: "tuple",
    components: [
      { name: "version", type: "uint16" },
      { name: "tokenIn", type: "address" },
      { name: "tokenOut", type: "address" },
      { name: "amountIn", type: "uint256" },
      { name: "minAmountOutAfterFee", type: "uint256" },
      { name: "recipient", type: "address" },
      { name: "deadline", type: "uint256" },
      {
        name: "legs",
        type: "tuple[]",
        components: [
          { name: "tokenIn", type: "address" },
          { name: "tokenOut", type: "address" },
          { name: "venue", type: "uint8" },
          { name: "amountMode", type: "uint8" },
          { name: "amount", type: "uint256" },
          { name: "minAmountOut", type: "uint256" },
          { name: "target", type: "address" },
          { name: "data", type: "bytes" },
        ],
      },
    ],
  },
] as const;

export function encodeFameRoute(route: FameRoute): Hex {
  return encodeAbiParameters(fameRouteAbiParameters, [fameRouteToCall(route)]);
}

export function encodeJsonFameRoute(route: JsonFameRoute): Hex {
  return encodeFameRoute(routeFromJson(route));
}

export function hashFameRoute(route: FameRoute): Hex {
  return keccak256(encodeFameRoute(route));
}

export function hashJsonFameRoute(route: JsonFameRoute): Hex {
  return hashFameRoute(routeFromJson(route));
}
