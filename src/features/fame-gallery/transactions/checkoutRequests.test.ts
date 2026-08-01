import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Address, Hash } from "viem";
import { FAME, NATIVE_ETH, USDC, WETH } from "../../fame-swap/tokens";
import type { FameRoute } from "../../fame-swap/router/types";
import type { GalleryCheckoutQuote, GalleryFrozenBuyerTerms } from "../types";
import {
  galleryCheckoutAllowanceRequest,
  galleryCheckoutApprovalContractRequest,
  galleryCheckoutContractRequest,
  freezeGalleryCheckoutBuyerTerms,
} from "./checkoutRequests";

const account = "0x1111111111111111111111111111111111111111";
const marketplace = "0x2222222222222222222222222222222222222222";
const checkout = "0x3333333333333333333333333333333333333333";
const target = "0x4444444444444444444444444444444444444444";
const routeHash = `0x${"55".repeat(32)}` as Hash;
const artworkHash = `0x${"66".repeat(32)}` as Hash;

function route(tokenIn: Address = USDC): FameRoute {
  return {
    version: 1,
    tokenIn,
    tokenOut: FAME,
    amountIn: 12_000_000n,
    minAmountOutAfterFee: 1_030_000n,
    recipient: checkout,
    deadline: 1_900_000_000n,
    legs: [
      {
        tokenIn,
        tokenOut: FAME,
        venue: "AerodromeV2",
        venueOrdinal: 7,
        amountMode: "All",
        amountModeOrdinal: 2,
        amount: 0n,
        minAmountOut: 1_030_000n,
        target,
        data: "0x",
      },
    ],
  };
}

function quote(
  paymentAsset: GalleryCheckoutQuote["paymentAsset"] = "USDC",
): GalleryCheckoutQuote {
  const inputToken =
    paymentAsset === "ETH" ? NATIVE_ETH : paymentAsset === "WETH" ? WETH : USDC;
  const executable = route(inputToken);
  return {
    paymentAsset,
    inputToken,
    checkout,
    marketplace,
    quoteBlockNumber: 49_000_000n,
    routeId: "selected-route",
    routeHash,
    route: executable,
    marketplaceUnit: 1_000_000n,
    marketplacePremium: 30_000n,
    maximumPremium: 30_000n,
    marketplaceFameCharge: 1_030_000n,
    maximumInput: executable.amountIn,
    estimatedInputResidue: 0n,
    protectedFame: 1_030_000n,
    estimatedFameOutput: 1_040_000n,
    estimatedSurplusFame: 10_000n,
    expiresAt: new Date(Number(executable.deadline) * 1_000),
  };
}

function terms(current = quote()): GalleryFrozenBuyerTerms {
  return {
    chainId: 8_453,
    account,
    recipient: account,
    selectedTarget: { targetId: "held:7", tokenId: 7n },
    artworkHash,
    unit: current.marketplaceUnit,
    maxPremium: current.maximumPremium,
    maximumSpend: current.maximumInput,
    allowanceTarget: checkout,
    checkout: {
      paymentAsset: current.paymentAsset,
      inputToken: current.inputToken,
      checkout,
      marketplace,
      maximumInput: current.maximumInput,
      routeHash,
      routeDeadline: current.route.deadline,
      quoteBlockNumber: current.quoteBlockNumber,
    },
  };
}

describe("gallery checkout contract requests", () => {
  it("freezes the selected artwork, payment asset, addresses, and quote caps", () => {
    const current = quote("USDC");
    const frozen = freezeGalleryCheckoutBuyerTerms({
      chainId: 8_453,
      account,
      target: {
        targetId: "held:7",
        kind: "held",
        tokenId: 7n,
        artworkHash,
        tokenUri: null,
        artworkError: null,
      },
      quote: current,
    });
    assert.equal(frozen.recipient, account);
    assert.equal(frozen.allowanceTarget, checkout);
    assert.equal(frozen.maximumSpend, current.maximumInput);
    assert.equal(frozen.checkout?.marketplace, marketplace);
    assert.equal(frozen.checkout?.routeHash, routeHash);
  });

  it("approves the checkout for the exact USDC input, never the router", () => {
    const current = quote("USDC");
    const request = galleryCheckoutApprovalContractRequest(
      terms(current),
      current,
    );
    assert.ok(request);
    assert.equal(request.address, USDC);
    assert.deepEqual(request.args, [checkout, current.maximumInput]);
    assert.deepEqual(
      galleryCheckoutAllowanceRequest({ owner: account, quote: current })?.args,
      [account, checkout],
    );
  });

  it("skips approval and funds native ETH exactly", () => {
    const current = quote("ETH");
    assert.equal(
      galleryCheckoutApprovalContractRequest(terms(current), current),
      null,
    );
    assert.equal(
      galleryCheckoutAllowanceRequest({ owner: account, quote: current }),
      null,
    );
    const request = galleryCheckoutContractRequest(
      terms(current),
      { kind: "held", shellId: 7n },
      current,
    );
    assert.equal(request.functionName, "checkoutHeld");
    assert.equal(request.value, current.maximumInput);
  });

  it("uses exact WETH approval and the typed pool entrypoint", () => {
    const current = quote("WETH");
    const approval = galleryCheckoutApprovalContractRequest(
      terms(current),
      current,
    );
    assert.equal(approval?.address, WETH);
    assert.deepEqual(approval?.args, [checkout, current.maximumInput]);
    const request = galleryCheckoutContractRequest(
      terms(current),
      { kind: "pool", poolKind: "burn", shellId: 8n, sourceId: 9n },
      current,
    );
    assert.equal(request.functionName, "checkoutPool");
    assert.deepEqual(request.args.slice(1), [8n, 9n, artworkHash, 30_000n, 0n]);
    assert.equal(request.value, 0n);
  });

  it("rejects quote drift instead of silently changing consent", () => {
    const current = quote("USDC");
    const changed = { ...current, maximumInput: current.maximumInput + 1n };
    assert.throws(
      () =>
        galleryCheckoutContractRequest(
          terms(current),
          { kind: "held", shellId: 7n },
          changed,
        ),
      /no longer matches buyer consent/u,
    );
  });
});
