import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, it } from "node:test";
import type { Address } from "viem";
import { initialReadinessTransactionState } from "@/features/society-nft-readiness/transactionState";
import {
  FameRotatorAcquisitionView,
  formatFameShortfall,
  fameShortfallRawLabel,
} from "./FameRotatorAcquisition";
import {
  fameRotatorAcquisitionBranch,
  shouldOfferBuyMore,
} from "../hooks/useFameRotatorAcquisition";
import { projectFameRotatorPreflight, type FameRotatorPreflight } from "../state";
import type { OwnedTokenScanResult } from "../ownedTokens";

const ACCOUNT = "0x0000000000000000000000000000000000000aAa" as Address;
const UNIT = 1_000_000n * 10n ** 18n;

const emptyComplete: OwnedTokenScanResult = {
  status: "complete",
  account: ACCOUNT,
  blockNumber: 1n,
  balance: 0n,
  ownedIds: [],
};

const noop = () => undefined;

function preflightFor(input: {
  balance: bigint;
  skip: boolean;
  ownedIds?: number[];
}): FameRotatorPreflight {
  return projectFameRotatorPreflight({
    isConnected: true,
    account: ACCOUNT,
    ownership: {
      ...emptyComplete,
      ownedIds: input.ownedIds ?? [],
      balance: BigInt(input.ownedIds?.length ?? 0),
    },
    ownershipPending: false,
    fameBalance: { status: "success", data: input.balance },
    unit: { status: "success", data: UNIT },
    skipNft: { status: "success", data: input.skip },
  });
}

describe("FameRotatorAcquisitionView", () => {
  it("shows exact FAME shortfall outside the widget without auto-seed or exact-output promise", () => {
    const shortfall = UNIT / 4n;
    const preflight = preflightFor({ balance: UNIT - shortfall, skip: false });
    assert.equal(preflight.status, "needs_fame");
    if (preflight.status !== "needs_fame") return;

    const html = renderToStaticMarkup(
      createElement(FameRotatorAcquisitionView, {
        preflight,
        skipRepair: null,
        reconciliation: null,
        renderCompactSwap: false,
      }),
    );

    assert.match(html, /data-acquisition-branch="buy_fame"/);
    assert.match(html, /data-offer-buy-more="true"/);
    assert.match(html, /data-auto-seed="false"/);
    assert.match(html, /data-exact-output-guaranteed="false"/);
    assert.match(html, new RegExp(`data-shortfall="${shortfall.toString()}"`));
    assert.match(html, /data-testid="fame-shortfall"/);
    assert.match(html, /data-testid="fame-shortfall-raw"/);
    assert.match(html, new RegExp(fameShortfallRawLabel(shortfall)));
    assert.match(html, /Exact-input swaps do not guarantee this fill/i);
    assert.match(html, /not auto-seeded/i);
    assert.match(html, /data-exact-output-guaranteed="false"/);
    assert.doesNotMatch(html, /guaranteed fill|will exactly fill|exact-output fill is guaranteed/i);

    // Shortfall lives outside the compact widget placeholder.
    assert.match(html, /data-compact-swap-placeholder="true"/);
    assert.equal(formatFameShortfall(shortfall).includes("FAME"), true);
  });

  it("exposes reconciliation and never renders buy more when balance covers unit", () => {
    const preflight = preflightFor({ balance: UNIT, skip: false });
    assert.equal(preflight.status, "needs_reconciliation");
    assert.equal(shouldOfferBuyMore(preflight), false);
    assert.equal(fameRotatorAcquisitionBranch(preflight), "reconciliation");

    const html = renderToStaticMarkup(
      createElement(FameRotatorAcquisitionView, {
        preflight,
        skipRepair: null,
        reconciliation: {
          transactionState: initialReadinessTransactionState,
          onReconcile: noop,
        },
        renderCompactSwap: false,
      }),
    );

    assert.match(html, /data-acquisition-branch="reconciliation"/);
    assert.match(html, /data-offer-buy-more="false"/);
    assert.match(html, /Transfer 1 wei to myself/);
    assert.match(html, /do not buy more FAME/i);
    assert.doesNotMatch(html, /Buy FAME shortfall|data-shortfall|compact-swap/i);
    // Never recommend purchasing additional FAME.
    assert.doesNotMatch(html, /buy more FAME shortfall|recommend.*buy/i);
  });

  it("renders skip repair and never buy more while generation is disabled", () => {
    const preflight = preflightFor({ balance: 0n, skip: true });
    assert.equal(preflight.status, "needs_skip_repair");

    const html = renderToStaticMarkup(
      createElement(FameRotatorAcquisitionView, {
        preflight,
        skipRepair: {
          readiness: { status: "affected" },
          transactionState: initialReadinessTransactionState,
          onRepair: noop,
          onRetryDetection: noop,
          onRetryVerification: noop,
        },
        reconciliation: null,
        renderCompactSwap: false,
      }),
    );

    assert.match(html, /data-acquisition-branch="skip_repair"/);
    assert.match(html, /data-offer-buy-more="false"/);
    assert.match(html, /Society NFT generation is off for this wallet/);
    assert.match(html, /Enable Society NFT generation/);
    assert.doesNotMatch(html, /Buy FAME shortfall|data-shortfall/i);
    assert.doesNotMatch(html, /Transfer 1 wei to myself/);
  });

  it("hides acquisition when the wallet is already direct-eligible", () => {
    const preflight = preflightFor({
      balance: 0n,
      skip: true,
      ownedIds: [12],
    });
    assert.equal(preflight.status, "direct_eligible");

    const html = renderToStaticMarkup(
      createElement(FameRotatorAcquisitionView, {
        preflight,
        skipRepair: null,
        reconciliation: null,
        renderCompactSwap: false,
      }),
    );
    assert.equal(html, "");
  });

  it("recomputes remaining shortfall after a still-short purchase path", () => {
    const remaining = UNIT / 10n;
    const preflight = preflightFor({ balance: UNIT - remaining, skip: false });
    assert.equal(preflight.status, "needs_fame");
    if (preflight.status !== "needs_fame") return;

    const html = renderToStaticMarkup(
      createElement(FameRotatorAcquisitionView, {
        preflight,
        skipRepair: null,
        reconciliation: null,
        renderCompactSwap: false,
      }),
    );

    assert.match(html, new RegExp(`data-shortfall="${remaining.toString()}"`));
    assert.equal(preflight.shortfall, remaining);
  });
});
