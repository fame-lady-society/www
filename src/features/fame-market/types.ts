import type { Address, Hash } from "viem";
import type { FameRoute } from "../fame-swap/router/types";

export type GalleryProjectionFailure = {
  status: "failure";
  blockNumber: bigint | null;
  message: string;
};

export type GalleryProjectionSuccess<T> = {
  status: "success";
  blockNumber: bigint;
  data: T;
};

export type GalleryProjectionResult<T> =
  | GalleryProjectionSuccess<T>
  | GalleryProjectionFailure;

export type GalleryHookProjection<T> =
  | { status: "idle" }
  | { status: "loading" }
  | GalleryProjectionResult<T>;

export type GalleryGlobalState = {
  marketplace: Address;
  fame: Address;
  mirror: Address;
  creatorMagic: Address;
  owner: Address;
  paused: boolean;
  premium: bigint;
  communityFee: bigint;
  providerFee: bigint;
  totalProviderUnits: bigint;
  activeProviderCount: bigint;
  activeProviderCap: bigint;
  feeRecipient: Address;
  inventory: bigint;
  unit: bigint;
};

export type GalleryTargetKind = "held" | "mint" | "burn";

/**
 * Canonical contract data used to resolve a purchase. This identity is kept
 * separate from the decoded metadata shown by artwork cards.
 */
export type GalleryArtworkTarget = {
  targetId: string;
  kind: GalleryTargetKind;
  tokenId: bigint;
  artworkHash: Hash | null;
  tokenUri: string | null;
  artworkError: string | null;
};

export type GalleryArtworkPresentation = {
  name: string | null;
  image: string | null;
  description: string | null;
};

export type GalleryTokenState = {
  tokenId: bigint;
  owner: Address;
  marketplaceHeld: boolean;
  artworkHash: Hash | null;
  tokenUri: string | null;
  artworkError: string | null;
};

export type GalleryCustodyState = {
  tokenId: bigint;
  owner: Address;
  marketplaceHeld: boolean;
};

export type GalleryAccountState = {
  account: Address;
  balance: bigint;
  allowance: bigint;
};

export type GalleryAuthority = "owner" | "denied";

export type GalleryAuthorityState = {
  account: Address;
  owner: Address;
  authority: GalleryAuthority;
};

export type GalleryPoolState = {
  targets: readonly GalleryArtworkTarget[];
  failedMembershipTokenIds: readonly bigint[];
  ambiguousTokenIds: readonly bigint[];
};

export type GalleryCanonicalBlock = {
  number: bigint;
  hash: Hash;
};

/**
 * Buyer-visible consent captured when Buy begins. Fulfillment may be
 * re-resolved, but these terms must not change during the active flow.
 */
export type GalleryFrozenBuyerTerms = Readonly<{
  chainId: number;
  account: Address;
  recipient: Address;
  selectedTarget: Readonly<{
    targetId: string;
    tokenId: bigint;
  }>;
  artworkHash: Hash;
  unit: bigint;
  maxPremium: bigint;
  maximumSpend: bigint;
  allowanceTarget: Address;
  checkout?: Readonly<{
    paymentAsset: "ETH" | "USDC" | "WETH";
    inputToken: Address;
    checkout: Address;
    marketplace: Address;
    maximumInput: bigint;
    routeHash: Hash;
    routeDeadline: bigint;
    quoteBlockNumber: bigint;
  }>;
}>;

export type GalleryPaymentAsset = "FAME" | "ETH" | "USDC" | "WETH";

export type GalleryCheckoutQuote = Readonly<{
  paymentAsset: Exclude<GalleryPaymentAsset, "FAME">;
  inputToken: Address;
  checkout: Address;
  marketplace: Address;
  quoteBlockNumber: bigint;
  routeId: string;
  routeHash: Hash;
  route: FameRoute;
  marketplaceUnit: bigint;
  marketplacePremium: bigint;
  maximumPremium: bigint;
  marketplaceFameCharge: bigint;
  maximumInput: bigint;
  estimatedInputResidue: bigint;
  protectedFame: bigint;
  estimatedFameOutput: bigint;
  estimatedSurplusFame: bigint;
  expiresAt: Date;
}>;

export type GalleryRedemptionOutputAsset = Exclude<GalleryPaymentAsset, "FAME">;

export type GalleryRedemptionQuote = Readonly<{
  account: Address;
  chainId: number;
  tokenIds: readonly bigint[];
  outputAsset: GalleryRedemptionOutputAsset;
  outputToken: Address;
  checkout: Address;
  quoteBlockNumber: bigint;
  fameUnit: bigint;
  selectedBacking: bigint;
  checkoutBonus: bigint;
  quoteBasis: bigint;
  estimatedOutput: bigint;
  minimumOutput: bigint;
  routeHash: Hash;
  route: FameRoute;
  deadline: bigint;
  expiresAt: Date;
}>;

export type GalleryFulfillmentRoute =
  | Readonly<{
      kind: "held";
      shellId: bigint;
    }>
  | Readonly<{
      kind: "pool";
      poolKind: "mint" | "burn";
      shellId: bigint;
      sourceId: bigint;
    }>;

export type GalleryVerifiedAcquisition = Readonly<{
  transactionHash: Hash;
  receiptBlockNumber: bigint;
  deliveredShellId: bigint;
  artworkHash: Hash;
  unit: bigint;
  premium: bigint;
  total: bigint;
  recipient: Address;
  affectedTokenIds: readonly bigint[];
}>;

export type GalleryAdminCall =
  | Readonly<{ kind: "set_community_fee"; fee: bigint }>
  | Readonly<{ kind: "set_provider_fee"; fee: bigint }>
  | Readonly<{ kind: "set_fee_recipient"; feeRecipient: Address }>
  | Readonly<{ kind: "pause" }>
  | Readonly<{ kind: "unpause" }>;
