import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";
import { base } from "viem/chains";
import type { AuctionTransactionState } from "../transactionState";

export interface AuctionTransactionStatusProps {
  state: AuctionTransactionState;
  onRetry?: () => void;
  onReset?: () => void;
}

interface TransactionStatusCopy {
  title: string;
  detail: string;
  icon: ReactNode;
}

export function auctionTransactionStatusCopy(
  state: AuctionTransactionState,
): TransactionStatusCopy | null {
  const action = state.action === "settle" ? "settlement" : "bid";

  switch (state.status) {
    case "idle":
      return null;
    case "simulating":
      return {
        title: `Checking ${action}`,
        detail: "Verifying the request against the latest auction state.",
        icon: <HourglassTopIcon fontSize="small" />,
      };
    case "awaiting_wallet":
      return {
        title: "Confirm in your wallet",
        detail: `Review and submit the ${action} request.`,
        icon: <HourglassTopIcon fontSize="small" />,
      };
    case "confirming":
      return {
        title: "Transaction submitted",
        detail:
          state.replacement?.reason === "repriced"
            ? "Your updated transaction is waiting for Base confirmation."
            : "Waiting for Base confirmation.",
        icon: <HourglassTopIcon fontSize="small" />,
      };
    case "refreshing":
      return {
        title: "Confirmed on Base",
        detail: "Refreshing the auction before showing the result.",
        icon: <HourglassTopIcon fontSize="small" />,
      };
    case "confirmed":
      return {
        title: state.action === "settle" ? "Auction settled" : "Bid confirmed",
        detail: "The auction state is up to date.",
        icon: <CheckCircleOutlineIcon color="success" fontSize="small" />,
      };
    case "error":
      return {
        title: "Transaction not completed",
        detail:
          state.error?.message ?? "The transaction could not be completed.",
        icon: <ErrorOutlineIcon color="error" fontSize="small" />,
      };
  }
}

export function AuctionTransactionStatus({
  state,
  onRetry,
  onReset,
}: AuctionTransactionStatusProps) {
  const copy = auctionTransactionStatusCopy(state);
  if (!copy) return null;

  const isError = state.status === "error";

  return (
    <Stack
      component="section"
      aria-label="Transaction status"
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
      spacing={1}
      sx={{
        p: 2,
        borderInlineStart: "3px solid",
        borderColor: isError ? "error.main" : "divider",
        backgroundColor: "action.hover",
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center">
        {copy.icon}
        <Typography fontWeight={700}>{copy.title}</Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary">
        {copy.detail}
      </Typography>
      {state.hash ? (
        <Typography variant="body2">
          <Link
            href={`${base.blockExplorers.default.url}/tx/${state.hash}`}
            target="_blank"
            rel="noopener noreferrer"
            underline="hover"
          >
            View transaction{" "}
            <OpenInNewIcon sx={{ fontSize: "0.85em", verticalAlign: -1 }} />
          </Link>
        </Typography>
      ) : null}
      {isError ? (
        <Stack direction="row" spacing={1}>
          {state.error?.retryable && onRetry ? (
            <Button
              type="button"
              size="small"
              variant="outlined"
              onClick={onRetry}
              sx={{ minHeight: 44 }}
            >
              Try again
            </Button>
          ) : null}
          {onReset ? (
            <Button
              type="button"
              size="small"
              color="inherit"
              onClick={onReset}
              sx={{ minHeight: 44 }}
            >
              Dismiss
            </Button>
          ) : null}
        </Stack>
      ) : null}
    </Stack>
  );
}
