import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Address, Hash } from "viem";
import { base } from "viem/chains";
import { FAME, NATIVE_ETH, USDC, WETH } from "../../fame-swap/tokens";
import {
  BASE_GALLERY_ADDRESSES,
  BASE_GALLERY_CHECKOUT_DEPENDENCIES,
} from "../contracts";
import { quoteGalleryCheckout } from "./useGalleryCheckoutQuote";

const MARKETPLACE =
  "0x1111111111111111111111111111111111111111" as const satisfies Address;
const CHECKOUT =
  "0x2222222222222222222222222222222222222222" as const satisfies Address;
const OTHER =
  "0x3333333333333333333333333333333333333333" as const satisfies Address;
const ROUTE_HASH = `0x${"5".repeat(64)}` as Hash;

const checkout = {
  mode: "fork",
  address: CHECKOUT,
  ...BASE_GALLERY_CHECKOUT_DEPENDENCIES,
} as const;

type QuoteClient = Parameters<typeof quoteGalleryCheckout>[0]["client"];

function quoteClient(
  overrides: {
    authorizedCheckout?: Address;
    checkoutFame?: Address;
  } = {},
): QuoteClient {
  return {
    getBlockNumber: async () => 49_000_000n,
    getBlock: async () => ({ timestamp: 1_900_000_000n }),
    multicall: async () =>
      [
        1_000n,
        25n,
        10_000n,
        overrides.authorizedCheckout ?? CHECKOUT,
        checkout.router,
        MARKETPLACE,
        overrides.checkoutFame ?? BASE_GALLERY_ADDRESSES.fame,
        checkout.usdc,
        checkout.weth,
      ] as never,
    readContract: async () => {
      throw new Error("The injected route solver should not read pools.");
    },
  } as unknown as QuoteClient;
}

const injectedDependencies = {
  now: () => 1_800_000_000_000,
  createAdapter: async (options: {
    chainId: number;
    blockNumber?: bigint;
    forkUrlLabel?: string;
  }) => ({
    quoteContext: {
      source: "fork" as const,
      chainId: options.chainId,
      blockNumber: options.blockNumber!,
      forkUrlLabel: options.forkUrlLabel,
    },
    quoteEdge: async () => {
      throw new Error("The injected route solver should not quote pools.");
    },
  }),
  solveRoute: async (options: {
    tokenIn: { address: Address };
    tokenOut: { address: Address };
    selectedTopology: { id: string };
    targetOutput: bigint;
    maximumInput: bigint;
    recipient: Address;
    deadline: bigint;
  }) => ({
    status: "ready" as const,
    routeId: options.selectedTopology.id,
    amountIn: options.maximumInput / 2n,
    protectedOutput: options.targetOutput,
    estimatedFameOutput: options.targetOutput + 7n,
    routeHash: ROUTE_HASH,
    route: {
      version: 1 as const,
      tokenIn: options.tokenIn.address,
      tokenOut: options.tokenOut.address,
      amountIn: options.maximumInput / 2n,
      minAmountOutAfterFee: options.targetOutput,
      recipient: options.recipient,
      deadline: options.deadline,
      legs: [],
    },
  }),
};

describe("gallery checkout quote builder", () => {
  it("builds pinned ETH, USDC, and WETH quotes from the same authorized checkout", async () => {
    const expectedTokens = {
      ETH: NATIVE_ETH,
      USDC,
      WETH,
    } as const;

    for (const paymentAsset of ["ETH", "USDC", "WETH"] as const) {
      const quote = await quoteGalleryCheckout(
        {
          client: quoteClient(),
          chainId: base.id,
          marketplace: MARKETPLACE,
          fame: BASE_GALLERY_ADDRESSES.fame,
          checkout,
          paymentAsset,
        },
        injectedDependencies,
      );

      assert.equal(quote.paymentAsset, paymentAsset);
      assert.equal(quote.inputToken, expectedTokens[paymentAsset]);
      assert.equal(quote.route.tokenOut, FAME);
      assert.equal(quote.route.recipient, CHECKOUT);
      assert.equal(quote.marketplaceFameCharge, 1_025n);
      assert.equal(quote.estimatedSurplusFame, 7n);
      assert.equal(quote.routeHash, ROUTE_HASH);
      assert.equal(quote.quoteBlockNumber, 49_000_000n);
    }
  });

  it("fails closed when the marketplace has not authorized the checkout", async () => {
    await assert.rejects(
      quoteGalleryCheckout(
        {
          client: quoteClient({ authorizedCheckout: OTHER }),
          chainId: base.id,
          marketplace: MARKETPLACE,
          fame: BASE_GALLERY_ADDRESSES.fame,
          checkout,
          paymentAsset: "ETH",
        },
        injectedDependencies,
      ),
      /has not authorized/u,
    );
  });

  it("fails closed when the checkout's pinned dependencies drift", async () => {
    await assert.rejects(
      quoteGalleryCheckout(
        {
          client: quoteClient({ checkoutFame: OTHER }),
          chainId: base.id,
          marketplace: MARKETPLACE,
          fame: BASE_GALLERY_ADDRESSES.fame,
          checkout,
          paymentAsset: "USDC",
        },
        injectedDependencies,
      ),
      /dependencies do not match/u,
    );
  });
});
