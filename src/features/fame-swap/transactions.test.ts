import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FAME, NATIVE_ETH, USDC, WETH, tokenForAddress } from "./tokens";
import { routeArtifactById } from "./solver/artifacts";
import { quoteWithReadyReadiness } from "./solver/quote";
import { createDeterministicQuoteAdapter } from "./solver/quotes/deterministicAdapter";
import { fameSwapTransactionRequests } from "./transactions";

const routerAddress = "0x0000000000000000000000000000000000000009";
const recipient = "0x0000000000000000000000000000000000000abc";

function token(address: typeof FAME | typeof USDC | typeof WETH | typeof NATIVE_ETH) {
  const result = tokenForAddress(address);
  assert.ok(result);
  return result;
}

function artifactAmount(id: string): bigint {
  const artifact = routeArtifactById(id);
  assert.ok(artifact);
  return BigInt(artifact.route.amountIn);
}

function quoteAdapter() {
  return createDeterministicQuoteAdapter();
}

describe("FAME swap transaction requests", () => {
  it("builds exact ERC20 approval and router execution requests", () => {
    const amountIn = artifactAmount("solver-fame-basedflick-zora-usdc");
    const quote = quoteWithReadyReadiness({
      tokenIn: token(FAME),
      tokenOut: token(USDC),
      amountIn,
      recipient,
      routerAddress,
      now: new Date("2026-05-13T00:00:00Z"),
      adapter: quoteAdapter(),
    });

    const requests = fameSwapTransactionRequests(quote);

    assert.equal(requests.approval?.contract.address, FAME);
    assert.equal(requests.approval?.contract.functionName, "approve");
    assert.equal(requests.approval?.contract.args[0], routerAddress);
    assert.equal(requests.approval?.contract.args[1], amountIn);
    assert.equal(requests.swap?.contract.address, routerAddress);
    assert.equal(requests.swap?.contract.functionName, "executeRoute");
    assert.equal(requests.swap?.contract.value, 0n);
    assert.equal(requests.swap?.contract.args[0].recipient, recipient);
    assert.equal(quote.status, "ready");
    if (quote.status === "ready") {
      assert.equal(requests.swap?.materializedRouteHash, quote.materializedRouteHash);
    }
  });

  it("uses native ETH value and skips approval for ETH input routes", () => {
    const amountIn = artifactAmount("solver-eth-zora-basedflick-fame");
    const quote = quoteWithReadyReadiness({
      tokenIn: token(NATIVE_ETH),
      tokenOut: token(FAME),
      amountIn,
      recipient,
      routerAddress,
      now: new Date("2026-05-13T00:00:00Z"),
      adapter: quoteAdapter(),
    });

    const requests = fameSwapTransactionRequests(quote);

    assert.equal(requests.approval, null);
    assert.equal(requests.swap?.contract.value, amountIn);
  });

  it("does not build executable requests for unsafe arbitrary non-fixture amounts", () => {
    const amountIn = artifactAmount("solver-fame-basedflick-zora-usdc") * 1_000n;
    const quote = quoteWithReadyReadiness({
      tokenIn: token(FAME),
      tokenOut: token(USDC),
      amountIn,
      recipient,
      routerAddress,
      now: new Date("2026-05-13T00:00:00Z"),
      adapter: quoteAdapter(),
    });

    assert.equal(quote.status, "no_safe_route");
    const requests = fameSwapTransactionRequests(quote);
    assert.equal(requests.approval, null);
    assert.equal(requests.swap, null);
  });
});
