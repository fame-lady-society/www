import {
  isAddressEqual,
  type Address,
  type Hash,
  type PublicClient,
} from "viem";
import { fameAbi } from "../../../wagmi";
import { getFameSwapConfig } from "../../fame-swap/config";
import type { FameRoute } from "../../fame-swap/router/types";
import { fameRouterAbi } from "../../fame-swap/router/abi";
import { materializeAllInFameRoute } from "../../fame-swap/solver/materializeRoute";
import { quoteFameSwapAsync } from "../../fame-swap/solver/quote";
import { createLiveLiquidityQuoteAdapter } from "../../fame-swap/solver/quotes/liveAdapters";
import {
  FAME,
  NATIVE_ETH,
  USDC,
  WETH,
  tokenForAddress,
} from "../../fame-swap/tokens";
import type {
  GalleryRedemptionOutputAsset,
  GalleryRedemptionQuote,
} from "../types";
import {
  SOCIETY_TOKEN_ID_END_EXCLUSIVE,
  SOCIETY_TOKEN_ID_START,
} from "./ownedSociety";

export const SOCIETY_REDEMPTION_FAME_PER_TOKEN = 1_000_000n * 10n ** 18n;
export const GALLERY_REDEMPTION_DEADLINE_SECONDS = 10n * 60n;

type GalleryRedemptionClient = Pick<
  PublicClient,
  "getBlockNumber" | "getBlock" | "readContract"
>;

type ExactInputResult =
  | Readonly<{
      status: "ready";
      route: FameRoute;
      estimatedOutput: bigint;
    }>
  | Readonly<{ status: "unavailable"; message: string }>;

type ExactInputOptions = Readonly<{
  client: GalleryRedemptionClient;
  chainId: number;
  blockNumber: bigint;
  router: Address;
  feePpm: bigint;
  recipient: Address;
  amountIn: bigint;
  outputAsset: GalleryRedemptionOutputAsset;
  deadlineBase: bigint;
  signal?: AbortSignal;
}>;

async function solveExactInput(
  options: ExactInputOptions,
): Promise<ExactInputResult> {
  options.signal?.throwIfAborted();
  const config = getFameSwapConfig();
  if (
    !config.routerAddress ||
    !isAddressEqual(config.routerAddress, options.router)
  ) {
    return {
      status: "unavailable",
      message: "The gallery checkout and FAME quote router do not match.",
    };
  }
  const tokenIn = tokenForAddress(FAME);
  const outputAddress =
    options.outputAsset === "ETH"
      ? NATIVE_ETH
      : options.outputAsset === "USDC"
        ? USDC
        : WETH;
  const tokenOut = tokenForAddress(outputAddress);
  if (!tokenIn || !tokenOut) {
    return {
      status: "unavailable",
      message: "Redemption output token is unavailable.",
    };
  }
  const adapter = await createLiveLiquidityQuoteAdapter({
    client: {
      readContract: (request) =>
        options.client.readContract(request as never) as Promise<unknown>,
    },
    chainId: options.chainId,
    blockNumber: options.blockNumber,
    contextSource: "fork",
    forkUrlLabel: "configured-gallery-rpc",
    readTimeoutMs: 2_500,
  });
  options.signal?.throwIfAborted();
  const quote = await quoteFameSwapAsync({
    tokenIn,
    tokenOut,
    amountIn: options.amountIn,
    recipient: options.recipient,
    config,
    readiness: {
      status: "ready",
      routerAddress: options.router,
      feePpm: options.feePpm,
    },
    now: new Date(Number(options.deadlineBase) * 1_000),
    deadlineSeconds: GALLERY_REDEMPTION_DEADLINE_SECONDS,
    adapter,
  });
  options.signal?.throwIfAborted();
  if (quote.status !== "ready") {
    return { status: "unavailable", message: quote.message };
  }
  return {
    status: "ready",
    route: quote.route,
    estimatedOutput: quote.estimatedOutput,
  };
}

type GalleryRedemptionQuoteDependencies = Readonly<{
  solveExactInput: (options: ExactInputOptions) => Promise<ExactInputResult>;
  now: () => number;
}>;

const defaultDependencies: GalleryRedemptionQuoteDependencies = {
  solveExactInput,
  now: Date.now,
};

export function galleryRedemptionQuoteBasis(
  tokenIds: readonly bigint[],
  fameUnit: bigint,
  checkoutBonus: bigint,
) {
  if (tokenIds.length < 1 || tokenIds.length > 32) {
    throw new Error("Select 1 to 32 Society NFTs for redemption.");
  }
  if (checkoutBonus < 0n) {
    throw new Error("Checkout FAME bonus cannot be negative.");
  }
  if (fameUnit <= 0n) {
    throw new Error("Pinned FAME unit must be positive.");
  }
  let previous = 0n;
  for (const tokenId of tokenIds) {
    if (
      tokenId < SOCIETY_TOKEN_ID_START ||
      tokenId >= SOCIETY_TOKEN_ID_END_EXCLUSIVE
    ) {
      throw new Error(`Society token ${tokenId.toString()} is out of range.`);
    }
    if (tokenId === previous) {
      throw new Error("Selected Society token IDs must be unique.");
    }
    if (tokenId < previous) {
      throw new Error("Selected Society token IDs must be strictly ascending.");
    }
    previous = tokenId;
  }
  return BigInt(tokenIds.length) * fameUnit + checkoutBonus;
}

export async function quoteGalleryRedemption(
  input: {
    client: GalleryRedemptionClient;
    chainId: number;
    account: Address;
    checkout: Address;
    fame: Address;
    router: Address;
    tokenIds: readonly bigint[];
    outputAsset: GalleryRedemptionOutputAsset;
    signal?: AbortSignal;
  },
  dependencyOverrides: Partial<GalleryRedemptionQuoteDependencies> = {},
): Promise<GalleryRedemptionQuote> {
  const dependencies = { ...defaultDependencies, ...dependencyOverrides };
  input.signal?.throwIfAborted();
  const blockNumber = await input.client.getBlockNumber();
  const [block, checkoutBonus, fameUnit, feePpm] = await Promise.all([
    input.client.getBlock({ blockNumber }),
    input.client.readContract({
      abi: fameAbi,
      address: input.fame,
      functionName: "balanceOf",
      args: [input.checkout],
      blockNumber,
    }),
    input.client.readContract({
      abi: fameAbi,
      address: input.fame,
      functionName: "unit",
      blockNumber,
    }),
    input.client.readContract({
      abi: fameRouterAbi,
      address: input.router,
      functionName: "feePpm",
      blockNumber,
    }),
  ]);
  input.signal?.throwIfAborted();
  const quoteBasis = galleryRedemptionQuoteBasis(
    input.tokenIds,
    BigInt(fameUnit),
    checkoutBonus,
  );
  const wallClockSeconds = BigInt(Math.floor(dependencies.now() / 1_000));
  const deadlineBase =
    block.timestamp > wallClockSeconds ? block.timestamp : wallClockSeconds;
  const solved = await dependencies.solveExactInput({
    ...input,
    blockNumber,
    recipient: input.account,
    amountIn: quoteBasis,
    feePpm: BigInt(feePpm),
    deadlineBase,
  });
  input.signal?.throwIfAborted();
  if (solved.status !== "ready") throw new Error(solved.message);
  const deadline = solved.route.deadline;
  const materialized = materializeAllInFameRoute(
    solved.route,
    input.router,
    input.account,
    deadline,
  );
  const outputToken = materialized.route.tokenOut;

  return {
    account: input.account,
    chainId: input.chainId,
    tokenIds: [...input.tokenIds],
    outputAsset: input.outputAsset,
    outputToken,
    checkout: input.checkout,
    quoteBlockNumber: blockNumber,
    fameUnit: BigInt(fameUnit),
    selectedBacking: BigInt(input.tokenIds.length) * BigInt(fameUnit),
    checkoutBonus,
    quoteBasis,
    estimatedOutput: solved.estimatedOutput,
    minimumOutput: materialized.route.minAmountOutAfterFee,
    routeHash: materialized.routeHash as Hash,
    route: materialized.route,
    deadline,
    expiresAt: new Date(Number(deadline) * 1_000),
  };
}

export function galleryRedemptionConsentKey(
  input: Pick<
    GalleryRedemptionQuote,
    | "account"
    | "chainId"
    | "checkout"
    | "tokenIds"
    | "outputAsset"
    | "quoteBasis"
    | "minimumOutput"
    | "deadline"
    | "routeHash"
  >,
) {
  return [
    input.account.toLowerCase(),
    input.chainId,
    input.checkout.toLowerCase(),
    input.tokenIds.join(","),
    input.outputAsset,
    input.quoteBasis,
    input.minimumOutput,
    input.deadline,
    input.routeHash.toLowerCase(),
  ].join(":");
}

export function isGalleryRedemptionQuoteCurrent(
  quote: Pick<
    GalleryRedemptionQuote,
    "account" | "chainId" | "tokenIds" | "outputAsset" | "expiresAt"
  >,
  live: {
    account: Address | undefined;
    chainId: number | undefined;
    tokenIds: readonly bigint[];
    outputAsset: GalleryRedemptionOutputAsset;
    now?: number;
  },
) {
  return (
    Boolean(live.account) &&
    isAddressEqual(live.account!, quote.account) &&
    live.chainId === quote.chainId &&
    live.outputAsset === quote.outputAsset &&
    live.tokenIds.length === quote.tokenIds.length &&
    live.tokenIds.every(
      (tokenId, index) => tokenId === quote.tokenIds[index],
    ) &&
    quote.expiresAt.getTime() > (live.now ?? Date.now())
  );
}
