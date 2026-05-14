"use client";

import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import SwapVertIcon from "@mui/icons-material/SwapVert";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { ConnectKitButton } from "connectkit";
import type { FC, SyntheticEvent } from "react";
import { useCallback, useMemo, useState } from "react";
import { parseUnits } from "viem";
import { base } from "viem/chains";
import { useChainId, useSwitchChain } from "wagmi";
import { useAccount } from "@/hooks/useAccount";
import { getFameSwapConfig } from "../config";
import { useFameSwapBalance } from "../hooks/useFameSwapBalance";
import { useFameSwapQuote } from "../hooks/useFameSwapQuote";
import { useFameSwapReadiness } from "../hooks/useFameSwapReadiness";
import { useFameSwapTransaction } from "../hooks/useFameSwapTransaction";
import { DEFAULT_FAME_SWAP_DEADLINE_MINUTES } from "../solver/deadline";
import { formatTokenAmount } from "../solver/format";
import type { FameSwapQuote } from "../solver/types";
import { fameSwapWidgetState } from "../state";
import type { FameSwapToken } from "../tokens";
import {
  amountToInputValue,
  FAME_SWAP_PERCENT_PRESETS,
  presetAmount,
  usablePresetBalance,
} from "../ui/amountPresets";
import { fameSwapQuoteView } from "../ui/quoteView";
import {
  defaultFameSwapTrade,
  deriveFameSwapPair,
  FAME_SWAP_OPPOSITE_ASSETS,
  flipFameSwapMode,
  type FameSwapTradeMode,
} from "../ui/tradeModel";
import { AdvancedSwapControls } from "./AdvancedSwapControls";
import { FameSwapQuotePanel } from "./QuotePanel";
import { RouteDiagnostics } from "./RouteDiagnostics";
import { FameSwapRouteMap } from "./RouteMap";
import { FameSwapAmountField } from "./SwapAmountField";
import { FameSwapTokenSelect } from "./TokenSelect";
import { FameSwapTransactionTimeline } from "./TransactionTimeline";

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

function errorMessage(error: Error): string {
  return error.message.trim() || "Wallet request failed.";
}

export function fameSwapErrorSummary(error: Error): string {
  const normalized = errorMessage(error).replace(/\s+/g, " ");
  const markerIndex = normalized.search(
    /\b(?:Request Arguments|Contract Call|Docs|Details|Version):/i,
  );
  const summary =
    markerIndex >= 0 ? normalized.slice(0, markerIndex).trim() : normalized;

  if (/user (?:rejected|denied)|request rejected/i.test(normalized)) {
    return "User rejected the request.";
  }

  return summary || "Wallet request failed.";
}

export function fameSwapErrorDetails(error: Error): string | null {
  const raw = errorMessage(error);
  return raw === fameSwapErrorSummary(error) ? null : raw;
}

function copyErrorDetails(details: string): void {
  if (typeof navigator === "undefined" || !navigator.clipboard) return;
  void navigator.clipboard.writeText(details);
}

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

export function quoteSummary(quote: FameSwapQuote | null): string {
  if (!quote) return "Select a pair and enter an amount.";

  switch (quote.status) {
    case "ready":
      return "Minimum after fee: waiting for wallet checks.";
    case "not_live_ready":
      return quote.readiness.message;
    case "stale_artifact":
      return quote.reason;
    case "unsupported":
      return "This pair is not in the pinned FAME route set.";
    case "no_safe_route":
    case "quote_adapter_failure":
    case "simulation_failure":
      return quote.message;
  }
}

function alertSeverity(
  stateKind: ReturnType<typeof fameSwapWidgetState>["kind"],
  amountBlocked: boolean,
) {
  if (amountBlocked) return "warning";
  if (stateKind === "ready" || stateKind === "confirmed") return "success";
  if (stateKind === "reverted") return "error";
  if (
    stateKind === "not_live_ready" ||
    stateKind === "stale_artifact" ||
    stateKind === "no_safe_route" ||
    stateKind === "quote_adapter_failure" ||
    stateKind === "simulation_failure" ||
    stateKind === "quote_expired"
  ) {
    return "warning";
  }
  return "info";
}

function balanceHelperText(
  balanceStatus: ReturnType<typeof useFameSwapBalance>,
  token: FameSwapToken,
): string | null {
  if (balanceStatus.status === "loading") return "Checking balance.";
  if (balanceStatus.status === "error") return balanceStatus.message;
  if (balanceStatus.balance === null) return null;

  const label = `Balance ${formatTokenAmount(balanceStatus.balance, token)}`;
  return balanceStatus.status === "stale" ? `${label} (stale)` : label;
}

const AlertErrorLine: FC<{ error: Error }> = ({ error }) => {
  const summary = fameSwapErrorSummary(error);
  const details = fameSwapErrorDetails(error);

  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={{ xs: 0.5, sm: 1 }}
      alignItems={{ xs: "flex-start", sm: "center" }}
      sx={{ mt: 0.75 }}
    >
      <Typography variant="body2" sx={{ minWidth: 0, flex: 1 }}>
        {summary}
      </Typography>
      {details ? (
        <Tooltip title="Copy full wallet error details" arrow>
          <Button
            type="button"
            size="small"
            color="inherit"
            variant="text"
            startIcon={<ContentCopyIcon fontSize="small" />}
            onClick={() => copyErrorDetails(details)}
            sx={{
              flex: "0 0 auto",
              minWidth: 0,
              px: 0.75,
              py: 0.25,
              textTransform: "none",
            }}
          >
            Copy details
          </Button>
        </Tooltip>
      ) : null}
    </Stack>
  );
};

export const FameSwapWidget: FC<FameSwapWidgetProps> = ({ mode = "full" }) => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const {
    switchChainAsync,
    isPending: isSwitchingChain,
    error: switchChainError,
  } = useSwitchChain();
  const baseConfig = useMemo(() => getFameSwapConfig(), []);
  const { readiness, isChecking: readinessChecking } =
    useFameSwapReadiness(baseConfig);
  const [trade, setTrade] = useState(defaultFameSwapTrade);
  const [amount, setAmount] = useState("");
  const [slippageBps, setSlippageBps] = useState(baseConfig.defaultSlippageBps);
  const [deadlineMinutes, setDeadlineMinutes] = useState(
    DEFAULT_FAME_SWAP_DEADLINE_MINUTES,
  );
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const compact = mode === "compact";
  const onBase = chainId === base.id;
  const pair = useMemo(() => deriveFameSwapPair(trade), [trade]);
  const inputBalance = useFameSwapBalance(address, pair.inputToken);
  const config = useMemo(
    () => ({
      ...baseConfig,
      defaultSlippageBps: slippageBps,
    }),
    [baseConfig, slippageBps],
  );

  const parsedAmount = useMemo(
    () => parseAmount(amount, pair.inputToken),
    [amount, pair.inputToken],
  );
  const availablePresetBalance =
    inputBalance.balance !== null
      ? usablePresetBalance(inputBalance.balance, pair.inputToken)
      : null;
  const amountInvalid = amount.trim().length > 0 && parsedAmount === null;
  const amountExceedsBalance =
    parsedAmount !== null &&
    availablePresetBalance !== null &&
    parsedAmount > availablePresetBalance;
  const amountBlocked = amountInvalid || amountExceedsBalance;
  const amountHelper = amountInvalid
    ? "Enter a valid amount."
    : amountExceedsBalance
      ? "Amount exceeds available balance."
      : balanceHelperText(inputBalance, pair.inputToken);

  const {
    quote,
    isLoading: quoteLoading,
    error: quoteRequestError,
  } = useFameSwapQuote({
    tokenIn: pair.tokenIn,
    tokenOut: pair.tokenOut,
    amountIn: parsedAmount,
    recipient: address ?? null,
    config,
    deadlineMinutes,
    readiness,
  });

  const transaction = useFameSwapTransaction(quote, address);
  const quoteView = useMemo(
    () => fameSwapQuoteView(quote, pair.outputToken, transaction),
    [pair.outputToken, quote, transaction],
  );

  const state = fameSwapWidgetState({
    connected: isConnected,
    onBase,
    amountEntered: parsedAmount !== null,
    quoteLoading,
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
    state.kind === "confirmed"
      ? false
      : state.ctaDisabled ||
        readinessChecking ||
        amountBlocked ||
        isSwitchingChain ||
        transaction.submitting ||
        (state.kind === "approval_needed" && !transaction.canApprove) ||
        (state.kind === "ready" && !transaction.canSwap);

  const primaryLabel = readinessChecking
    ? "Checking router"
    : isSwitchingChain
      ? "Switching to Base"
      : state.ctaLabel;

  const ensureBaseChain = useCallback(async () => {
    if (onBase) return true;

    try {
      await switchChainAsync({ chainId: base.id });
      return true;
    } catch {
      return false;
    }
  }, [onBase, switchChainAsync]);

  const handlePrimaryAction = useCallback(async () => {
    if (!isConnected) return;

    if (state.kind === "confirmed") {
      transaction.reset();
      setAmount("");
      return;
    }

    if (state.kind !== "approval_needed" && state.kind !== "ready") return;
    if (!(await ensureBaseChain())) return;

    if (state.kind === "approval_needed") {
      void transaction.submitApproval();
      return;
    }

    if (state.kind === "ready") {
      void transaction.submitSwap();
      return;
    }
  }, [ensureBaseChain, isConnected, state.kind, transaction]);

  const handleModeChange = useCallback(
    (_event: SyntheticEvent, value: FameSwapTradeMode | null) => {
      if (!value || value === trade.mode) return;
      setTrade((current) => ({
        ...current,
        mode: value,
      }));
    },
    [trade.mode],
  );

  const handlePresetClick = useCallback(
    (percent: (typeof FAME_SWAP_PERCENT_PRESETS)[number]) => {
      if (inputBalance.balance === null) return;
      setAmount(
        amountToInputValue(
          presetAmount(inputBalance.balance, pair.inputToken, percent),
          pair.inputToken,
        ),
      );
    },
    [inputBalance.balance, pair.inputToken],
  );

  const alertMessage = amountExceedsBalance
    ? "The entered amount is above the spendable balance."
    : state.message;
  const alertRecovery = amountBlocked
    ? "Choose a preset or lower the amount."
    : state.recoveryAction;
  const alertDetail =
    state.kind === "confirmed"
      ? transaction.protectedMinimum !== null
        ? `Protected minimum used: ${quoteView.protectedMinimumLabel}.`
        : "Swap receipt confirmed on Base."
      : quoteLoading
        ? "Fetching live liquidity and route diagnostics."
        : quoteView.blockedReason ?? quoteSummary(quote);
  const quoteReady = quote?.status === "ready";
  const approvalRequired = Boolean(
    quoteReady && quote.approval !== null && !transaction.approvalConfirmed,
  );
  const alertErrors = [
    switchChainError,
    transaction.error,
    quoteRequestError,
  ].filter((error): error is Error => error instanceof Error);
  const uniqueAlertErrors = alertErrors.filter(
    (error, index, errors) =>
      errors.findIndex(
        (entry) => errorMessage(entry) === errorMessage(error),
      ) === index,
  );

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
      <Stack spacing={2.25}>
        <div>
          <Typography id="fame-swap-heading" variant={compact ? "h5" : "h4"}>
            FAME swap
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            via preferred liquidity
          </Typography>
        </div>

        <Stack spacing={1.5}>
          <Tabs
            value={trade.mode}
            onChange={handleModeChange}
            aria-label="FAME swap mode"
            variant="fullWidth"
          >
            <Tab value="buy" label="Buy FAME" />
            <Tab value="sell" label="Sell FAME" />
          </Tabs>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <FameSwapTokenSelect
              id="fame-swap-opposite-asset"
              label={trade.mode === "buy" ? "Pay with" : "Receive"}
              value={trade.asset}
              tokens={FAME_SWAP_OPPOSITE_ASSETS}
              disabled={state.tokenSelectDisabled}
              onChange={(asset) => {
                setTrade((current) => ({
                  ...current,
                  asset,
                }));
              }}
            />
            <Tooltip title="Swap side">
              <span>
                <IconButton
                  type="button"
                  aria-label="Swap side"
                  disabled={state.tokenSelectDisabled}
                  onClick={() =>
                    setTrade((current) => flipFameSwapMode(current))
                  }
                  sx={{
                    alignSelf: { xs: "stretch", sm: "center" },
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 1,
                    minHeight: 44,
                  }}
                >
                  <SwapVertIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        </Stack>

        <Stack spacing={1}>
          <FameSwapAmountField
            label={pair.inputLabel}
            value={amount}
            token={pair.inputToken}
            helperText={amountHelper}
            error={amountBlocked}
            disabled={state.amountDisabled}
            onChange={setAmount}
          />

          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
            {FAME_SWAP_PERCENT_PRESETS.map((percent) => (
              <Button
                key={percent}
                type="button"
                size="small"
                variant="outlined"
                disabled={
                  state.amountDisabled ||
                  inputBalance.balance === null ||
                  availablePresetBalance === 0n
                }
                onClick={() => handlePresetClick(percent)}
                sx={{ minWidth: 56 }}
              >
                {percent}%
              </Button>
            ))}
          </Stack>
        </Stack>

        <FameSwapQuotePanel view={quoteView} />

        <AdvancedSwapControls
          open={advancedOpen}
          disabled={state.amountDisabled || transaction.submitting}
          slippageBps={slippageBps}
          deadlineMinutes={deadlineMinutes}
          onToggle={() => setAdvancedOpen((current) => !current)}
          onSlippageBpsChange={setSlippageBps}
          onDeadlineMinutesChange={setDeadlineMinutes}
        />

        {isConnected ? (
          <Button
            type="button"
            variant="outlined"
            disabled={primaryDisabled}
            onClick={handlePrimaryAction}
            sx={{
              minHeight: 48,
              borderRadius: 2,
              px: 4,
              fontWeight: 600,
              backgroundColor: "transparent !important",
              background:
                "linear-gradient(135deg, #ff6b9d 0%, #c44dff 100%) !important",
              color: "#fff !important",
              "&:hover": {
                backgroundColor: "transparent !important",
                background:
                  "linear-gradient(135deg, #ff8cb5 0%, #d06aff 100%) !important",
              },
              "&.Mui-disabled": {
                backgroundColor: (theme) =>
                  theme.palette.mode === "light"
                    ? "rgba(15, 23, 42, 0.08) !important"
                    : "rgba(255,255,255,0.12) !important",
                color: (theme) =>
                  theme.palette.mode === "light"
                    ? "rgba(15, 23, 42, 0.35) !important"
                    : "rgba(255,255,255,0.3) !important",
                background: "none !important",
              },
            }}
          >
            {primaryLabel}
          </Button>
        ) : (
          <ConnectKitButton />
        )}

        <Alert severity={alertSeverity(state.kind, amountBlocked)}>
          <Typography fontWeight={700}>{state.title}</Typography>
          <Typography variant="body2">{alertMessage}</Typography>
          <Typography variant="body2" sx={{ mt: 0.75 }}>
            {alertDetail}
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.75 }}>
            {alertRecovery}
          </Typography>
          {uniqueAlertErrors.map((error) => (
            <AlertErrorLine key={errorMessage(error)} error={error} />
          ))}
        </Alert>

        <FameSwapTransactionTimeline
          quoteReady={quoteReady}
          approvalRequired={approvalRequired}
          transaction={transaction}
        />

        {quoteReady ? (
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {quoteView.feeLabel ? (
              <Typography variant="caption" color="text.secondary">
                FLS fee {quoteView.feeLabel}
              </Typography>
            ) : null}
            {quoteView.slippageLabel ? (
              <Typography variant="caption" color="text.secondary">
                Max slippage {quoteView.slippageLabel}
              </Typography>
            ) : null}
          </Stack>
        ) : null}

        <FameSwapRouteMap routeMap={quoteView.routeMap} />

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

        <RouteDiagnostics
          quote={quote}
          defaultOpen={state.diagnosticsVisible}
        />
      </Stack>
    </Box>
  );
};
