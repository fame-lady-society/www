import { isAddress, parseEther } from "viem";
import type {
  BidValidationResult,
  SocietyNftAuctionLifecycle,
  SocietyNftAuctionPageProjection,
  SocietyNftAuctionSnapshot,
  SocietyNftAuctionSnapshotInput,
  SocietyNftAuctionSnapshotResult,
} from "./types";

function requiredAddress(
  value: unknown,
  field: string,
): SocietyNftAuctionSnapshot["auctionAddress"] {
  if (typeof value !== "string" || !isAddress(value)) {
    throw new Error(`${field} is missing or invalid`);
  }

  return value;
}

function requiredUint(value: unknown, field: string): bigint {
  if (typeof value !== "bigint" || value < 0n) {
    throw new Error(`${field} is missing or invalid`);
  }

  return value;
}

function requiredLifecycle(value: unknown): SocietyNftAuctionLifecycle {
  if (value !== 0 && value !== 1 && value !== 2) {
    throw new Error("lifecycle is missing or invalid");
  }

  return value;
}

export function buildAuctionSnapshot(
  input: SocietyNftAuctionSnapshotInput,
): SocietyNftAuctionSnapshotResult {
  try {
    return {
      status: "ready",
      snapshot: {
        auctionAddress: requiredAddress(input.auctionAddress, "auctionAddress"),
        societyNft: requiredAddress(input.societyNft, "societyNft"),
        lifecycle: requiredLifecycle(input.lifecycle),
        tokenId: requiredUint(input.tokenId, "tokenId"),
        startTime: requiredUint(input.startTime, "startTime"),
        endTime: requiredUint(input.endTime, "endTime"),
        highestBidder: requiredAddress(input.highestBidder, "highestBidder"),
        highestBid: requiredUint(input.highestBid, "highestBid"),
        settledRecipient: requiredAddress(
          input.settledRecipient,
          "settledRecipient",
        ),
      },
    };
  } catch (error) {
    return {
      status: "failure",
      message:
        error instanceof Error
          ? `Auction data is unavailable: ${error.message}`
          : "Auction data is unavailable",
      retryable: true,
    };
  }
}

function startedFacts(snapshot: SocietyNftAuctionSnapshot) {
  return {
    auctionAddress: snapshot.auctionAddress,
    societyNft: snapshot.societyNft,
    lot: { tokenId: snapshot.tokenId },
    startTime: snapshot.startTime,
    endTime: snapshot.endTime,
    highestBidder: snapshot.highestBidder,
    highestBid: snapshot.highestBid,
  };
}

export function projectAuctionPage(
  result: SocietyNftAuctionSnapshotResult,
  observedBlockTimestamp: bigint | null,
): SocietyNftAuctionPageProjection {
  if (result.status === "failure") {
    return {
      kind: "failure",
      message: result.message,
      retryable: true,
      canBid: false,
      canSettle: false,
    };
  }

  if (observedBlockTimestamp === null) {
    return {
      kind: "loading",
      message: "Loading auction",
      canBid: false,
      canSettle: false,
    };
  }

  const { snapshot } = result;

  if (snapshot.lifecycle === 0) {
    return {
      kind: "unstarted",
      message: "Auction has not started",
      auctionAddress: snapshot.auctionAddress,
      societyNft: snapshot.societyNft,
      canBid: false,
      canSettle: false,
    };
  }

  const facts = startedFacts(snapshot);

  if (snapshot.lifecycle === 2) {
    return {
      kind: "settled",
      message: "Auction settled",
      ...facts,
      settledRecipient: snapshot.settledRecipient,
      winningBid: snapshot.highestBid,
      canBid: false,
      canSettle: false,
    };
  }

  if (observedBlockTimestamp >= snapshot.endTime) {
    return {
      kind: "ended_unsettled",
      message: "Auction ended — ready to settle",
      ...facts,
      canBid: false,
      canSettle: true,
    };
  }

  return {
    kind: "active",
    message: "Auction is live",
    ...facts,
    canBid: true,
    canSettle: false,
  };
}

function parseExactEther(value: string): BidValidationResult {
  const amount = value.trim();
  if (amount.length === 0) {
    return {
      valid: false,
      reason: "empty",
      message: "Enter a bid amount",
    };
  }

  const match = /^(\d+)(?:\.(\d+))?$/.exec(amount);
  if (!match) {
    return {
      valid: false,
      reason: "invalid",
      message: "Enter a plain ETH amount without signs or exponent notation",
    };
  }

  const [, , fraction = ""] = match;
  if (fraction.length > 18) {
    return {
      valid: false,
      reason: "precision",
      message: "ETH bids support at most 18 decimal places",
    };
  }

  return { valid: true, wei: parseEther(amount) };
}

export function validateBidAmount(
  value: string,
  highestBid: bigint,
): BidValidationResult {
  const parsed = parseExactEther(value);
  if (!parsed.valid) return parsed;

  if (parsed.wei === 0n) {
    return {
      valid: false,
      reason: "zero",
      message: "Bid must be greater than zero",
    };
  }

  if (parsed.wei <= highestBid) {
    return {
      valid: false,
      reason: "not_above_highest",
      message: `Bid must be at least ${highestBid + 1n} wei`,
    };
  }

  return parsed;
}
