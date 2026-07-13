import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { FameSwapQuote } from "@/features/fame-swap/solver/types";
import {
  NATIVE_ETH,
  USDC,
  tokenForAddress,
  type FameSwapToken,
} from "@/features/fame-swap/tokens";
import { auctionFameQuoteLabel } from "./AuctionFameLiquidValue";

function token(address: typeof NATIVE_ETH | typeof USDC): FameSwapToken {
  const configured = tokenForAddress(address);
  if (!configured) throw new Error("Missing test token configuration.");
  return configured;
}

describe("auction FAME liquid value", () => {
  it("formats ready ETH and USDC sell quotes", () => {
    const ethQuote = {
      status: "ready",
      estimatedOutput: 420_123_456_000_000_000n,
    } as FameSwapQuote;
    const usdcQuote = {
      status: "ready",
      estimatedOutput: 1_234_567_890n,
    } as FameSwapQuote;

    assert.equal(
      auctionFameQuoteLabel(ethQuote, token(NATIVE_ETH), 4, false),
      "0.4201 ETH",
    );
    assert.equal(
      auctionFameQuoteLabel(usdcQuote, token(USDC), 2, false),
      "1234.56 USDC",
    );
  });

  it("keeps loading and unavailable quote legs explicit", () => {
    assert.equal(
      auctionFameQuoteLabel(null, token(NATIVE_ETH), 4, true),
      "Loading ETH quote…",
    );
    assert.equal(
      auctionFameQuoteLabel(null, token(USDC), 2, false),
      "USDC unavailable",
    );
  });
});
