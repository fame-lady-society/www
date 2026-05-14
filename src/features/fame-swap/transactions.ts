import type { Address, Hex } from "viem";
import { base } from "viem/chains";
import { erc20ApprovalAbi } from "./router/erc20Abi";
import { fameRouterAbi } from "./router/abi";
import { fameRouteToCall, type FameRouteCall } from "./router/callRoute";
import type { FameRoute } from "./router/types";
import type { FameSwapExecutableQuote, FameSwapQuote } from "./solver/types";
import type { FameSwapToken } from "./tokens";

export interface FameSwapApprovalContractRequest {
  address: Address;
  abi: typeof erc20ApprovalAbi;
  functionName: "approve";
  args: readonly [spender: Address, amount: bigint];
  chainId: typeof base.id;
}

export interface FameSwapRouterContractRequest {
  address: Address;
  abi: typeof fameRouterAbi;
  functionName: "executeRoute";
  args: readonly [route: FameRouteCall];
  value: bigint;
  chainId: typeof base.id;
}

export interface FameSwapApprovalTransaction {
  kind: "approval";
  token: FameSwapToken;
  amount: bigint;
  spender: Address;
  contract: FameSwapApprovalContractRequest;
}

export interface FameSwapRouterTransaction {
  kind: "swap";
  routeArtifactId: FameSwapExecutableQuote["routeArtifactId"];
  fixtureRouteHash: Hex;
  materializedRouteHash: Hex;
  contract: FameSwapRouterContractRequest;
}

export interface FameSwapTransactionRequests {
  approval: FameSwapApprovalTransaction | null;
  swap: FameSwapRouterTransaction | null;
}

export interface FameSwapRouteRequestOverride {
  route: FameRoute;
  materializedRouteHash: Hex;
}

export function fameSwapTransactionRequests(
  quote: FameSwapQuote | null,
  routeOverride?: FameSwapRouteRequestOverride,
): FameSwapTransactionRequests {
  if (quote?.status !== "ready") {
    return {
      approval: null,
      swap: null,
    };
  }

  const route = routeOverride?.route ?? quote.route;
  const materializedRouteHash =
    routeOverride?.materializedRouteHash ?? quote.materializedRouteHash;

  return {
    approval: quote.approval
      ? {
          kind: "approval",
          token: quote.approval.token,
          amount: quote.approval.amount,
          spender: quote.approval.spender,
          contract: {
            address: quote.approval.token.address,
            abi: erc20ApprovalAbi,
            functionName: "approve",
            args: [quote.approval.spender, quote.approval.amount],
            chainId: base.id,
          },
        }
      : null,
    swap: {
      kind: "swap",
      routeArtifactId: quote.routeArtifactId,
      fixtureRouteHash: quote.fixtureRouteHash,
      materializedRouteHash,
      contract: {
        address: quote.routerAddress,
        abi: fameRouterAbi,
        functionName: "executeRoute",
        args: [fameRouteToCall(route)],
        value: quote.callValue,
        chainId: base.id,
      },
    },
  };
}
