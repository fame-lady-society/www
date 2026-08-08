import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { GalleryGlobalState } from "../types";
import {
  GalleryLiquidityCta,
  GalleryLiquidityEducationCard,
  GalleryProviderPositionCard,
} from "./GalleryLiquidityOverview";

const global: GalleryGlobalState = {
  marketplace: "0x1111111111111111111111111111111111111111",
  fame: "0x2222222222222222222222222222222222222222",
  mirror: "0x3333333333333333333333333333333333333333",
  creatorMagic: "0x4444444444444444444444444444444444444444",
  owner: "0x5555555555555555555555555555555555555555",
  paused: true,
  premium: 30n * 10n ** 18n,
  communityFee: 10n * 10n ** 18n,
  providerFee: 20n * 10n ** 18n,
  totalProviderUnits: 3n,
  activeProviderCount: 2n,
  activeProviderCap: 88n,
  feeRecipient: "0x6666666666666666666666666666666666666666",
  inventory: 5n,
  unit: 1_000_000n * 10n ** 18n,
};

describe("gallery liquidity overview", () => {
  it("keeps the gallery liquidity prompt compact", () => {
    const html = renderToStaticMarkup(<GalleryLiquidityCta />);
    assert.match(html, /Put your Society to work/);
    assert.match(html, /earn FAME on marketplace sales/);
    assert.match(html, /Stake your Society NFTs/);
    assert.doesNotMatch(html, /Pool inventory/i);
    assert.doesNotMatch(html, /equal-weight share/i);
    assert.doesNotMatch(html, /original token ID is not reserved/i);
    assert.doesNotMatch(html, /irreversible, uncredited donations/i);
  });

  it("keeps the live liquidity numbers on the staking overview", () => {
    const html = renderToStaticMarkup(
      <GalleryLiquidityEducationCard global={global} showCta={false} />,
    );
    assert.match(html, /Pool inventory/i);
    assert.match(html, /5 Society NFTs/);
    assert.match(html, /2 \/ 88/);
    assert.match(html, /30 FAME/);
    assert.match(html, /20 FAME/);
    assert.match(html, /10 FAME/);
    assert.match(html, /5 FAME per marketplace sale/);
    assert.doesNotMatch(html, /Stake your Society NFTs/);
  });

  it("shows a connected provider's credited units and current per-sale share", () => {
    const html = renderToStaticMarkup(
      <GalleryProviderPositionCard
        global={global}
        position={{
          status: "success",
          blockNumber: 99n,
          data: {
            account: "0x7777777777777777777777777777777777777777",
            unitCount: 2n,
            indexPlusOne: 1n,
            withdrawalPremium: 15n * 10n ** 18n,
          },
        }}
      />,
    );
    assert.match(html, /2 credited provider units/);
    assert.match(html, /13\.333333333333333333 FAME/);
    assert.match(html, /current share per marketplace sale/i);
    assert.match(html, /Add Society NFTs/);
    assert.match(html, /Exit liquidity/);
  });

  it("explains the deposit, sale earnings, and withdrawal terms", () => {
    const html = renderToStaticMarkup(
      <GalleryLiquidityEducationCard global={global} showCta={false} />,
    );
    assert.match(html, /whole Society NFT with its attached 1,000,000 FAME/i);
    assert.match(html, /earn FAME on every marketplace sale/i);
    assert.match(html, /different Society from the marketplace/i);
    assert.match(html, /premium reaches 0 after 24 hours/i);
    assert.match(html, /exit sooner by paying the current premium/i);
    assert.match(html, /irreversible, uncredited donations/i);
    assert.doesNotMatch(
      html,
      /remaining credited units|pseudorandom|free exit/i,
    );
  });
});
