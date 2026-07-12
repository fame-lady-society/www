import type { Address } from "viem";

export type SocietyNftAuctionLifecycle = 0 | 1 | 2;

export interface SocietyNftAuctionSnapshot {
  auctionAddress: Address;
  societyNft: Address;
  lifecycle: SocietyNftAuctionLifecycle;
  tokenId: bigint;
  startTime: bigint;
  endTime: bigint;
  highestBidder: Address;
  highestBid: bigint;
  settledRecipient: Address;
}

export interface SocietyNftAuctionSnapshotInput {
  auctionAddress: unknown;
  societyNft: unknown;
  lifecycle: unknown;
  tokenId: unknown;
  startTime: unknown;
  endTime: unknown;
  highestBidder: unknown;
  highestBid: unknown;
  settledRecipient: unknown;
}

export type SocietyNftAuctionSnapshotResult =
  | { status: "ready"; snapshot: SocietyNftAuctionSnapshot }
  | { status: "failure"; message: string; retryable: true };

interface AuctionProjectionBase {
  canBid: boolean;
  canSettle: boolean;
}

export interface AuctionLoadingProjection extends AuctionProjectionBase {
  kind: "loading";
  message: "Loading auction";
  canBid: false;
  canSettle: false;
}

export interface AuctionFailureProjection extends AuctionProjectionBase {
  kind: "failure";
  message: string;
  retryable: true;
  canBid: false;
  canSettle: false;
}

export interface AuctionUnstartedProjection extends AuctionProjectionBase {
  kind: "unstarted";
  message: "Auction has not started";
  auctionAddress: Address;
  societyNft: Address;
  canBid: false;
  canSettle: false;
}

export interface AuctionLot {
  tokenId: bigint;
}

interface StartedAuctionProjection extends AuctionProjectionBase {
  auctionAddress: Address;
  societyNft: Address;
  lot: AuctionLot;
  startTime: bigint;
  endTime: bigint;
  highestBidder: Address;
  highestBid: bigint;
}

export interface AuctionActiveProjection extends StartedAuctionProjection {
  kind: "active";
  message: "Auction is live";
  canBid: true;
  canSettle: false;
}

export interface AuctionEndedProjection extends StartedAuctionProjection {
  kind: "ended_unsettled";
  message: "Auction ended — ready to settle";
  canBid: false;
  canSettle: true;
}

export interface AuctionSettledProjection extends StartedAuctionProjection {
  kind: "settled";
  message: "Auction settled";
  settledRecipient: Address;
  winningBid: bigint;
  canBid: false;
  canSettle: false;
}

export type SocietyNftAuctionPageProjection =
  | AuctionLoadingProjection
  | AuctionFailureProjection
  | AuctionUnstartedProjection
  | AuctionActiveProjection
  | AuctionEndedProjection
  | AuctionSettledProjection;

export interface SocietyNftAuctionMetadata {
  image: string;
  name: string | null;
  description: string | null;
  usedFallback: boolean;
  error: string | null;
}

export type BidValidationResult =
  | { valid: true; wei: bigint }
  | {
      valid: false;
      reason: "empty" | "invalid" | "precision" | "zero" | "not_above_highest";
      message: string;
    };
