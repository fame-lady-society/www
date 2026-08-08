import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Address, Hash } from "viem";
import { base } from "viem/chains";
import { FAME, WETH } from "../../fame-swap/tokens";
import type { GalleryRedemptionQuote } from "../types";
import {
  galleryRedemptionApprovalReadRequest,
  galleryRedemptionApprovalRequest,
  galleryRedemptionRequest,
} from "./redemptionRequests";

const ACCOUNT = "0x1111111111111111111111111111111111111111" as Address;
const MIRROR = "0x2222222222222222222222222222222222222222" as Address;
const CHECKOUT = "0x3333333333333333333333333333333333333333" as Address;

const quote = {
  account: ACCOUNT,
  chainId: base.id,
  tokenIds: [4n, 17n],
  outputAsset: "WETH",
  outputToken: WETH,
  checkout: CHECKOUT,
  quoteBlockNumber: 49_000_000n,
  fameUnit: 1_000_000n * 10n ** 18n,
  selectedBacking: 2_000_000n * 10n ** 18n,
  checkoutBonus: 0n,
  quoteBasis: 2_000_000n * 10n ** 18n,
  estimatedOutput: 999n,
  minimumOutput: 777n,
  routeHash: `0x${"6".repeat(64)}` as Hash,
  route: {
    version: 1,
    tokenIn: FAME,
    tokenOut: WETH,
    amountIn: 2_000_000n * 10n ** 18n,
    minAmountOutAfterFee: 777n,
    recipient: ACCOUNT,
    deadline: 1_900_000_600n,
    legs: [
      {
        tokenIn: FAME,
        tokenOut: WETH,
        venue: "Solidly",
        venueOrdinal: 0,
        amountMode: "All",
        amountModeOrdinal: 2,
        amount: 0n,
        minAmountOut: 777n,
        target: MIRROR,
        data: "0x",
      },
    ],
  },
  deadline: 1_900_000_600n,
  expiresAt: new Date(1_900_000_600_000),
} as const satisfies GalleryRedemptionQuote;

describe("gallery redemption contract requests", () => {
  it("reads and writes mirror operator approval for the checkout", () => {
    assert.deepEqual(
      galleryRedemptionApprovalReadRequest(ACCOUNT, MIRROR, CHECKOUT),
      {
        abi: galleryRedemptionApprovalReadRequest(ACCOUNT, MIRROR, CHECKOUT)
          .abi,
        address: MIRROR,
        functionName: "isApprovedForAll",
        args: [ACCOUNT, CHECKOUT],
      },
    );
    assert.deepEqual(
      galleryRedemptionApprovalRequest(ACCOUNT, base.id, MIRROR, CHECKOUT),
      {
        abi: galleryRedemptionApprovalRequest(
          ACCOUNT,
          base.id,
          MIRROR,
          CHECKOUT,
        ).abi,
        address: MIRROR,
        account: ACCOUNT,
        chainId: base.id,
        functionName: "setApprovalForAll",
        args: [CHECKOUT, true],
      },
    );
  });

  it("submits redeemSociety to checkout with the bound route and sorted IDs", () => {
    const request = galleryRedemptionRequest(quote);
    assert.equal(request.address, CHECKOUT);
    assert.equal(request.account, ACCOUNT);
    assert.equal(request.chainId, base.id);
    assert.equal(request.functionName, "redeemSociety");
    assert.deepEqual(request.args, [
      {
        version: quote.route.version,
        tokenIn: quote.route.tokenIn,
        tokenOut: quote.route.tokenOut,
        amountIn: quote.route.amountIn,
        minAmountOutAfterFee: quote.route.minAmountOutAfterFee,
        recipient: quote.route.recipient,
        deadline: quote.route.deadline,
        legs: [
          {
            tokenIn: FAME,
            tokenOut: WETH,
            venue: 0,
            amountMode: 2,
            amount: 0n,
            minAmountOut: 777n,
            target: MIRROR,
            data: "0x",
          },
        ],
      },
      [4n, 17n],
    ]);
  });
});
