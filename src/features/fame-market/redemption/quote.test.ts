import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Address, Hash } from "viem";
import { base } from "viem/chains";
import { buildFameRouteLeg } from "../../fame-swap/router/buildLegPayload";
import type { FameRoute } from "../../fame-swap/router/types";
import { famePoolEdgesForPair } from "../../fame-swap/solver/poolUniverse";
import { FAME, NATIVE_ETH, USDC, WETH } from "../../fame-swap/tokens";
import {
  SOCIETY_REDEMPTION_FAME_PER_TOKEN,
  galleryRedemptionConsentKey,
  galleryRedemptionQuoteBasis,
  isGalleryRedemptionQuoteCurrent,
  quoteGalleryRedemption,
} from "./quote";

const ACCOUNT = "0x1111111111111111111111111111111111111111" as Address;
const CHECKOUT = "0x2222222222222222222222222222222222222222" as Address;
const ROUTER = "0x3333333333333333333333333333333333333333" as Address;
const BLOCK = 49_000_000n;

function quotedRoute(
  output: "ETH" | "WETH" | "USDC",
  amountIn: bigint,
): FameRoute {
  const firstEdge = famePoolEdgesForPair(FAME, WETH)[0];
  assert.ok(firstEdge);
  const edges = [firstEdge];
  if (output === "ETH") {
    const edge = famePoolEdgesForPair(WETH, NATIVE_ETH)[0];
    assert.ok(edge);
    edges.push(edge);
  } else if (output === "USDC") {
    const edge = famePoolEdgesForPair(WETH, USDC)[0];
    assert.ok(edge);
    edges.push(edge);
  }
  const tokenOut =
    output === "ETH" ? NATIVE_ETH : output === "USDC" ? USDC : WETH;
  return {
    version: 1,
    tokenIn: FAME,
    tokenOut,
    amountIn,
    minAmountOutAfterFee: 777n,
    recipient: ACCOUNT,
    deadline: 1_900_000_600n,
    legs: edges.map((edge, index) =>
      buildFameRouteLeg({
        edge,
        amountMode: index === 0 ? "Exact" : "All",
        amount: index === 0 ? amountIn : 0n,
        minAmountOut: index === edges.length - 1 ? 777n : 888n,
        routerAddress: ROUTER,
        deadline: 1_900_000_600n,
      }),
    ),
  };
}

describe("gallery Society redemption quote", () => {
  it("quotes selected backing plus the pinned checkout bonus for ETH, WETH, and USDC", async () => {
    const bonus = 123n * 10n ** 18n;
    const fameUnit = 999_999n * 10n ** 18n;
    const quoteBasis = 2n * fameUnit + bonus;
    const reads: Array<{ functionName: string; blockNumber?: bigint }> = [];
    const client = {
      getBlockNumber: async () => BLOCK,
      getBlock: async () => ({ timestamp: 1_900_000_000n }),
      readContract: async (request: {
        functionName: string;
        blockNumber?: bigint;
      }) => {
        reads.push(request);
        if (request.functionName === "balanceOf") return bonus;
        if (request.functionName === "unit") return fameUnit;
        return 2_222n;
      },
    };

    for (const outputAsset of ["ETH", "WETH", "USDC"] as const) {
      const quote = await quoteGalleryRedemption(
        {
          client: client as never,
          chainId: base.id,
          account: ACCOUNT,
          checkout: CHECKOUT,
          fame: FAME,
          router: ROUTER,
          tokenIds: [4n, 17n],
          outputAsset,
        },
        {
          solveExactInput: async ({ amountIn }) => ({
            status: "ready" as const,
            route: quotedRoute(outputAsset, amountIn),
            estimatedOutput: 999n,
          }),
          now: () => 1_800_000_000_000,
        },
      );

      assert.equal(quote.quoteBasis, quoteBasis);
      assert.equal(quote.fameUnit, fameUnit);
      assert.equal(quote.checkoutBonus, bonus);
      assert.equal(quote.selectedBacking, 2n * fameUnit);
      assert.equal(quote.outputAsset, outputAsset);
      assert.equal(quote.route.recipient, ACCOUNT);
      assert.equal(quote.route.amountIn, quoteBasis);
      assert.equal(quote.route.minAmountOutAfterFee, 777n);
      assert.equal(quote.estimatedOutput, 999n);
      assert.equal(quote.quoteBlockNumber, BLOCK);
      assert.equal(
        quote.route.legs.filter(
          (leg) =>
            leg.tokenIn.toLowerCase() === FAME.toLowerCase() &&
            leg.amountMode === "All",
        ).length,
        1,
      );
    }
    assert.ok(reads.every((read) => read.blockNumber === BLOCK));
  });

  it("validates 1..32 sorted unique selected IDs", () => {
    assert.equal(
      galleryRedemptionQuoteBasis([1n], SOCIETY_REDEMPTION_FAME_PER_TOKEN, 0n),
      SOCIETY_REDEMPTION_FAME_PER_TOKEN,
    );
    assert.throws(
      () =>
        galleryRedemptionQuoteBasis([], SOCIETY_REDEMPTION_FAME_PER_TOKEN, 0n),
      /1 to 32/u,
    );
    assert.throws(
      () =>
        galleryRedemptionQuoteBasis(
          [2n, 1n],
          SOCIETY_REDEMPTION_FAME_PER_TOKEN,
          0n,
        ),
      /ascending/u,
    );
    assert.throws(
      () =>
        galleryRedemptionQuoteBasis(
          [1n, 1n],
          SOCIETY_REDEMPTION_FAME_PER_TOKEN,
          0n,
        ),
      /unique/u,
    );
    assert.throws(
      () =>
        galleryRedemptionQuoteBasis(
          Array.from({ length: 33 }, (_, index) => BigInt(index + 1)),
          SOCIETY_REDEMPTION_FAME_PER_TOKEN,
          0n,
        ),
      /1 to 32/u,
    );
  });

  it("binds consent to account, chain, IDs, output, basis, minimum, deadline, and route hash", () => {
    const baseQuote = {
      account: ACCOUNT,
      chainId: base.id,
      checkout: CHECKOUT,
      tokenIds: [4n, 17n],
      outputAsset: "WETH" as const,
      quoteBasis: 2n,
      minimumOutput: 1n,
      deadline: 1_900_000_600n,
      routeHash: `0x${"7".repeat(64)}` as Hash,
      expiresAt: new Date(1_900_000_600_000),
    };
    const key = galleryRedemptionConsentKey(baseQuote);
    for (const changed of [
      { ...baseQuote, account: CHECKOUT },
      { ...baseQuote, chainId: 84_532 },
      { ...baseQuote, checkout: ROUTER },
      { ...baseQuote, tokenIds: [4n] },
      { ...baseQuote, outputAsset: "USDC" as const },
      { ...baseQuote, quoteBasis: 3n },
      { ...baseQuote, minimumOutput: 2n },
      { ...baseQuote, deadline: 1_900_000_601n },
      { ...baseQuote, routeHash: `0x${"8".repeat(64)}` as Hash },
    ]) {
      assert.notEqual(galleryRedemptionConsentKey(changed), key);
    }
    assert.equal(
      isGalleryRedemptionQuoteCurrent(baseQuote, {
        account: ACCOUNT,
        chainId: base.id,
        tokenIds: [4n, 17n],
        outputAsset: "WETH",
        now: 1_900_000_000_000,
      }),
      true,
    );
    assert.equal(
      isGalleryRedemptionQuoteCurrent(baseQuote, {
        account: ACCOUNT,
        chainId: base.id,
        tokenIds: [4n, 18n],
        outputAsset: "WETH",
        now: 1_900_000_000_000,
      }),
      false,
    );
  });
});
