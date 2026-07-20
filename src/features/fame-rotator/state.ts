import type { Address } from "viem";
import type { OwnedTokenScanResult } from "./ownedTokens";

export type ReadState<T> =
  | { status: "disconnected" }
  | { status: "loading" }
  | { status: "error" }
  | { status: "success"; data: T };

export type FameRotatorPreflightStatus =
  | "disconnected"
  | "checking"
  | "direct_eligible"
  | "needs_skip_repair"
  | "needs_fame"
  | "needs_reconciliation"
  | "incomplete_inventory"
  | "read_failure";

export type FameRotatorPreflight =
  | {
      status: "disconnected";
      canSelectOffered: false;
      canRotate: false;
      ownedIds: readonly number[];
      message: string;
    }
  | {
      status: "checking";
      canSelectOffered: false;
      canRotate: false;
      ownedIds: readonly number[];
      message: string;
    }
  | {
      status: "direct_eligible";
      canSelectOffered: true;
      canRotate: false;
      ownedIds: readonly number[];
      message: string;
    }
  | {
      status: "needs_skip_repair";
      canSelectOffered: false;
      canRotate: false;
      ownedIds: readonly number[];
      message: string;
    }
  | {
      status: "needs_fame";
      canSelectOffered: false;
      canRotate: false;
      ownedIds: readonly number[];
      shortfall: bigint;
      unit: bigint;
      balance: bigint;
      message: string;
    }
  | {
      status: "needs_reconciliation";
      canSelectOffered: false;
      canRotate: false;
      ownedIds: readonly number[];
      balance: bigint;
      unit: bigint;
      message: string;
    }
  | {
      status: "incomplete_inventory";
      canSelectOffered: false;
      canRotate: false;
      ownedIds: readonly number[];
      message: string;
      retryable: true;
    }
  | {
      status: "read_failure";
      canSelectOffered: false;
      canRotate: false;
      ownedIds: readonly number[];
      message: string;
      retryable: true;
    };

export interface ProjectFameRotatorPreflightInput {
  isConnected: boolean;
  account: Address | null | undefined;
  ownership: OwnedTokenScanResult | null;
  ownershipPending: boolean;
  /** Only required when ownership is complete with zero NFTs. */
  fameBalance: ReadState<bigint> | null;
  unit: ReadState<bigint> | null;
  skipNft: ReadState<boolean> | null;
}

/**
 * Project readiness for rotation preflight.
 *
 * Ownership is authoritative: a complete scan with one or more owned NFTs is
 * direct-eligible regardless of FAME balance or skip mode. Acquisition
 * checklist reads only apply when the inventory is complete and empty.
 */
export function projectFameRotatorPreflight({
  isConnected,
  account,
  ownership,
  ownershipPending,
  fameBalance,
  unit,
  skipNft,
}: ProjectFameRotatorPreflightInput): FameRotatorPreflight {
  if (!isConnected || !account) {
    return {
      status: "disconnected",
      canSelectOffered: false,
      canRotate: false,
      ownedIds: [],
      message: "Connect a Base wallet to choose a Society NFT to offer.",
    };
  }

  if (ownershipPending || ownership === null) {
    return {
      status: "checking",
      canSelectOffered: false,
      canRotate: false,
      ownedIds: [],
      message: "Checking your Society NFT inventory…",
    };
  }

  if (ownership.status === "error") {
    return {
      status: "read_failure",
      canSelectOffered: false,
      canRotate: false,
      ownedIds: ownership.ownedIds,
      message:
        ownership.reason ||
        "Could not verify your Society NFT inventory. Try again.",
      retryable: true,
    };
  }

  if (ownership.status === "incomplete") {
    return {
      status: "incomplete_inventory",
      canSelectOffered: false,
      canRotate: false,
      ownedIds: ownership.ownedIds,
      message:
        ownership.reason ||
        "Ownership scan is incomplete. Retry before selecting an offered NFT.",
      retryable: true,
    };
  }

  // Complete inventory with owned NFTs → direct eligible (R8 / KTD3).
  if (ownership.ownedIds.length > 0) {
    return {
      status: "direct_eligible",
      canSelectOffered: true,
      canRotate: false,
      ownedIds: ownership.ownedIds,
      message:
        "Select the exact Society NFT you will offer. Approval and rotation stay separate.",
    };
  }

  // No NFT: acquisition readiness requires unit, balance, and skip reads.
  if (!unit || unit.status === "loading" || unit.status === "disconnected") {
    return {
      status: "checking",
      canSelectOffered: false,
      canRotate: false,
      ownedIds: [],
      message: "Checking FAME readiness…",
    };
  }
  if (unit.status === "error") {
    return {
      status: "read_failure",
      canSelectOffered: false,
      canRotate: false,
      ownedIds: [],
      message: "Could not read the FAME unit size. Try again.",
      retryable: true,
    };
  }
  if (unit.data <= 0n) {
    return {
      status: "read_failure",
      canSelectOffered: false,
      canRotate: false,
      ownedIds: [],
      message: "FAME unit size is unavailable or zero.",
      retryable: true,
    };
  }

  if (
    !skipNft ||
    skipNft.status === "loading" ||
    skipNft.status === "disconnected"
  ) {
    return {
      status: "checking",
      canSelectOffered: false,
      canRotate: false,
      ownedIds: [],
      message: "Checking Society NFT generation settings…",
    };
  }
  if (skipNft.status === "error") {
    return {
      status: "read_failure",
      canSelectOffered: false,
      canRotate: false,
      ownedIds: [],
      message: "Could not read getSkipNFT. Try again.",
      retryable: true,
    };
  }

  if (skipNft.data === true) {
    return {
      status: "needs_skip_repair",
      canSelectOffered: false,
      canRotate: false,
      ownedIds: [],
      message:
        "Society NFT generation is disabled for this wallet. Enable it before buying or reconciling FAME.",
    };
  }

  if (
    !fameBalance ||
    fameBalance.status === "loading" ||
    fameBalance.status === "disconnected"
  ) {
    return {
      status: "checking",
      canSelectOffered: false,
      canRotate: false,
      ownedIds: [],
      message: "Checking your FAME balance…",
    };
  }
  if (fameBalance.status === "error") {
    return {
      status: "read_failure",
      canSelectOffered: false,
      canRotate: false,
      ownedIds: [],
      message: "Could not read your FAME balance. Try again.",
      retryable: true,
    };
  }

  if (fameBalance.data < unit.data) {
    const shortfall = unit.data - fameBalance.data;
    return {
      status: "needs_fame",
      canSelectOffered: false,
      canRotate: false,
      ownedIds: [],
      shortfall,
      unit: unit.data,
      balance: fameBalance.data,
      message:
        "You need at least one FAME unit to mint a Society NFT. Buy FAME to cover the shortfall shown — exact-input swaps do not guarantee that fill.",
    };
  }

  return {
    status: "needs_reconciliation",
    canSelectOffered: false,
    canRotate: false,
    ownedIds: [],
    balance: fameBalance.data,
    unit: unit.data,
    message:
      "You hold enough FAME for a Society NFT but none is offered yet. Reconcile with a small self-transfer instead of buying more.",
  };
}
