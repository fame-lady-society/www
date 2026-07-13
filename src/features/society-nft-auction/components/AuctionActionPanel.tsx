import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { FormEvent, ReactNode } from "react";
import { formatEther } from "viem";
import { bidExceedsBalance } from "../state";
import type { AuctionActiveProjection, AuctionEndedProjection } from "../types";

export type AuctionActionWalletStatus =
  | "disconnected"
  | "wrong_chain"
  | "checking"
  | "blocked"
  | "ready";

export interface AuctionActionPanelProps {
  projection: AuctionActiveProjection | AuctionEndedProjection;
  bidValue?: string;
  bidError?: string | null;
  balanceWei?: bigint | null;
  walletStatus: AuctionActionWalletStatus;
  walletMessage: string;
  walletControl?: ReactNode;
  canBid: boolean;
  canSettle: boolean;
  isPending: boolean;
  isRefreshing: boolean;
  onBidValueChange?: (value: string) => void;
  onBid?: () => void;
  onSettle?: () => void;
}

export function formatAuctionBalance(balanceWei: bigint): string {
  const [whole, fraction = ""] = formatEther(balanceWei).split(".");
  const truncatedFraction = fraction.padEnd(4, "0").slice(0, 4);
  if (balanceWei > 0n && whole === "0" && truncatedFraction === "0000") {
    return "<0.0001";
  }
  return `${whole}.${truncatedFraction}`;
}

function WalletBoundary({
  walletStatus,
  walletMessage,
  walletControl,
}: Pick<
  AuctionActionPanelProps,
  "walletStatus" | "walletMessage" | "walletControl"
>) {
  if (walletStatus === "ready") return null;

  return (
    <Stack spacing={1.25}>
      <Typography
        role={walletStatus === "blocked" ? "alert" : "status"}
        aria-live={walletStatus === "blocked" ? "assertive" : "polite"}
        variant="body2"
        color={walletStatus === "blocked" ? "error.main" : "text.secondary"}
      >
        {walletMessage}
      </Typography>
      {walletControl}
    </Stack>
  );
}

export function AuctionActionPanel({
  projection,
  bidValue = "",
  bidError = null,
  balanceWei = null,
  walletStatus,
  walletMessage,
  walletControl,
  canBid,
  canSettle,
  isPending,
  isRefreshing,
  onBidValueChange,
  onBid,
  onSettle,
}: AuctionActionPanelProps) {
  const actionPaused = isPending || isRefreshing;

  if (projection.kind === "ended_unsettled") {
    const settleDisabled =
      !canSettle || walletStatus !== "ready" || actionPaused;
    const submitSettle = (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      onSettle?.();
    };

    return (
      <Paper
        component="section"
        aria-labelledby="auction-action-heading"
        variant="outlined"
        sx={{ p: { xs: 2.5, sm: 3 }, borderRadius: 1 }}
      >
        <Stack component="form" spacing={2} onSubmit={submitSettle}>
          <div>
            <Typography id="auction-action-heading" component="h2" variant="h5">
              Close the auction
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.75 }}>
              Bidding has ended. Anyone can complete the auction.
            </Typography>
          </div>

          <WalletBoundary
            walletStatus={walletStatus}
            walletMessage={walletMessage}
            walletControl={walletControl}
          />

          <Button
            type="submit"
            disabled={settleDisabled}
            sx={{ minHeight: 48, fontWeight: 700 }}
          >
            {isPending ? "Settling auction…" : "Settle auction"}
          </Button>
        </Stack>
      </Paper>
    );
  }

  const submitBid = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onBid?.();
  };
  const bidDisabled =
    !canBid ||
    walletStatus !== "ready" ||
    Boolean(bidError) ||
    bidValue.trim().length === 0 ||
    actionPaused;
  const balanceExceeded = bidExceedsBalance(bidValue, balanceWei);
  const balanceLabel =
    balanceWei === null
      ? "Native ETH on Base"
      : `Balance: ${formatAuctionBalance(balanceWei)} ETH`;
  const helperText = bidError ? `${bidError} · ${balanceLabel}` : balanceLabel;

  return (
    <Paper
      component="section"
      aria-labelledby="auction-action-heading"
      variant="outlined"
      sx={{
        p: { xs: 2.5, sm: 3 },
        borderRadius: 1,
      }}
    >
      <Stack component="form" spacing={2} onSubmit={submitBid} noValidate>
        <div>
          <Typography id="auction-action-heading" component="h2" variant="h5">
            Place a bid
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.75 }}>
            Enter an amount above the current highest bid.
          </Typography>
        </div>

        <TextField
          id="society-nft-auction-bid"
          name="bidAmount"
          label="Bid amount in ETH"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={bidValue}
          onChange={(event) => onBidValueChange?.(event.target.value)}
          error={Boolean(bidError) || balanceExceeded}
          helperText={helperText}
          disabled={actionPaused || !canBid}
          fullWidth
          inputProps={{
            "aria-describedby": "society-nft-auction-bid-help",
          }}
          FormHelperTextProps={{
            id: "society-nft-auction-bid-help",
          }}
        />

        <WalletBoundary
          walletStatus={walletStatus}
          walletMessage={walletMessage}
          walletControl={walletControl}
        />

        {isRefreshing ? (
          <Typography
            role="status"
            aria-live="polite"
            variant="body2"
            color="text.secondary"
          >
            Updating the latest bid before actions resume.
          </Typography>
        ) : null}

        <Button
          type="submit"
          disabled={bidDisabled}
          sx={{ minHeight: 48, fontWeight: 700 }}
        >
          {isPending ? "Submitting bid…" : "Bid with ETH"}
        </Button>
      </Stack>
    </Paper>
  );
}
