"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ConnectKitButton } from "connectkit";
import { parseUnits } from "viem";
import { base } from "viem/chains";
import { useChainId, useSwitchChain } from "wagmi";
import type { FC } from "react";
import { useCallback, useMemo, useState } from "react";
import { useAccount } from "@/hooks/useAccount";
import { getFameSwapConfig } from "../config";
import { useFameSwapReadiness } from "../hooks/useFameSwapReadiness";
import { useFameSwapTransaction } from "../hooks/useFameSwapTransaction";
import {
  FAME_SWAP_TOKENS,
  FAME,
  USDC,
  tokenForAddress,
  type FameSwapToken,
} from "../tokens";
import { formatTokenAmount } from "../solver/format";
import { quoteFameSwap } from "../solver/quote";
import type { FameSwapQuote } from "../solver/types";
import { fameSwapWidgetState } from "../state";
import { RouteDiagnostics } from "./RouteDiagnostics";
import { FameSwapAmountField } from "./SwapAmountField";
import { FameSwapTokenSelect } from "./TokenSelect";

export type FameSwapWidgetMode = "full" | "compact";

export interface FameSwapWidgetProps {
  mode?: FameSwapWidgetMode;
}

const fallbackLinks = [
  {
    label: "Uniswap",
    href: "https://web.uniswap.org/",
  },
  {
    label: "Aerodrome",
    href: "https://aerodrome.finance/",
  },
] as const;

function parseAmount(value: string, token: FameSwapToken): bigint | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const parsed = parseUnits(trimmed, token.decimals);
    return parsed > 0n ? parsed : null;
  } catch {
    return null;
  }
}

function tokenByAddressOrFallback(address: FameSwapToken["address"]) {
  return tokenForAddress(address) ?? FAME_SWAP_TOKENS[0];
}

export function quoteSummary(quote: FameSwapQuote | null): string {
  if (!quote) return "Select a pair and enter an amount.";

  switch (quote.status) {
    case "ready":
      return "Minimum after fee: pending wallet simulation.";
    case "not_live_ready":
      return quote.readiness.message;
    case "stale_artifact":
      return quote.reason;
    case "unsupported":
      return "This pair is not in the pinned FAME route set.";
  }
}

function alertSeverity(
  stateKind: ReturnType<typeof fameSwapWidgetState>["kind"],
) {
  if (stateKind === "ready" || stateKind === "confirmed") return "success";
  if (stateKind === "reverted") return "error";
  if (
    stateKind === "not_live_ready" ||
    stateKind === "stale_artifact" ||
    stateKind === "quote_expired"
  ) {
    return "warning";
  }
  return "info";
}

export const FameSwapWidget: FC<FameSwapWidgetProps> = ({ mode = "full" }) => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain();
  const config = useMemo(() => getFameSwapConfig(), []);
  const { readiness, isChecking: readinessChecking } =
    useFameSwapReadiness(config);
  const [tokenIn, setTokenIn] = useState<FameSwapToken>(
    tokenByAddressOrFallback(FAME),
  );
  const [tokenOut, setTokenOut] = useState<FameSwapToken>(
    tokenByAddressOrFallback(USDC),
  );
  const [amount, setAmount] = useState("");
  const compact = mode === "compact";
  const onBase = chainId === base.id;

  const parsedAmount = useMemo(
    () => parseAmount(amount, tokenIn),
    [amount, tokenIn],
  );

  const quote = useMemo(() => {
    if (parsedAmount === null) return null;
    return quoteFameSwap({
      tokenIn,
      tokenOut,
      amountIn: parsedAmount,
      recipient: address ?? null,
      config,
      readiness,
    });
  }, [address, config, parsedAmount, readiness, tokenIn, tokenOut]);

  const transaction = useFameSwapTransaction(quote);

  const state = fameSwapWidgetState({
    connected: isConnected,
    onBase,
    amountEntered: parsedAmount !== null,
    quoteStatus: quote?.status ?? null,
    quoteExpired: transaction.quoteExpired,
    approvalRequired:
      quote?.status === "ready" &&
      quote.approval !== null &&
      !transaction.approvalConfirmed,
    submitting: transaction.submitting || isSwitchingChain,
    confirmed: transaction.swapConfirmed,
    reverted: transaction.reverted,
    compact,
  });

  const primaryDisabled =
    state.ctaDisabled ||
    isSwitchingChain ||
    transaction.submitting ||
    (state.kind === "approval_needed" && !transaction.canApprove) ||
    (state.kind === "ready" && !transaction.canSwap);

  const primaryLabel = readinessChecking
    ? "Checking router"
    : isSwitchingChain
      ? "Switching"
      : state.ctaLabel;

  const handlePrimaryAction = useCallback(() => {
    if (!isConnected) return;
    if (!onBase) {
      switchChain({ chainId: base.id });
      return;
    }

    if (state.kind === "approval_needed") {
      void transaction.submitApproval();
      return;
    }

    if (state.kind === "ready") {
      void transaction.submitSwap();
    }
  }, [isConnected, onBase, state.kind, switchChain, transaction]);

  const summaryText =
    quote?.status === "ready" && transaction.protectedMinimum !== null
      ? `Protected minimum after fee: ${formatTokenAmount(
          transaction.protectedMinimum,
          quote.tokenOut,
        )}`
      : quoteSummary(quote);

  return (
    <Box
      component="section"
      aria-labelledby="fame-swap-heading"
      sx={{
        width: "100%",
        maxWidth: compact ? 480 : 760,
        mx: "auto",
        px: { xs: 2, sm: 3 },
        py: { xs: 3, sm: 4 },
      }}
    >
      <Stack spacing={2.5}>
        <div>
          <Typography id="fame-swap-heading" variant={compact ? "h5" : "h4"}>
            FAME swap
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            Live Base routes through the FAME router with wallet simulation
            before submit.
          </Typography>
        </div>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <FameSwapTokenSelect
            id="fame-swap-token-in"
            label="Sell"
            value={tokenIn}
            disabled={state.tokenSelectDisabled}
            onChange={setTokenIn}
          />
          <FameSwapTokenSelect
            id="fame-swap-token-out"
            label="Buy"
            value={tokenOut}
            disabled={state.tokenSelectDisabled}
            onChange={setTokenOut}
          />
        </Stack>

        <FameSwapAmountField
          value={amount}
          token={tokenIn}
          disabled={state.amountDisabled}
          onChange={setAmount}
        />

        <Alert severity={alertSeverity(state.kind)}>
          <Typography fontWeight={700}>{state.title}</Typography>
          <Typography variant="body2">{state.message}</Typography>
          <Typography variant="body2" sx={{ mt: 0.75 }}>
            {summaryText}
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.75 }}>
            {state.recoveryAction}
          </Typography>
          {transaction.error ? (
            <Typography variant="body2" sx={{ mt: 0.75 }}>
              {transaction.error.message}
            </Typography>
          ) : null}
        </Alert>

        {quote?.status === "ready" ? (
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip
              label={`Input ${formatTokenAmount(quote.requestedAmountIn, tokenIn)}`}
            />
            <Chip
              label={
                quote.approval
                  ? `Approve ${formatTokenAmount(quote.approval.amount, tokenIn)}`
                  : `Value ${formatTokenAmount(quote.callValue, tokenIn)}`
              }
            />
            <Chip label={`Fee ${quote.feePpm.toString()} ppm`} />
            <Chip label={`Slippage ${quote.slippageBps / 100}%`} />
            {transaction.simulatedOutput !== null ? (
              <Chip
                label={`Sim ${formatTokenAmount(
                  transaction.simulatedOutput,
                  quote.tokenOut,
                )}`}
              />
            ) : null}
            {transaction.approvalConfirmed ? (
              <Chip label="Approval confirmed" color="success" />
            ) : null}
          </Stack>
        ) : null}

        {transaction.hash ? (
          <Typography variant="body2">
            Pending transaction{" "}
            <Link
              href={`https://basescan.org/tx/${transaction.hash}`}
              target="_blank"
              rel="noopener noreferrer"
              underline="hover"
            >
              {`${transaction.hash.slice(0, 10)}...${transaction.hash.slice(-8)}`}
            </Link>
          </Typography>
        ) : null}

        {state.fallbackVisible ? (
          <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
            {fallbackLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                underline="hover"
              >
                {link.label}
              </Link>
            ))}
          </Stack>
        ) : null}

        {isConnected ? (
          <Button
            type="button"
            variant="contained"
            disabled={primaryDisabled}
            onClick={handlePrimaryAction}
            sx={{ minHeight: 44 }}
          >
            {primaryLabel}
          </Button>
        ) : (
          <ConnectKitButton />
        )}

        <RouteDiagnostics
          quote={quote}
          defaultOpen={state.diagnosticsVisible}
        />
      </Stack>
    </Box>
  );
};
