"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { isAddressEqual, type Hash, type PublicClient } from "viem";
import { usePublicClient } from "wagmi";
import {
  fameAbi,
  fameMarketplaceCheckoutAbi,
  universalPoolArtMarketplaceAbi,
} from "../../../wagmi";
import { getFameSwapConfig } from "../../fame-swap/config";
import { fameRouterAbi } from "../../fame-swap/router/abi";
import { FAME } from "../../fame-swap/tokens";
import { tokenForAddress, type FameSwapToken } from "../../fame-swap/tokens";
import { routeCandidatesForPair } from "../../fame-swap/solver/graph/candidates";
import { createLiveLiquidityQuoteAdapter } from "../../fame-swap/solver/quotes/liveAdapters";
import { solveFameTargetOutput } from "../../fame-swap/solver/targetOutput";
import { useGalleryRuntime } from "../config/galleryRuntime";
import type {
  GalleryCheckoutQuote,
  GalleryGlobalState,
  GalleryPaymentAsset,
} from "../types";

export const GALLERY_CHECKOUT_SEARCH_RANGES = {
  ETH: {
    minimumInput: 10_000_000_000n,
    maximumInput: 500_000_000_000_000_000n,
    precision: 10_000_000_000n,
  },
  USDC: {
    minimumInput: 10_000n,
    maximumInput: 1_000_000_000n,
    precision: 10_000n,
  },
  WETH: {
    minimumInput: 10_000_000_000n,
    maximumInput: 500_000_000_000_000_000n,
    precision: 10_000_000_000n,
  },
} as const;

function checkoutToken(
  asset: Exclude<GalleryPaymentAsset, "FAME">,
  runtime: NonNullable<ReturnType<typeof useGalleryRuntime>["checkout"]>,
): FameSwapToken {
  const address =
    asset === "ETH"
      ? "0x0000000000000000000000000000000000000000"
      : asset === "USDC"
        ? runtime.usdc
        : runtime.weth;
  const token = tokenForAddress(address);
  if (!token || token.symbol !== asset) {
    throw new Error(`The fork ${asset} checkout token is misconfigured.`);
  }
  return token;
}

type GalleryCheckoutQuoteClient = Pick<
  PublicClient,
  "getBlockNumber" | "getBlock" | "readContract"
>;

export async function quoteGalleryCheckout(input: {
  client: GalleryCheckoutQuoteClient;
  chainId: number;
  marketplace: `0x${string}`;
  fame: `0x${string}`;
  checkout: NonNullable<ReturnType<typeof useGalleryRuntime>["checkout"]>;
  paymentAsset: Exclude<GalleryPaymentAsset, "FAME">;
  signal?: AbortSignal;
}): Promise<GalleryCheckoutQuote> {
  const swapConfig = getFameSwapConfig();
  if (!swapConfig.routerAddress) {
    throw new Error("The FAME router is unavailable for fork checkout.");
  }
  if (
    swapConfig.routerAddress.toLowerCase() !==
    input.checkout.router.toLowerCase()
  ) {
    throw new Error("The gallery checkout and quote router do not match.");
  }

  let rpcReads = 0;
  const blockNumber = await input.client.getBlockNumber();
  rpcReads += 1;
  const [
    block,
    marketplaceUnit,
    marketplacePremium,
    feePpm,
    checkoutRouter,
    checkoutMarket,
    checkoutFame,
    checkoutUsdc,
    checkoutWeth,
  ] = await Promise.all([
    input.client.getBlock({ blockNumber }),
    input.client.readContract({
      abi: fameAbi,
      address: input.fame,
      functionName: "unit",
      blockNumber,
    }),
    input.client.readContract({
      abi: universalPoolArtMarketplaceAbi,
      address: input.marketplace,
      functionName: "premium",
      blockNumber,
    }),
    input.client.readContract({
      abi: fameRouterAbi,
      address: input.checkout.router,
      functionName: "feePpm",
      blockNumber,
    }),
    input.client.readContract({
      abi: fameMarketplaceCheckoutAbi,
      address: input.checkout.address,
      functionName: "router",
      blockNumber,
    }),
    input.client.readContract({
      abi: fameMarketplaceCheckoutAbi,
      address: input.checkout.address,
      functionName: "market",
      blockNumber,
    }),
    input.client.readContract({
      abi: fameMarketplaceCheckoutAbi,
      address: input.checkout.address,
      functionName: "fame",
      blockNumber,
    }),
    input.client.readContract({
      abi: fameMarketplaceCheckoutAbi,
      address: input.checkout.address,
      functionName: "usdc",
      blockNumber,
    }),
    input.client.readContract({
      abi: fameMarketplaceCheckoutAbi,
      address: input.checkout.address,
      functionName: "weth",
      blockNumber,
    }),
  ]);
  rpcReads += 9;
  if (
    !isAddressEqual(checkoutRouter, input.checkout.router) ||
    !isAddressEqual(checkoutMarket, input.marketplace) ||
    !isAddressEqual(checkoutFame, input.fame) ||
    !isAddressEqual(checkoutUsdc, input.checkout.usdc) ||
    !isAddressEqual(checkoutWeth, input.checkout.weth)
  ) {
    throw new Error("The configured fork checkout dependencies do not match.");
  }

  const tokenIn = checkoutToken(input.paymentAsset, input.checkout);
  const tokenOut = tokenForAddress(FAME);
  if (!tokenOut) throw new Error("The FAME output token is unavailable.");
  const candidates = routeCandidatesForPair(tokenIn.address, FAME).candidates;
  const selectedTopology = candidates[0];
  if (!selectedTopology) {
    throw new Error(`No ${input.paymentAsset} to FAME route is available.`);
  }

  const context = {
    source: "fork",
    chainId: input.chainId,
    blockNumber,
    forkUrlLabel: "configured-local-fork",
  } as const;
  const adapter = await createLiveLiquidityQuoteAdapter({
    client: {
      readContract: async (request) => {
        rpcReads += 1;
        return input.client.readContract(request as never);
      },
    },
    chainId: input.chainId,
    blockNumber,
    contextSource: "fork",
    forkUrlLabel: context.forkUrlLabel,
    readTimeoutMs: 2_500,
  });
  const range = GALLERY_CHECKOUT_SEARCH_RANGES[input.paymentAsset];
  const targetOutput = marketplaceUnit + marketplacePremium;
  const wallClockSeconds = BigInt(Math.floor(Date.now() / 1_000));
  const deadlineBase =
    block.timestamp > wallClockSeconds ? block.timestamp : wallClockSeconds;
  const deadline = deadlineBase + 10n * 60n;
  const solved = await solveFameTargetOutput({
    tokenIn,
    tokenOut,
    selectedTopology,
    fallbackTopologies: candidates.slice(1),
    targetOutput,
    minimumInput: range.minimumInput,
    maximumInput: range.maximumInput,
    precision: range.precision,
    routerAddress: input.checkout.router,
    recipient: input.checkout.address,
    deadline,
    feePpm: BigInt(feePpm),
    slippageBps: swapConfig.defaultSlippageBps,
    adapter,
    expectedContext: context,
    timeoutMs: 20_000,
    materializationReserveMs: 2_500,
    maxRpcReads: 300,
    rpcReads: () => rpcReads,
    signal: input.signal,
  });
  if (solved.status !== "ready") {
    throw new Error(solved.message);
  }

  const estimatedFameOutput = solved.quote.plan.netAmountOut;
  return {
    paymentAsset: input.paymentAsset,
    inputToken: tokenIn.address,
    checkout: input.checkout.address,
    marketplace: input.marketplace,
    quoteBlockNumber: blockNumber,
    routeId: solved.topology.id,
    routeHash: solved.quote.routeHash as Hash,
    route: solved.quote.route,
    marketplaceUnit,
    marketplacePremium,
    maximumPremium: marketplacePremium,
    marketplaceFameCharge: targetOutput,
    maximumInput: solved.amountIn,
    estimatedInputResidue: 0n,
    protectedFame: solved.protectedOutput,
    estimatedFameOutput,
    estimatedSurplusFame:
      estimatedFameOutput > targetOutput
        ? estimatedFameOutput - targetOutput
        : 0n,
    expiresAt: new Date(Number(deadline) * 1_000),
  };
}

export function useGalleryCheckoutQuote(input: {
  paymentAsset: GalleryPaymentAsset;
  globalState: GalleryGlobalState | null;
}) {
  const runtime = useGalleryRuntime();
  const publicClient = usePublicClient({ chainId: runtime.chainId });
  const checkout = runtime.checkout;
  const queryKey = useMemo(
    () => [
      "gallery-checkout-quote",
      runtime.chainId,
      runtime.addresses.gallery,
      checkout?.address ?? null,
      input.paymentAsset,
      input.globalState?.unit.toString() ?? null,
      input.globalState?.premium.toString() ?? null,
    ],
    [checkout?.address, input.globalState, input.paymentAsset, runtime],
  );
  const enabled =
    input.paymentAsset !== "FAME" &&
    checkout !== null &&
    publicClient !== undefined &&
    input.globalState !== null;
  const query = useQuery({
    queryKey,
    enabled,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 30_000,
    queryFn: ({ signal }) => {
      if (input.paymentAsset === "FAME" || !checkout || !publicClient) {
        throw new Error("Fork checkout quoting is unavailable.");
      }
      return quoteGalleryCheckout({
        client: publicClient,
        chainId: runtime.chainId,
        marketplace: runtime.addresses.gallery,
        fame: runtime.addresses.fame,
        checkout,
        paymentAsset: input.paymentAsset,
        signal,
      });
    },
  });

  return {
    quote: query.data ?? null,
    isLoading: enabled && query.isFetching,
    error: query.error instanceof Error ? query.error : null,
    refresh: query.refetch,
    enabled,
  };
}
