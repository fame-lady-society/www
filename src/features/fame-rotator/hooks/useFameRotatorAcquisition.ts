"use client";

import { useCallback, useEffect, useRef } from "react";
import type { Address, Hash } from "viem";
import type { SocietyNftReadinessRailViewProps } from "@/features/society-nft-readiness/components/SocietyNftReadinessRail";
import { useSocietyNftReadiness } from "@/features/society-nft-readiness/hooks/useSocietyNftReadiness";
import { useSocietyNftReconciliation } from "@/features/society-nft-readiness/hooks/useSocietyNftReconciliation";
import type { VerifiedRepairProjection } from "@/features/society-nft-readiness/state";
import {
  isReadinessTransactionPending,
  type ReadinessTransactionState,
  type ReadinessTransactionStatus,
} from "@/features/society-nft-readiness/transactionState";
import type {
  FameRotatorPreflight,
  FameRotatorPreflightStatus,
} from "../state";

export type FameRotatorAcquisitionBranch =
  | "hidden"
  | "skip_repair"
  | "buy_fame"
  | "reconciliation";

/**
 * Map preflight status to the acquisition recovery branch.
 * Approval/rotation state is intentionally out of scope — acquisition stays independent.
 */
export function fameRotatorAcquisitionBranch(
  preflight: Pick<FameRotatorPreflight, "status">,
): FameRotatorAcquisitionBranch {
  switch (preflight.status) {
    case "needs_skip_repair":
      return "skip_repair";
    case "needs_fame":
      return "buy_fame";
    case "needs_reconciliation":
      return "reconciliation";
    default:
      return "hidden";
  }
}

/** "Buy more" is only offered for a real FAME shortfall. */
export function shouldOfferBuyMore(
  preflight: Pick<FameRotatorPreflight, "status">,
): boolean {
  return preflight.status === "needs_fame";
}

/**
 * Skip repair may advance only after the readiness transaction is confirmed and
 * canonical readback verifies getSkipNFT == false (verifiedRepair.status === "verified").
 */
export function shouldInvalidateAfterSkipRepair(input: {
  preflightStatus: FameRotatorPreflightStatus;
  transactionStatus: ReadinessTransactionStatus;
  verifiedRepair: Pick<VerifiedRepairProjection, "status">;
  transactionHash: Hash | null;
}): boolean {
  return (
    input.preflightStatus === "needs_skip_repair" &&
    input.transactionStatus === "confirmed" &&
    input.verifiedRepair.status === "verified" &&
    input.transactionHash !== null
  );
}

export function shouldInvalidateAfterReconciliation(input: {
  preflightStatus: FameRotatorPreflightStatus;
  transactionStatus: ReadinessTransactionStatus;
  transactionHash: Hash | null;
}): boolean {
  return (
    input.preflightStatus === "needs_reconciliation" &&
    input.transactionStatus === "confirmed" &&
    input.transactionHash !== null
  );
}

export function nextAcquisitionInvalidateKey(
  lastKey: string | null,
  candidateKey: string | null,
): string | null {
  if (!candidateKey || candidateKey === lastKey) return null;
  return candidateKey;
}

export function acquisitionInvalidateKey(
  kind: "repair" | "reconciliation" | "swap",
  hash: Hash,
  account: Address,
): string {
  return `${kind}:${account.toLowerCase()}:${hash}`;
}

export interface UseFameRotatorAcquisitionInput {
  preflight: FameRotatorPreflight;
  /** Parent refetch of ownership, balance, unit, and skip — never asserts eligibility. */
  onInvalidate: () => void | Promise<void>;
}

export interface UseFameRotatorAcquisitionResult {
  branch: FameRotatorAcquisitionBranch;
  /** Whether the UI may recommend buying FAME. */
  offerBuyMore: boolean;
  skipRepair: {
    readiness: SocietyNftReadinessRailViewProps["readiness"];
    transactionState: ReadinessTransactionState;
    onRepair: () => void | Promise<unknown>;
    onRetryDetection: () => void | Promise<unknown>;
    onRetryVerification: () => void | Promise<unknown>;
    isPending: boolean;
  } | null;
  reconciliation: {
    transactionState: ReadinessTransactionState;
    onReconcile: () => void | Promise<unknown>;
    isPending: boolean;
  } | null;
  handleSwapConfirmed: (payload: { hash: Hash; account: Address }) => void;
}

/**
 * Thin orchestration: preflight branch → repair / compact-swap / reconciliation,
 * then invalidate preflight after confirmed recovery. Does not touch approval or rotation state.
 */
export function useFameRotatorAcquisition({
  preflight,
  onInvalidate,
}: UseFameRotatorAcquisitionInput): UseFameRotatorAcquisitionResult {
  const branch = fameRotatorAcquisitionBranch(preflight);
  const offerBuyMore = shouldOfferBuyMore(preflight);
  const lastInvalidateKey = useRef<string | null>(null);

  const {
    readiness,
    transactionState: repairTransactionState,
    verifiedRepair,
    repair,
    retryDetection,
    retryVerification,
  } = useSocietyNftReadiness();

  const {
    transactionState: reconciliationTransactionState,
    selfTransfer,
  } = useSocietyNftReconciliation();

  const requestInvalidate = useCallback(
    (key: string) => {
      const next = nextAcquisitionInvalidateKey(lastInvalidateKey.current, key);
      if (!next) return;
      lastInvalidateKey.current = next;
      void onInvalidate();
    },
    [onInvalidate],
  );

  // After verified skip repair (getSkipNFT == false), refetch preflight only.
  useEffect(() => {
    if (
      !shouldInvalidateAfterSkipRepair({
        preflightStatus: preflight.status,
        transactionStatus: repairTransactionState.status,
        verifiedRepair,
        transactionHash: repairTransactionState.hash,
      })
    ) {
      return;
    }

    const hash = repairTransactionState.hash;
    if (!hash) return;

    // Account is not required for the key uniqueness of repair hashes; use zero-pad
    // when unknown would be wrong — readiness always has a hash after confirm.
    requestInvalidate(`repair:${hash}`);
  }, [
    preflight.status,
    repairTransactionState.hash,
    repairTransactionState.status,
    requestInvalidate,
    verifiedRepair,
  ]);

  // After confirmed reconciliation, refetch preflight only.
  useEffect(() => {
    if (
      !shouldInvalidateAfterReconciliation({
        preflightStatus: preflight.status,
        transactionStatus: reconciliationTransactionState.status,
        transactionHash: reconciliationTransactionState.hash,
      })
    ) {
      return;
    }

    const hash = reconciliationTransactionState.hash;
    if (!hash) return;
    requestInvalidate(`reconciliation:${hash}`);
  }, [
    preflight.status,
    reconciliationTransactionState.hash,
    reconciliationTransactionState.status,
    requestInvalidate,
  ]);

  const handleSwapConfirmed = useCallback(
    (payload: { hash: Hash; account: Address }) => {
      if (preflight.status !== "needs_fame") return;
      requestInvalidate(
        acquisitionInvalidateKey("swap", payload.hash, payload.account),
      );
    },
    [preflight.status, requestInvalidate],
  );

  return {
    branch,
    offerBuyMore,
    skipRepair:
      branch === "skip_repair"
        ? {
            readiness:
              readiness.status === "affected" || readiness.status === "error"
                ? readiness
                : { status: "affected" },
            transactionState: repairTransactionState,
            onRepair: repair,
            onRetryDetection: retryDetection,
            onRetryVerification: retryVerification,
            isPending: isReadinessTransactionPending(repairTransactionState),
          }
        : null,
    reconciliation:
      branch === "reconciliation"
        ? {
            transactionState: reconciliationTransactionState,
            onReconcile: selfTransfer,
            isPending: isReadinessTransactionPending(
              reconciliationTransactionState,
            ),
          }
        : null,
    handleSwapConfirmed,
  };
}

