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

function scaleByFixtureAmount(
  value: bigint,
  requestedAmountIn: bigint,
  fixtureAmountIn: bigint,
): bigint {
  if (value === 0n || requestedAmountIn === fixtureAmountIn) return value;

  const scaled = (value * requestedAmountIn) / fixtureAmountIn;
  return scaled > 0n ? scaled : 1n;
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
  const slippageBps = options.slippageBps ?? 0;
  const scaledMinAmountOutAfterFee =
    options.minAmountOutAfterFee ??
    applySlippageToAmount(
      scaleByFixtureAmount(route.minAmountOutAfterFee, amountIn, route.amountIn),
      slippageBps,
    );
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
            ? scaleByFixtureAmount(leg.amount, amountIn, route.amountIn)
            : 0n
          : leg.amount,
      minAmountOut: applySlippageToAmount(
        scaleByFixtureAmount(leg.minAmountOut, amountIn, route.amountIn),
        slippageBps,
      ),
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
