import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { FameFAQ } from "./FameFAQ";

const html = renderToStaticMarkup(<FameFAQ />);

describe("FAME FAQ", () => {
  it("answers the nine current product questions", () => {
    for (const question of [
      "What are FAME and Society?",
      "Why did a Society NFT appear or disappear?",
      "Why didn’t my Society NFT appear?",
      "How do I buy FAME or a Society NFT?",
      "Why do DeFi and marketplace prices differ?",
      "Can I transfer or redeem a Society NFT?",
      "How does the Rotator work?",
      "How does marketplace liquidity work?",
      "What network and contracts should I use?",
    ]) {
      assert.ok(html.includes(question));
    }

    assert.equal((html.match(/<h6/g) ?? []).length, 9);
  });

  it("explains the linked token, wallet readiness, and acquisition paths", () => {
    assert.match(html, /ERC-20/);
    assert.match(html, /ERC-721/);
    assert.match(html, /1,000,000 FAME/);
    assert.match(html, /smart accounts/i);
    assert.match(html, /readiness check/i);
    assert.match(html, /1 wei self-transfer/i);
    assert.match(html, /href="\/fame\/swap"/);
    assert.match(html, /href="\/fame\/market"/);
    assert.match(html, /FAME, ETH, or USDC/);
    assert.match(html, /ETH for Base gas/);
  });

  it("sets expectations for pricing, redemption, rotation, and liquidity", () => {
    assert.match(html, /exactly 1,000,000 FAME/);
    assert.match(html, /live marketplace premium/);
    assert.match(html, /irreversibl/);
    assert.match(html, /minimum output/);
    assert.match(html, /FIFO waiting pool/);
    assert.match(html, /transaction reverts and you keep your offered NFT/);
    assert.match(html, /provider fees/);
    assert.match(html, /not reserved for you/);
    assert.match(html, /reaches zero over 24 hours/);
    assert.match(html, /Never transfer an NFT directly to the marketplace/);
  });

  it("names the production network without retaining launch-era promotion", () => {
    assert.match(html, /Base chain 8453/);
    assert.match(html, /verified contract addresses above this FAQ/);
    assert.match(html, /Live prices, premiums, and availability can change/);

    assert.doesNotMatch(html, /July 12th 2024/i);
    assert.doesNotMatch(html, /free claim/i);
    assert.doesNotMatch(html, /presale/i);
    assert.doesNotMatch(html, /tally\.xyz/i);
    assert.doesNotMatch(html, /FAMEus DAO/i);
  });
});
