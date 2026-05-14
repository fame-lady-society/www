import type { Address, Hex } from "viem";
import {
  amountModeOrdinals,
  venueFamilyOrdinals,
  type AmountModeOrdinal,
  type FameRoute,
  type VenueFamilyOrdinal,
} from "./types";

export interface FameRouteLegCall {
  tokenIn: Address;
  tokenOut: Address;
  venue: VenueFamilyOrdinal;
  amountMode: AmountModeOrdinal;
  amount: bigint;
  minAmountOut: bigint;
  target: Address;
  data: Hex;
}

export interface FameRouteCall {
  version: FameRoute["version"];
  tokenIn: Address;
  tokenOut: Address;
  amountIn: bigint;
  minAmountOutAfterFee: bigint;
  recipient: Address;
  deadline: bigint;
  legs: FameRouteLegCall[];
}

export function fameRouteToCall(route: FameRoute): FameRouteCall {
  return {
    version: route.version,
    tokenIn: route.tokenIn,
    tokenOut: route.tokenOut,
    amountIn: route.amountIn,
    minAmountOutAfterFee: route.minAmountOutAfterFee,
    recipient: route.recipient,
    deadline: route.deadline,
    legs: route.legs.map((leg) => ({
      tokenIn: leg.tokenIn,
      tokenOut: leg.tokenOut,
      venue: venueFamilyOrdinals[leg.venue],
      amountMode: amountModeOrdinals[leg.amountMode],
      amount: leg.amount,
      minAmountOut: leg.minAmountOut,
      target: leg.target,
      data: leg.data,
    })),
  };
}
