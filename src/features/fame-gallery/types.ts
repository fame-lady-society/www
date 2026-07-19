import type { Address, Hash } from "viem";

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
