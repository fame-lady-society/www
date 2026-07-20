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
import type {
  RotatorTransactionAction,
  RotatorTransactionState,
  RotatorTransactionStatus,
} from "../transactionState";

export interface FameRotatorStatusProps {
  state: RotatorTransactionState;
  onRetry?: () => void;
  onRetryVerification?: () => void;
  onReset?: () => void;
}

export interface RotatorStatusCopy {
  title: string;
  detail: string;
  icon: ReactNode;
  /** Assertive live region for failures; polite for in-progress / success. */
  assertive: boolean;
}

function actionLabel(action: RotatorTransactionAction | null): string {
  return action === "approve" ? "approval" : "rotation";
}

/**
 * Map transaction state to status copy and live-region semantics (U7).
 * Idle returns null so the region stays hidden.
 */
export function rotatorTransactionStatusCopy(
  state: RotatorTransactionState,
): RotatorStatusCopy | null {
  const label = actionLabel(state.action);

  switch (state.status) {
    case "idle":
      return null;
    case "simulating":
      return {
        title: `Checking ${label}`,
        detail: "Verifying the request against the latest Base state.",
        icon: <HourglassTopIcon fontSize="small" />,
        assertive: false,
      };
    case "awaiting_wallet":
      return {
        title: "Confirm in your wallet",
        detail: `Review and submit the ${label} request.`,
        icon: <HourglassTopIcon fontSize="small" />,
        assertive: false,
      };
    case "broadcast":
    case "confirming":
      return {
        title: "Transaction submitted",
        detail:
          state.replacement?.reason === "repriced"
            ? "Your updated transaction is waiting for Base confirmation."
            : "Waiting for Base confirmation.",
        icon: <HourglassTopIcon fontSize="small" />,
        assertive: false,
      };
    case "mined_pending_proof":
      return {
        title: "Confirmed on Base — verifying",
        detail:
          state.action === "rotate"
            ? "Checking that you own the target and the offered NFT entered the pool."
            : "Checking that the rotator is authorized for your offered NFT.",
        icon: <HourglassTopIcon fontSize="small" />,
        assertive: false,
      };
    case "verification_pending":
      return {
        title: "Mined — ownership proof pending",
        detail:
          state.error?.message ??
          "The transaction mined, but ownership could not be verified yet. Retry proof without sending another transaction.",
        icon: <HourglassTopIcon fontSize="small" />,
        assertive: false,
      };
    case "verified":
      return {
        title:
          state.action === "approve"
            ? "Approval confirmed"
            : "Rotation confirmed",
        detail:
          state.action === "approve"
            ? "The rotator is authorized. You can rotate when ready."
            : "You own the target and the offered NFT entered the burn pool.",
        icon: <CheckCircleOutlineIcon color="success" fontSize="small" />,
        assertive: false,
      };
    case "refresh_failed_after_verified":
      return {
        title:
          state.action === "approve"
            ? "Approval confirmed — refresh failed"
            : "Rotation confirmed — refresh failed",
        detail:
          state.error?.message ??
          "Ownership was verified, but the latest pool inventory could not be refreshed.",
        icon: <ErrorOutlineIcon color="warning" fontSize="small" />,
        assertive: true,
      };
    case "different_transaction":
      return {
        title: "A different transaction mined",
        detail:
          state.error?.message ??
          "A different transaction mined. It is not attributed as this frozen rotation.",
        icon: <ErrorOutlineIcon color="error" fontSize="small" />,
        assertive: true,
      };
    case "cancelled":
      return {
        title: "Transaction cancelled",
        detail:
          state.error?.message ??
          "The replacement cancelled this transaction.",
        icon: <ErrorOutlineIcon color="error" fontSize="small" />,
        assertive: true,
      };
    case "reverted":
      return {
        title:
          state.error?.kind === "target_not_reached"
            ? "Target not reached"
            : "Transaction reverted",
        detail:
          state.error?.message ??
          "The transaction reverted onchain. Your offered NFT should still be yours.",
        icon: <ErrorOutlineIcon color="error" fontSize="small" />,
        assertive: true,
      };
    case "failed":
      return {
        title: failureTitle(state),
        detail:
          state.error?.message ?? "The transaction could not be completed.",
        icon: <ErrorOutlineIcon color="error" fontSize="small" />,
        assertive: true,
      };
  }
}

function failureTitle(state: RotatorTransactionState): string {
  switch (state.error?.kind) {
    case "wallet_rejected":
      return "Wallet request rejected";
    case "target_not_reached":
      return "Target not reached";
    case "recipient_incompatible":
      return "Recipient cannot receive NFT";
    case "ownership_mismatch":
      return "Ownership did not match";
    case "stale_context":
      return "Context changed";
    case "environment_changed":
      return "Wallet environment changed";
    case "simulation_failed":
      return "Simulation failed";
    default:
      return "Transaction not completed";
  }
}

/** Statuses that use assertive failure live regions. */
export function isRotatorStatusAssertive(
  status: RotatorTransactionStatus,
): boolean {
  return (
    status === "failed" ||
    status === "reverted" ||
    status === "cancelled" ||
    status === "different_transaction" ||
    status === "refresh_failed_after_verified"
  );
}

export function FameRotatorStatus({
  state,
  onRetry,
  onRetryVerification,
  onReset,
}: FameRotatorStatusProps) {
  const copy = rotatorTransactionStatusCopy(state);
  if (!copy) return null;

  const isError = copy.assertive;
  const showVerificationRetry =
    state.status === "verification_pending" && onRetryVerification;
  const showRetry =
    !showVerificationRetry &&
    state.error?.retryable &&
    !state.error.blockRetryWrite &&
    onRetry;
  // Never offer Dismiss while a mined write still needs ownership proof or
  // when blockRetryWrite forbids another mutation (R21 / KTD12).
  const writeBlocked =
    state.error?.blockRetryWrite === true ||
    state.status === "verification_pending" ||
    state.status === "mined_pending_proof";
  const showDismiss = Boolean(onReset) && !writeBlocked;
  const explorerHash = state.effectiveHash ?? state.hash;

  return (
    <Stack
      component="section"
      aria-label="Rotation transaction status"
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
      data-status={state.status}
      data-action={state.action ?? ""}
      data-assertive={isError ? "true" : "false"}
      spacing={1}
      sx={{
        p: 2,
        borderInlineStart: "3px solid",
        borderColor: isError
          ? "error.main"
          : state.status === "verified" ||
              state.status === "refresh_failed_after_verified"
            ? "success.main"
            : "divider",
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
      {explorerHash ? (
        <Typography variant="body2">
          <Link
            href={`${base.blockExplorers.default.url}/tx/${explorerHash}`}
            target="_blank"
            rel="noopener noreferrer"
            underline="hover"
            data-testid="rotator-tx-explorer-link"
          >
            View transaction{" "}
            <OpenInNewIcon sx={{ fontSize: "0.85em", verticalAlign: -1 }} />
          </Link>
        </Typography>
      ) : null}
      {showVerificationRetry || showRetry || showDismiss ? (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {showVerificationRetry ? (
            <Button
              type="button"
              size="small"
              variant="outlined"
              onClick={onRetryVerification}
              sx={{ minHeight: 44 }}
            >
              Retry ownership proof
            </Button>
          ) : null}
          {showRetry ? (
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
          {showDismiss ? (
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
