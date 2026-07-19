import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { Address, Hash } from "viem";
import { decodeTestGalleryMetadata } from "../metadata/testMetadata";
import type { GalleryVerifiedAcquisition } from "../types";
import { AcquiredNftResult } from "./AcquiredNftResult";

function dataUri(mime: string, value: string) {
  return `data:${mime};base64,${Buffer.from(value).toString("base64")}`;
}

const transactionHash = `0x${"a".repeat(64)}` as Hash;
const result: GalleryVerifiedAcquisition = {
  transactionHash,
  receiptBlockNumber: 500n,
  deliveredShellId: 19n,
  artworkHash: `0x${"b".repeat(64)}` as Hash,
  unit: 1_000n * 10n ** 18n,
  premium: 25n * 10n ** 18n,
  total: 1_025n * 10n ** 18n,
  recipient: "0x1111111111111111111111111111111111111111" as Address,
  affectedTokenIds: [19n, 7n],
};

describe("acquired NFT result", () => {
  it("leads with artwork and verified settlement while hiding fulfillment", () => {
    const metadata = decodeTestGalleryMetadata(
      dataUri(
        "application/json",
        JSON.stringify({
          name: "Sunrise",
          image: dataUri(
            "image/svg+xml",
            '<svg xmlns="http://www.w3.org/2000/svg"/>',
          ),
        }),
      ),
    );
    const html = renderToStaticMarkup(
      <AcquiredNftResult result={result} metadata={metadata} />,
    );

    assert.match(html, /You got Sunrise/);
    assert.match(html, /Delivered token #19/);
    assert.match(html, /NFT unit: 1,000 TEST/);
    assert.match(html, /Premium: 25 TEST/);
    assert.match(html, /Paid: 1,025 TEST/);
    assert.match(html, new RegExp(transactionHash));
    assert.doesNotMatch(html, /mint|burn|held|source|route|path/i);
  });

  it("keeps verified facts and an accessible retry when artwork is unavailable", () => {
    const html = renderToStaticMarkup(
      <AcquiredNftResult
        result={result}
        metadata={decodeTestGalleryMetadata("broken")}
      />,
    );

    assert.match(html, /You got Acquired artwork/);
    assert.match(html, /Retry image/);
    assert.match(html, /verified purchase details/);
    assert.match(html, /tabindex="-1"/);
  });
});
