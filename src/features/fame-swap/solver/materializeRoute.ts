import type { Address, Hex } from "viem";
import { encodeFameRoute, hashFameRoute } from "../router/encodeRoute";
import { materializeLegPayload } from "../router/payloads";
import {
  amountModeOrdinals,
  routeFromJson,
  type FameRoute,
  type JsonFameRoute,
} from "../router/types";
import { applySlippageToAmount } from "./slippage";

export interface MaterializedFameRoute {
  route: FameRoute;
  abiEncodedRoute: Hex;
  routeHash: Hex;
}

export interface MaterializeFameRouteOptions {
  amountIn?: bigint;
  minAmountOutAfterFee?: bigint;
  slippageBps?: number;
}

export function materializeFameRoute(
  fixtureRoute: JsonFameRoute,
  routerAddress: Address,
  recipient: Address,
  deadline: bigint,
  options: MaterializeFameRouteOptions = {},
): MaterializedFameRoute {
  const route = routeFromJson(fixtureRoute);
  const amountIn = options.amountIn ?? route.amountIn;
  if (amountIn !== route.amountIn) {
    throw new Error(
      "Arbitrary fixture scaling has been removed for FAME swap routes.",
    );
  }
  const slippageBps = options.slippageBps ?? 0;
  const scaledMinAmountOutAfterFee =
    options.minAmountOutAfterFee ??
    applySlippageToAmount(route.minAmountOutAfterFee, slippageBps);
  const materializedRoute: FameRoute = {
    ...route,
    amountIn,
    minAmountOutAfterFee: scaledMinAmountOutAfterFee,
    recipient,
    deadline,
    legs: route.legs.map((leg) => ({
      ...leg,
      amountMode:
        leg.amountMode === "Exact" && leg.tokenIn !== route.tokenIn
          ? "All"
          : leg.amountMode,
      amountModeOrdinal:
        leg.amountMode === "Exact" && leg.tokenIn !== route.tokenIn
          ? amountModeOrdinals.All
          : leg.amountModeOrdinal,
      amount:
        leg.amountMode === "Exact"
          ? leg.tokenIn === route.tokenIn
            ? leg.amount
            : 0n
          : leg.amount,
      minAmountOut: applySlippageToAmount(leg.minAmountOut, slippageBps),
    })).map((leg) => ({
      ...leg,
      data: materializeLegPayload(leg, routerAddress, deadline),
    })),
  };

  return {
    route: materializedRoute,
    abiEncodedRoute: encodeFameRoute(materializedRoute),
    routeHash: hashFameRoute(materializedRoute),
  };
}
