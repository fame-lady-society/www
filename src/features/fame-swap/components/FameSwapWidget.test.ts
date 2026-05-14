import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FAME, WETH, tokenForAddress } from "../tokens";
import { routeArtifactById } from "../solver/artifacts";
import { quoteWithReadyReadiness } from "../solver/quote";
import { createDeterministicQuoteAdapter } from "../solver/quotes/deterministicAdapter";
import { quoteSummary } from "./FameSwapWidget";

const routerAddress = "0x0000000000000000000000000000000000000009";
const recipient = "0x0000000000000000000000000000000000000abc";

describe("FameSwapWidget quote summary", () => {
  it("does not show the fixture placeholder minimum before wallet simulation", () => {
    const tokenIn = tokenForAddress(WETH);
    const tokenOut = tokenForAddress(FAME);
    const artifact = routeArtifactById("solver-weth-split-fame");
    assert.ok(tokenIn);
    assert.ok(tokenOut);
    assert.ok(artifact);

    const quote = quoteWithReadyReadiness({
      tokenIn,
      tokenOut,
      amountIn: BigInt(artifact.route.amountIn),
      recipient,
      routerAddress,
      now: new Date("2026-05-13T00:00:00Z"),
      adapter: createDeterministicQuoteAdapter(),
    });

    assert.equal(quote.status, "ready");
    if (quote.status === "ready") {
      assert.ok(quote.minAmountOutAfterFee > 1n);
      assert.equal(
        quoteSummary(quote),
        "Minimum after fee: waiting for wallet checks.",
      );
    }
  });
});
