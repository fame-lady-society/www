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
  gallery: Address;
  fame: Address;
  mirror: Address;
  creatorMagic: Address;
  renderer: Address;
  feeRecipient: Address;
  accruedProtocolFees: bigint;
  unit: bigint;
  inventory: bigint;
};

export type GalleryListing = {
  premium: bigint;
  active: boolean;
};

export type GalleryTokenState = {
  tokenId: bigint;
  listing: GalleryListing;
  owner: Address;
  tokenUri: string;
};

export type GalleryCandidateState = {
  tokenId: bigint;
  listing: GalleryListing;
  owner: Address;
};

export type GalleryAccountState = {
  account: Address;
  balance: bigint;
  allowance: bigint;
};

export type GalleryAuthority = "owner" | "operator" | "denied";

export type GalleryAuthorityState = {
  account: Address;
  owner: Address;
  operatorRole: bigint;
  accountRoles: bigint;
  authority: GalleryAuthority;
};

export type GalleryPoolKind = "mint" | "burn";

export type GalleryPoolCandidate = {
  tokenId: bigint;
  eligible: boolean;
};

export type GalleryPoolState = {
  kind: GalleryPoolKind;
  mintPoolStart: bigint;
  mintPoolEnd: bigint;
  totalNftSupply: bigint;
  maxNftSupply: bigint;
  candidates: readonly GalleryPoolCandidate[];
};

export type GalleryCanonicalBlock = {
  number: bigint;
  hash: Hash;
};
