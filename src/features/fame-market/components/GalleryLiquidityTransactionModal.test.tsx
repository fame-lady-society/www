import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { GalleryLiquidityActionState } from "../transactions/liquidityAction";
import { GalleryLiquidityTransactionStatus } from "./GalleryLiquidityTransactionModal";

const refreshing: GalleryLiquidityActionState = {
  status: "confirmed_refreshing",
  call: { kind: "withdrawal", tokenId: 7n, maxPremium: 25n },
  approvalRequired: false,
  approvalHash: null,
  hash: `0x${"aa".repeat(32)}`,
  failure: { stage: "refresh", cause: new Error("RPC unavailable") },
};

describe("gallery liquidity transaction modal", () => {
  it("offers refresh-only recovery after confirmation and no dismiss action", () => {
    const html = renderToStaticMarkup(
      <GalleryLiquidityTransactionStatus
        state={refreshing}
        onRetryRefresh={() => undefined}
      />,
    );

    assert.match(html, /Transaction confirmed/i);
    assert.match(html, /Retry current-state refresh/i);
    assert.doesNotMatch(html, />Done</);
    assert.match(html, /aria-live="polite"/);
  });

  it("disables repeat recovery while the current refresh is in flight", () => {
    const html = renderToStaticMarkup(
      <GalleryLiquidityTransactionStatus
        state={refreshing}
        onRetryRefresh={() => undefined}
        refreshRetrying
      />,
    );

    assert.match(html, /disabled=""/);
    assert.match(html, /Refreshing current state/i);
    assert.doesNotMatch(html, /Retry current-state refresh/i);
  });
});
