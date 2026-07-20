"use client";

import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import type { Address, Hash } from "viem";
import { FameSwapWidget } from "@/features/fame-swap/components/FameSwapWidget";
import { formatTokenAmount } from "@/features/fame-swap/solver/format";
import { fameToken } from "@/features/fame-swap/ui/tradeModel";
import { SocietyNftReadinessRailView } from "@/features/society-nft-readiness/components/SocietyNftReadinessRail";
import type { SocietyNftReadinessProjection } from "@/features/society-nft-readiness/state";
import {
  isReadinessTransactionPending,
  reconciliationTransactionStatusCopy,
  type ReadinessTransactionState,
} from "@/features/society-nft-readiness/transactionState";
import {
  fameRotatorAcquisitionBranch,
  shouldOfferBuyMore,
  type FameRotatorAcquisitionBranch,
  useFameRotatorAcquisition,
} from "../hooks/useFameRotatorAcquisition";
import type { FameRotatorPreflight } from "../state";

export interface FameRotatorAcquisitionProps {
  preflight: FameRotatorPreflight;
  /** Refetch preflight/ownership after confirmed recovery — do not assert eligibility. */
  onInvalidate: () => void | Promise<void>;
}

/** Exact shortfall presentation for needs_fame (outside the exact-input widget). */
export function formatFameShortfall(shortfall: bigint): string {
  return formatTokenAmount(shortfall, fameToken());
}

export function fameShortfallRawLabel(shortfall: bigint): string {
  return shortfall.toString();
}

export interface FameRotatorAcquisitionViewProps {
  preflight: FameRotatorPreflight;
  skipRepair: {
    readiness: SocietyNftReadinessProjection;
    transactionState: ReadinessTransactionState;
    onRepair: () => void | Promise<unknown>;
    onRetryDetection: () => void | Promise<unknown>;
    onRetryVerification: () => void | Promise<unknown>;
  } | null;
  reconciliation: {
    transactionState: ReadinessTransactionState;
    onReconcile: () => void | Promise<unknown>;
  } | null;
  onSwapConfirmed?: (payload: { hash: Hash; account: Address }) => void;
  /** When false, omit the live compact widget (tests / static markup). */
  renderCompactSwap?: boolean;
}

/**
 * Pure-view acquisition recovery branches. Does not auto-seed the swap amount
 * and never promises exact-output fill for the shortfall.
 */
export const FameRotatorAcquisitionView: FC<FameRotatorAcquisitionViewProps> = ({
  preflight,
  skipRepair,
  reconciliation,
  onSwapConfirmed,
  renderCompactSwap = true,
}) => {
  const branch = fameRotatorAcquisitionBranch(preflight);
  const offerBuyMore = shouldOfferBuyMore(preflight);

  if (branch === "hidden") {
    return null;
  }

  if (branch === "skip_repair" && skipRepair) {
    return (
      <Stack
        component="section"
        aria-label="Society NFT generation repair"
        spacing={2}
        data-acquisition-branch="skip_repair"
        data-offer-buy-more={offerBuyMore ? "true" : "false"}
      >
        <Typography variant="body2" color="text.secondary">
          {preflight.message}
        </Typography>
        <SocietyNftReadinessRailView
          readiness={skipRepair.readiness}
          transactionState={skipRepair.transactionState}
          onRepair={skipRepair.onRepair}
          onRetryDetection={skipRepair.onRetryDetection}
          onRetryVerification={skipRepair.onRetryVerification}
        />
      </Stack>
    );
  }

  if (branch === "buy_fame" && preflight.status === "needs_fame") {
    const shortfallLabel = formatFameShortfall(preflight.shortfall);
    const rawShortfall = fameShortfallRawLabel(preflight.shortfall);

    return (
      <Stack
        component="section"
        aria-label="Buy FAME shortfall"
        spacing={2}
        data-acquisition-branch="buy_fame"
        data-offer-buy-more={offerBuyMore ? "true" : "false"}
        data-shortfall={rawShortfall}
        data-auto-seed="false"
        data-exact-output-guaranteed="false"
      >
        <Stack spacing={0.75}>
          <Typography variant="h6" fontWeight={700}>
            FAME shortfall
          </Typography>
          <Typography variant="body1" fontWeight={700} data-testid="fame-shortfall">
            {shortfallLabel}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Exact shortfall (wei):{" "}
            <Typography
              component="span"
              variant="body2"
              fontFamily="monospace"
              data-testid="fame-shortfall-raw"
            >
              {rawShortfall}
            </Typography>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {preflight.message}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Exact-input swaps do not guarantee this fill. Enter an amount you
            choose — the widget is not auto-seeded to the shortfall.
          </Typography>
        </Stack>

        {renderCompactSwap ? (
          <FameSwapWidget
            mode="compact"
            onSwapConfirmed={onSwapConfirmed}
          />
        ) : (
          <Typography
            variant="caption"
            color="text.secondary"
            data-compact-swap-placeholder="true"
          >
            Compact buy-FAME widget
          </Typography>
        )}
      </Stack>
    );
  }

  if (branch === "reconciliation" && preflight.status === "needs_reconciliation") {
    const recon = reconciliation;
    const pending = recon
      ? isReadinessTransactionPending(recon.transactionState)
      : false;
    const statusCopy = recon
      ? reconciliationTransactionStatusCopy(recon.transactionState)
      : null;

    return (
      <Stack
        component="section"
        aria-label="Society NFT reconciliation"
        spacing={2}
        data-acquisition-branch="reconciliation"
        data-offer-buy-more={offerBuyMore ? "true" : "false"}
        sx={{
          borderInlineStart: "4px solid",
          borderColor: "info.main",
          pl: 2,
          py: 1,
        }}
      >
        <Typography variant="h6" fontWeight={700}>
          Reconcile Society NFT generation
        </Typography>
        <Typography variant="body2">{preflight.message}</Typography>
        <Typography variant="body2" color="text.secondary">
          You already hold at least one FAME unit. Transfer 1 wei of FAME to
          yourself to trigger generation — do not buy more FAME.
        </Typography>
        {recon ? (
          <>
            <Button
              type="button"
              variant="contained"
              disabled={pending}
              onClick={() => {
                void recon.onReconcile();
              }}
              sx={{ minHeight: 44, alignSelf: "flex-start", fontWeight: 700 }}
            >
              {recon.transactionState.status === "error"
                ? "Try 1 wei transfer again"
                : "Transfer 1 wei to myself"}
            </Button>
            {statusCopy ? (
              <Stack
                component="section"
                aria-label="Society NFT reconciliation status"
                role={
                  recon.transactionState.status === "error" ? "alert" : "status"
                }
                spacing={0.5}
                sx={{
                  borderInlineStart: "3px solid",
                  borderColor:
                    recon.transactionState.status === "error"
                      ? "error.main"
                      : "divider",
                  pl: 1.5,
                }}
              >
                <Typography variant="body2" fontWeight={700}>
                  {statusCopy.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {statusCopy.detail}
                </Typography>
              </Stack>
            ) : null}
          </>
        ) : null}
      </Stack>
    );
  }

  return null;
};

/**
 * Live acquisition recovery for no-NFT wallets.
 * Swap / repair / reconciliation remain independent from approval and rotation.
 */
export const FameRotatorAcquisition: FC<FameRotatorAcquisitionProps> = ({
  preflight,
  onInvalidate,
}) => {
  const acquisition = useFameRotatorAcquisition({
    preflight,
    onInvalidate,
  });

  return (
    <FameRotatorAcquisitionView
      preflight={preflight}
      skipRepair={acquisition.skipRepair}
      reconciliation={acquisition.reconciliation}
      onSwapConfirmed={acquisition.handleSwapConfirmed}
      renderCompactSwap
    />
  );
};

export type { FameRotatorAcquisitionBranch };
