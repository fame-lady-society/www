"use client";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";
import { TransactionsModal } from "@/components/TransactionsModal";
import { displaySafeErrorMessage } from "@/features/fame-swap/solver/diagnostics";
import { formatTestAmount } from "../format";
import { useGalleryAdminAction } from "../hooks/useGalleryAdminAction";
import {
  isGalleryAdminActionBusy,
  parseGalleryFee,
  parseGalleryFeeRecipient,
  type GalleryAdminState,
} from "../transactions/adminAction";
import type {
  GalleryAdminCall,
  GalleryGlobalState,
  GalleryHookProjection,
} from "../types";

export const PRIMARY_GALLERY_ADMIN_ACTIONS = [
  "set_community_fee",
  "set_provider_fee",
  "set_fee_recipient",
  "pause",
  "unpause",
] as const;

function adminStatusCopy(state: GalleryAdminState) {
  switch (state.status) {
    case "idle":
      return "Choose a marketplace action.";
    case "switching_chain":
      return "Switching to Base Sepolia…";
    case "simulating":
      return "Checking the exact marketplace action with the contract…";
    case "awaiting_wallet":
      return "Confirm the marketplace action in your wallet.";
    case "confirming":
      return "Waiting for one Base Sepolia confirmation…";
    case "confirmed":
      return "Marketplace action confirmed and canonical state refreshed.";
    case "confirmed_refreshing":
      return "Marketplace action confirmed, but canonical state could not be refreshed yet.";
    case "error":
      return state.failure
        ? displaySafeErrorMessage(state.failure.cause)
        : "The marketplace action failed.";
  }
}

function CurrentValue({ children }: { children: React.ReactNode }) {
  return (
    <Typography color="text.secondary" sx={{ overflowWrap: "anywhere" }}>
      Current: {children}
    </Typography>
  );
}

export function MarketplaceLifecycleControl({
  paused,
  busy,
  onToggle,
}: {
  paused: boolean | null;
  busy: boolean;
  onToggle: (call: { kind: "pause" } | { kind: "unpause" }) => void;
}) {
  const nextCall = paused
    ? ({ kind: "unpause" } as const)
    : ({ kind: "pause" } as const);

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 3 } }}>
      <Stack spacing={2}>
        <div>
          <Typography component="h2" variant="h5">
            Marketplace lifecycle
          </Typography>
          <CurrentValue>
            {paused === null ? "unavailable" : paused ? "Paused" : "Live"}
          </CurrentValue>
        </div>
        <Button
          type="button"
          variant="contained"
          disabled={busy || paused === null}
          onClick={() => onToggle(nextCall)}
          sx={{ minHeight: 44, alignSelf: "flex-start" }}
        >
          {paused === null
            ? "Pause / unpause marketplace"
            : paused
              ? "Unpause marketplace"
              : "Pause marketplace"}
        </Button>
      </Stack>
    </Paper>
  );
}

function MarketplaceFeeControl({
  title,
  inputLabel,
  current,
  busy,
  onSubmit,
}: {
  title: string;
  inputLabel: string;
  current: bigint | null;
  busy: boolean;
  onSubmit: (fee: bigint) => void;
}) {
  const [input, setInput] = useState("");
  return (
    <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 3 } }}>
      <Stack
        component="form"
        spacing={2}
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(parseGalleryFee(input));
        }}
      >
        <div>
          <Typography component="h2" variant="h5">
            {title}
          </Typography>
          <CurrentValue>
            {current === null
              ? "unavailable"
              : `${formatTestAmount(current)} TEST`}
          </CurrentValue>
        </div>
        <TextField
          required
          label={inputLabel}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          inputProps={{ inputMode: "decimal" }}
        />
        <Button
          type="submit"
          variant="contained"
          disabled={busy}
          sx={{ minHeight: 44, alignSelf: "flex-start" }}
        >
          Set fee
        </Button>
      </Stack>
    </Paper>
  );
}

export function AdminMarketActions({
  global,
  refreshGlobal,
}: {
  global: GalleryHookProjection<GalleryGlobalState>;
  refreshGlobal: () => Promise<void>;
}) {
  const [feeRecipientInput, setFeeRecipientInput] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const transaction = useGalleryAdminAction({
    refresh: async (_call: GalleryAdminCall) => refreshGlobal(),
  });
  const busy = isGalleryAdminActionBusy(transaction.state);
  const canonical = global.status === "success" ? global.data : null;

  useEffect(() => {
    if (!feeRecipientInput && canonical) {
      setFeeRecipientInput(canonical.feeRecipient);
    }
  }, [canonical, feeRecipientInput]);

  const run = (build: () => GalleryAdminCall) => {
    setActionError(null);
    try {
      void transaction.submit(build());
    } catch (error) {
      setActionError(error instanceof Error ? error.message : String(error));
    }
  };

  const transactionTerminal =
    transaction.state.status === "confirmed" ||
    transaction.state.status === "confirmed_refreshing" ||
    transaction.state.status === "error";

  return (
    <Stack spacing={3}>
      <MarketplaceLifecycleControl
        paused={canonical?.paused ?? null}
        busy={busy}
        onToggle={(call) => run(() => call)}
      />

      <MarketplaceFeeControl
        title="Community premium portion"
        inputLabel="Proposed community fee in TEST"
        current={canonical?.communityFee ?? null}
        busy={busy}
        onSubmit={(fee) => run(() => ({ kind: "set_community_fee", fee }))}
      />

      <MarketplaceFeeControl
        title="Provider premium portion"
        inputLabel="Proposed provider fee in TEST"
        current={canonical?.providerFee ?? null}
        busy={busy}
        onSubmit={(fee) => run(() => ({ kind: "set_provider_fee", fee }))}
      />

      <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 3 } }}>
        <Stack
          component="form"
          spacing={2}
          onSubmit={(event) => {
            event.preventDefault();
            run(() => ({
              kind: "set_fee_recipient",
              feeRecipient: parseGalleryFeeRecipient(feeRecipientInput),
            }));
          }}
        >
          <div>
            <Typography component="h2" variant="h5">
              Fee recipient
            </Typography>
            <CurrentValue>
              {canonical?.feeRecipient ?? "unavailable"}
            </CurrentValue>
          </div>
          <TextField
            required
            label="Proposed fee recipient"
            value={feeRecipientInput}
            onChange={(event) => setFeeRecipientInput(event.target.value)}
            inputProps={{ autoComplete: "off", spellCheck: false }}
          />
          <Button
            type="submit"
            variant="contained"
            disabled={busy}
            sx={{ minHeight: 44, alignSelf: "flex-start" }}
          >
            Set fee recipient
          </Button>
        </Stack>
      </Paper>

      {actionError ? (
        <Alert severity="error" role="alert">
          {actionError}
        </Alert>
      ) : null}

      {transaction.state.status !== "idle" && !transaction.modalOpen ? (
        <Button
          variant="outlined"
          onClick={() => transaction.setModalOpen(true)}
          sx={{ minHeight: 44, alignSelf: "flex-start" }}
        >
          View admin transaction
        </Button>
      ) : null}

      <TransactionsModal
        open={transaction.modalOpen}
        onClose={() => transaction.setModalOpen(false)}
        transactions={
          transaction.transaction ? [transaction.transaction] : undefined
        }
        onTransactionConfirmed={() => undefined}
        topContent={
          <Stack spacing={2} sx={{ mb: 2 }}>
            <Alert
              role={transaction.state.status === "error" ? "alert" : "status"}
              aria-live={
                transaction.state.status === "error" ? "assertive" : "polite"
              }
              severity={
                transaction.state.status === "error"
                  ? "error"
                  : transaction.state.status === "confirmed_refreshing"
                    ? "warning"
                    : transaction.state.status === "confirmed"
                      ? "success"
                      : "info"
              }
            >
              {adminStatusCopy(transaction.state)}
            </Alert>
            {transaction.state.status === "confirmed_refreshing" ? (
              <Button
                variant="contained"
                disabled={transaction.isRetryingRefresh}
                onClick={() => void transaction.retryRefresh()}
                sx={{ minHeight: 44 }}
              >
                {transaction.isRetryingRefresh
                  ? "Refreshing…"
                  : "Retry refresh"}
              </Button>
            ) : null}
            {transactionTerminal ? (
              <Button
                variant="outlined"
                disabled={transaction.isRetryingRefresh}
                onClick={() => {
                  transaction.reset();
                  transaction.setModalOpen(false);
                }}
                sx={{ minHeight: 44 }}
              >
                Done
              </Button>
            ) : null}
          </Stack>
        }
      />

      <Divider />
      <Typography variant="caption" color="text.secondary">
        Contract simulation decides whether each owner action is valid.
      </Typography>
    </Stack>
  );
}
