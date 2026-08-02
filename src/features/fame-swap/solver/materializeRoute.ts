import { isAddressEqual, keccak256, type Address, type Hex } from "viem";
import { encodeFameRoute, hashFameRoute } from "../router/encodeRoute";
import { materializeLegPayload } from "../router/payloads";
import {
  amountModeOrdinals,
  routeFromJson,
  type FameRoute,
  type JsonFameRoute,
} from "../router/types";
import { applySlippageToAmount } from "./slippage";
import { FAME } from "../tokens";

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
    legs: route.legs
      .map((leg) => ({
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
      }))
      .map((leg) => ({
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

/**
 * Re-materialize a quoted FAME-input route for checkout redemption.
 *
 * Split routes retain every quoted mode and amount except the final leg that
 * consumes FAME. That leg becomes the sole FAME-input All leg so the checkout
 * can replace the route header amount with its complete measured FAME balance.
 * Downstream connector and native-unwrap legs remain intact.
 */
export function materializeAllInFameRoute(
  quotedRoute: FameRoute,
  routerAddress: Address,
  recipient: Address,
  deadline: bigint,
): MaterializedFameRoute {
  if (!isAddressEqual(quotedRoute.tokenIn, FAME)) {
    throw new Error("Redemption route must have FAME input.");
  }
  const fameConsumerIndexes = quotedRoute.legs
    .map((leg, index) => (isAddressEqual(leg.tokenIn, FAME) ? index : -1))
    .filter((index) => index >= 0);
  const finalFameConsumerIndex = fameConsumerIndexes.at(-1);
  if (finalFameConsumerIndex === undefined) {
    throw new Error("Redemption route has no FAME input leg.");
  }
  if (
    fameConsumerIndexes
      .slice(0, -1)
      .some((index) => quotedRoute.legs[index]?.amountMode === "All")
  ) {
    throw new Error(
      "Redemption route has an earlier FAME-input All leg and cannot preserve its quoted split.",
    );
  }

  const legs = quotedRoute.legs
    .map((leg, index) =>
      index === finalFameConsumerIndex
        ? {
            ...leg,
            amountMode: "All" as const,
            amountModeOrdinal: amountModeOrdinals.All,
            amount: 0n,
          }
        : { ...leg },
    )
    .map((leg) => ({
      ...leg,
      data: materializeLegPayload(leg, routerAddress, deadline),
    }));
  const route: FameRoute = {
    ...quotedRoute,
    recipient,
    deadline,
    legs,
  };

  const abiEncodedRoute = encodeFameRoute(route);
  return {
    route,
    abiEncodedRoute,
    routeHash: keccak256(abiEncodedRoute),
  };
}
