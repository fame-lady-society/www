"use client";

import Typography from "@mui/material/Typography";
import { useMemo } from "react";
import { getFameSwapConfig } from "@/features/fame-swap/config";
import { useFameSwapQuote } from "@/features/fame-swap/hooks/useFameSwapQuote";
import { useFameSwapReadiness } from "@/features/fame-swap/hooks/useFameSwapReadiness";
import { DEFAULT_FAME_SWAP_DEADLINE_MINUTES } from "@/features/fame-swap/solver/deadline";
import { formatTokenAmount } from "@/features/fame-swap/solver/format";
import type { FameSwapQuote } from "@/features/fame-swap/solver/types";
import {
  NATIVE_ETH,
  USDC,
  tokenForAddress,
  type FameSwapToken,
} from "@/features/fame-swap/tokens";
import { fameToken } from "@/features/fame-swap/ui/tradeModel";

const LINKED_FAME_AMOUNT = 1_000_000n * 10n ** 18n;
const FAME_TOKEN = fameToken();
const ETH_TOKEN = requiredToken(NATIVE_ETH);
const USDC_TOKEN = requiredToken(USDC);

function requiredToken(address: typeof NATIVE_ETH | typeof USDC): FameSwapToken {
  const token = tokenForAddress(address);
  if (!token) throw new Error(`FAME swap token config is missing for ${address}.`);
  return token;
}

export function auctionFameQuoteLabel(
  quote: FameSwapQuote | null,
  token: FameSwapToken,
  decimalPlaces: number = 4,
  isLoading: boolean,
): string {
  if (quote?.status === "ready") {
    return formatTokenAmount(quote.estimatedOutput, token, decimalPlaces);
  }
  return isLoading ? `Loading ${token.symbol} quote…` : `${token.symbol} unavailable`;
}

export function AuctionFameLiquidValue() {
  const config = useMemo(() => getFameSwapConfig(), []);
  const { readiness, isChecking } = useFameSwapReadiness(config);
  const ethQuote = useFameSwapQuote({
    tokenIn: FAME_TOKEN,
    tokenOut: ETH_TOKEN,
    amountIn: LINKED_FAME_AMOUNT,
    recipient: null,
    config,
    readiness,
    deadlineMinutes: DEFAULT_FAME_SWAP_DEADLINE_MINUTES,
  });
  const usdcQuote = useFameSwapQuote({
    tokenIn: FAME_TOKEN,
    tokenOut: USDC_TOKEN,
    amountIn: LINKED_FAME_AMOUNT,
    recipient: null,
    config,
    readiness,
    deadlineMinutes: DEFAULT_FAME_SWAP_DEADLINE_MINUTES,
  });

  return (
    <Typography
      variant="body2"
      color="text.secondary"
      role="status"
      aria-live="polite"
      sx={{ mt: 0.5 }}
    >
      Current liquid price:<br></br>
      {auctionFameQuoteLabel(
        ethQuote.quote,
        ETH_TOKEN,
        4,
        isChecking || ethQuote.isLoading,
      )}{" "}
      <br></br>{usdcQuote.quote?.status === "ready" ? "$" : ""}
      {auctionFameQuoteLabel(
        usdcQuote.quote,
        USDC_TOKEN,
        2,
        isChecking || usdcQuote.isLoading,
      )}
    </Typography>
  );
}
