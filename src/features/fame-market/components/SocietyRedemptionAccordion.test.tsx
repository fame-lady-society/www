import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";
import type { Address, Hash } from "viem";
import { base } from "viem/chains";
import { FAME, USDC, WETH } from "../../fame-swap/tokens";
import type { GalleryRedemptionQuote } from "../types";
import { SocietyRedemptionAccordionView } from "./SocietyRedemptionAccordion";

const ACCOUNT = "0x1111111111111111111111111111111111111111" as Address;
const CHECKOUT = "0x2222222222222222222222222222222222222222" as Address;

const quote = {
  account: ACCOUNT,
  chainId: base.id,
  tokenIds: [4n, 17n],
  outputAsset: "USDC",
  outputToken: USDC,
  checkout: CHECKOUT,
  quoteBlockNumber: 49_000_000n,
  fameUnit: 1_000_000n * 10n ** 18n,
  selectedBacking: 2_000_000n * 10n ** 18n,
  checkoutBonus: 123n * 10n ** 18n + 600_000_000_000_000_000n,
  quoteBasis: 2_000_123n * 10n ** 18n + 600_000_000_000_000_000n,
  estimatedOutput: 12_345_678n,
  minimumOutput: 12_000_000n,
  routeHash: `0x${"6".repeat(64)}` as Hash,
  route: {
    version: 1,
    tokenIn: FAME,
    tokenOut: USDC,
    amountIn: 2_000_123n * 10n ** 18n,
    minAmountOutAfterFee: 12_000_000n,
    recipient: ACCOUNT,
    deadline: 1_900_000_600n,
    legs: [],
  },
  deadline: 1_900_000_600n,
  expiresAt: new Date(1_900_000_600_000),
} as const satisfies GalleryRedemptionQuote;

const callbacks = {
  quoteCurrent: false,
  onToggle: () => undefined,
  onOutputAssetChange: () => undefined,
  onApprove: () => undefined,
  onRedeem: () => undefined,
  onOwnershipRefresh: () => undefined,
  onQuoteRefresh: () => undefined,
};

describe("Society redemption accordion", () => {
  it("does not mount NFT cards while ownership discovery continues behind a collapsed accordion", () => {
    function UnexpectedCardMount(): ReactNode {
      throw new Error("collapsed NFT card mounted");
    }

    assert.doesNotThrow(() =>
      renderToStaticMarkup(
        <SocietyRedemptionAccordionView
          state={{
            status: "ready",
            tokens: [
              {
                tokenId: 1n,
                metadata: { status: "loading", name: null, image: null },
              },
            ],
          }}
          selectedIds={[]}
          outputAsset="ETH"
          quote={null}
          quoteLoading={false}
          quoteError={null}
          approved={false}
          locked={false}
          expanded={false}
          renderToken={() => <UnexpectedCardMount />}
          {...callbacks}
        />,
      ),
    );
  });

  it("renders disconnected, loading, empty, and error states", () => {
    const render = (
      state: Parameters<typeof SocietyRedemptionAccordionView>[0]["state"],
    ) =>
      renderToStaticMarkup(
        <SocietyRedemptionAccordionView
          state={state}
          selectedIds={[]}
          outputAsset="ETH"
          quote={null}
          quoteLoading={false}
          quoteError={null}
          approved={false}
          locked={false}
          {...callbacks}
        />,
      );

    assert.match(render({ status: "disconnected" }), /Connect a Base wallet/u);
    assert.match(render({ status: "loading" }), /Finding your Society NFTs/u);
    assert.match(render({ status: "empty" }), /do not own any Society NFTs/u);
    assert.match(
      render({ status: "error", message: "RPC unavailable" }),
      /RPC unavailable/u,
    );
  });

  it("keeps metadata failures selectable and disables the 33rd selection", () => {
    const selectedIds = Array.from({ length: 32 }, (_, index) =>
      BigInt(index + 1),
    );
    const html = renderToStaticMarkup(
      <SocietyRedemptionAccordionView
        state={{
          status: "ready",
          tokens: [
            {
              tokenId: 1n,
              metadata: { status: "ready", name: "First Society", image: null },
            },
            {
              tokenId: 40n,
              metadata: { status: "error", name: null, image: null },
            },
          ],
        }}
        selectedIds={selectedIds}
        outputAsset="WETH"
        quote={null}
        quoteLoading={false}
        quoteError={null}
        approved={false}
        locked={false}
        {...callbacks}
      />,
    );

    assert.match(html, /First Society/u);
    assert.match(html, /Society #40/u);
    assert.match(html, /Metadata unavailable/u);
    assert.match(html, /32 selected/u);
    assert.match(html, /value="WETH"/u);
    assert.match(html, /aria-label="Redemption output"/u);
    assert.match(html, /aria-haspopup="listbox"/u);
    assert.doesNotMatch(html, /<select/u);
    assert.match(html, /Society #40[\s\S]*disabled/u);
  });

  it("keeps a metadata-failure placeholder selectable below the cap", () => {
    const disabledStates: boolean[] = [];
    const html = renderToStaticMarkup(
      <SocietyRedemptionAccordionView
        state={{
          status: "ready",
          tokens: [
            {
              tokenId: 40n,
              metadata: { status: "error", name: null, image: null },
            },
          ],
        }}
        selectedIds={[]}
        outputAsset="ETH"
        quote={null}
        quoteLoading={false}
        quoteError={null}
        approved={false}
        locked={false}
        renderToken={(_token, _selected, disabled) => {
          disabledStates.push(disabled);
          return <div>Metadata placeholder card</div>;
        }}
        {...callbacks}
      />,
    );

    assert.match(html, /Metadata placeholder card/u);
    assert.deepEqual(disabledStates, [false]);
  });

  it("bounds the initially mounted NFT cards and offers progressive disclosure", () => {
    let mountedCards = 0;
    const html = renderToStaticMarkup(
      <SocietyRedemptionAccordionView
        state={{
          status: "ready",
          tokens: Array.from({ length: 888 }, (_, index) => ({
            tokenId: BigInt(index + 1),
            metadata: { status: "loading" as const, name: null, image: null },
          })),
        }}
        selectedIds={[]}
        outputAsset="ETH"
        quote={null}
        quoteLoading={false}
        quoteError={null}
        approved={false}
        locked={false}
        renderToken={() => {
          mountedCards += 1;
          return <div>Society card</div>;
        }}
        {...callbacks}
      />,
    );

    assert.equal(mountedCards, 64);
    assert.match(html, /Show more Society NFTs \(824 more\)/u);
  });

  it("shows approval first, then an irreversible review with formatted quote and burn action", () => {
    const approval = renderToStaticMarkup(
      <SocietyRedemptionAccordionView
        state={{ status: "ready", tokens: [] }}
        selectedIds={[4n, 17n]}
        outputAsset="USDC"
        quote={quote}
        quoteLoading={false}
        quoteError={null}
        approved={false}
        locked={false}
        {...callbacks}
        quoteCurrent
      />,
    );
    assert.match(approval, /Approve NFT redemption/u);
    assert.doesNotMatch(approval, /Burn 2 NFTs/u);

    const review = renderToStaticMarkup(
      <SocietyRedemptionAccordionView
        state={{ status: "ready", tokens: [] }}
        selectedIds={[4n, 17n]}
        outputAsset="USDC"
        quote={quote}
        quoteLoading={false}
        quoteError={null}
        approved
        locked={false}
        {...callbacks}
        quoteCurrent
      />,
    );
    assert.match(review, /Selected Society NFTs/u);
    assert.match(review, /#4, #17/u);
    assert.match(review, /irreversible/u);
    assert.match(review, /Estimated output/u);
    assert.match(review, /12.34 USDC/u);
    assert.match(review, /Minimum output/u);
    assert.match(review, /12 USDC/u);
    assert.match(review, /Checkout bonus: 124 FAME/u);
    assert.match(
      review,
      /already in checkout is included for the next successful redeemer/u,
    );
    assert.match(review, /Burn 2 NFTs/u);
  });

  it("formats ETH and WETH to four decimals and hides a zero bonus", () => {
    for (const outputAsset of ["ETH", "WETH"] as const) {
      const html = renderToStaticMarkup(
        <SocietyRedemptionAccordionView
          state={{ status: "ready", tokens: [] }}
          selectedIds={[4n]}
          outputAsset={outputAsset}
          quote={{
            ...quote,
            tokenIds: [4n],
            outputAsset,
            outputToken:
              outputAsset === "ETH"
                ? "0x0000000000000000000000000000000000000000"
                : WETH,
            estimatedOutput: 123_456_789_000_000_000n,
            minimumOutput: 120_000_000_000_000_000n,
            checkoutBonus: 0n,
          }}
          quoteLoading={false}
          quoteError={null}
          approved
          locked={false}
          {...callbacks}
          quoteCurrent
        />,
      );
      assert.match(html, new RegExp(`0\\.1234 ${outputAsset}`));
      assert.doesNotMatch(html, /Checkout bonus/u);
    }
  });

  it("makes an expired quote explicit and refreshable", () => {
    const html = renderToStaticMarkup(
      <SocietyRedemptionAccordionView
        state={{ status: "ready", tokens: [] }}
        selectedIds={[4n, 17n]}
        outputAsset="USDC"
        quote={quote}
        quoteLoading={false}
        quoteError={null}
        approved
        locked={false}
        {...callbacks}
      />,
    );

    assert.match(html, /redemption quote expired/u);
    assert.match(html, /Refresh quote/u);
    assert.doesNotMatch(html, /Burn 2 NFTs/u);
  });
});
