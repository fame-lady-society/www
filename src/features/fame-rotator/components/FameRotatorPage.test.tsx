import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, it } from "node:test";
import type { Address, Hash } from "viem";
import { FameRotatorView } from "./FameRotatorView";
import { FameRotatorAcquisitionView } from "./FameRotatorAcquisition";
import { initialRotatorTransactionState } from "../transactionState";
import {
  ROTATION_EXCHANGE_EXPLANATION,
  type BurnPoolTargetResolution,
} from "../target";
import { projectFameRotatorPreflight } from "../state";
import type { OwnedTokenScanResult } from "../ownedTokens";

const ACCOUNT = "0x0000000000000000000000000000000000000aAa" as Address;
const HASH = `0x${"a".repeat(64)}` as Hash;
const UNIT = 1_000_000n * 10n ** 18n;

const available: BurnPoolTargetResolution = {
  status: "available",
  tokenId: 42,
  raw: "42",
  index: 2,
  position: 3,
  maxRotations: 3,
  blockNumber: 1_000n,
  image: "/images/fame/gold-leaf-square.png",
};

const emptyTx = initialRotatorTransactionState;

function renderView(
  overrides: Partial<Parameters<typeof FameRotatorView>[0]> = {},
) {
  return renderToStaticMarkup(
    createElement(FameRotatorView, {
      resolution: available,
      walletStatus: "ready",
      walletMessage: "Wallet is ready.",
      ownedIds: [7, 12],
      selectedOfferedId: 12,
      authorized: false,
      canApprove: true,
      canRotate: false,
      isPending: false,
      transactionState: emptyTx,
      ...overrides,
    }),
  );
}

describe("FameRotatorView", () => {
  it("disconnected rendering explains the exchange and offers connection without write actions", () => {
    const html = renderView({
      walletStatus: "disconnected",
      walletMessage: "Connect your wallet to rotate.",
      walletControl: createElement("button", null, "Connect wallet"),
      ownedIds: [],
      selectedOfferedId: null,
      canApprove: false,
      canRotate: false,
      authorized: null,
    });

    assert.match(html, /data-wallet-status="disconnected"/);
    assert.match(html, /data-testid="rotation-exchange-explanation"/);
    assert.ok(html.includes(ROTATION_EXCHANGE_EXPLANATION.slice(0, 40)));
    assert.match(html, /Connect wallet/);
    assert.match(html, /data-testid="disconnected-guidance"/);
    assert.match(html, /data-testid="write-actions-hidden"/);
    assert.doesNotMatch(html, /data-testid="approve-button"/);
    assert.doesNotMatch(html, /data-testid="rotate-button"/);
    assert.match(html, /Society #42/);
    assert.match(html, /FIFO position 3/);
  });

  it("wrong-chain rendering offers Base switching and preserves the target", () => {
    const html = renderView({
      walletStatus: "wrong_chain",
      walletMessage: "Switch your wallet to Base.",
      walletControl: createElement("button", null, "Switch to Base"),
      ownedIds: [],
      selectedOfferedId: null,
      canApprove: false,
      canRotate: false,
    });

    assert.match(html, /data-wallet-status="wrong_chain"/);
    assert.match(html, /Switch to Base/);
    assert.match(html, /data-testid="wrong-chain-guidance"/);
    assert.match(html, /data-preserved-target="42"/);
    assert.match(html, /Society #42/);
    assert.doesNotMatch(html, /data-testid="approve-button"/);
  });

  it("complete inventory renders selectable offered cards paired against the target", () => {
    const html = renderView({
      ownedIds: [7, 12, 88],
      ownedTokenImages: {
        7: "https://images.example/7.png",
        12: "https://images.example/12.png",
        88: "https://images.example/88.png",
      },
      selectedOfferedId: 12,
    });

    assert.match(html, /data-testid="offered-inventory"/);
    assert.match(html, /data-testid="offered-inventory-grid"/);
    assert.match(html, /data-count="3"/);
    assert.match(html, /data-offered-option="7"/);
    assert.match(html, /data-offered-option="12"/);
    assert.match(html, /data-offered-option="88"/);
    assert.match(html, /data-offered-image="https:\/\/images\.example\/12\.png"/);
    assert.match(html, /data-selected="true"/);
    assert.match(html, /data-testid="target-offered-comparison"/);
    assert.match(html, /data-token-card="target"/);
    assert.match(html, /data-token-card="you-offer"/);
    assert.match(html, /data-token-id="12"/);
    assert.match(html, /aria-label="Offer Society NFT 12"/);
    // Image artwork is present for each selectable option.
    assert.match(html, /alt="Society NFT 7"/);
    assert.match(html, /alt="Society NFT 12"/);
    assert.match(html, /alt="Society NFT 88"/);
  });

  it("keeps offered tokens selectable when metadata images fall back", () => {
    const html = renderView({
      ownedIds: [7],
      ownedTokenImages: {},
      selectedOfferedId: 7,
    });

    assert.match(html, /data-offered-option="7"/);
    assert.match(html, /data-offered-image="\/images\/fame\/gold-leaf-square\.png"/);
    assert.match(html, /aria-label="Offer Society NFT 7"/);
  });

  it("approval completion preserves target/offered selection while requiring separate Rotate", () => {
    const html = renderView({
      selectedOfferedId: 12,
      authorized: true,
      canApprove: false,
      canRotate: true,
      transactionState: {
        ...emptyTx,
        status: "verified",
        action: "approve",
        hash: HASH,
        effectiveHash: HASH,
      },
    });

    assert.match(html, /data-target-id="42"/);
    assert.match(html, /data-selected="true"/);
    assert.match(html, /data-token-id="12"/);
    assert.match(html, /data-can-approve="false"/);
    assert.match(html, /data-can-rotate="true"/);
    assert.match(html, /data-authorized="true"/);
    assert.match(html, /data-testid="approve-button"/);
    assert.match(html, /data-testid="rotate-button"/);
    assert.match(html, /disabled=""/); // approve disabled
    assert.match(html, /Approval confirmed|data-status="verified"/);
  });

  it("target unavailable, offered transferred away, and incomplete inventory disable writes with recovery", () => {
    const unavailable: BurnPoolTargetResolution = {
      status: "unavailable",
      tokenId: 42,
      raw: "42",
      returnHref: "/fame",
    };
    const unavailableHtml = renderToStaticMarkup(
      createElement(FameRotatorView, {
        resolution: unavailable,
        walletStatus: "ready",
        walletMessage: "Wallet is ready.",
        ownedIds: [12],
        selectedOfferedId: 12,
        authorized: true,
        canApprove: false,
        canRotate: false,
        isPending: false,
        transactionState: emptyTx,
      }),
    );
    assert.match(unavailableHtml, /data-resolution="unavailable"/);
    assert.match(unavailableHtml, /not in the burn pool/);
    assert.match(unavailableHtml, /Return to the burn pool/);
    assert.doesNotMatch(unavailableHtml, /data-testid="write-actions"/);

    const transferred = renderView({
      ownedIds: [7], // 12 gone
      selectedOfferedId: null,
      inventoryMessage:
        "The offered Society NFT is no longer in your inventory. Select another.",
      canApprove: false,
      canRotate: false,
    });
    assert.match(transferred, /data-testid="inventory-message"/);
    assert.match(transferred, /no longer in your inventory/);
    assert.match(transferred, /data-can-approve="false"/);
    assert.match(transferred, /data-can-rotate="false"/);

    const incomplete = renderView({
      ownedIds: [],
      selectedOfferedId: null,
      inventoryMessage:
        "Ownership scan is incomplete. Retry before selecting an offered NFT.",
      canApprove: false,
      canRotate: false,
    });
    assert.match(incomplete, /incomplete/i);
    assert.doesNotMatch(incomplete, /data-testid="offered-inventory"/);
  });

  it("compact acquisition branches render only for no-NFT states", () => {
    const emptyComplete: OwnedTokenScanResult = {
      status: "complete",
      account: ACCOUNT,
      blockNumber: 1n,
      balance: 0n,
      ownedIds: [],
    };
    const needsFame = projectFameRotatorPreflight({
      isConnected: true,
      account: ACCOUNT,
      ownership: emptyComplete,
      ownershipPending: false,
      fameBalance: { status: "success", data: UNIT / 2n },
      unit: { status: "success", data: UNIT },
      skipNft: { status: "success", data: false },
    });
    assert.equal(needsFame.status, "needs_fame");

    const acquisitionHtml = renderToStaticMarkup(
      createElement(FameRotatorAcquisitionView, {
        preflight: needsFame,
        skipRepair: null,
        reconciliation: null,
        renderCompactSwap: false,
      }),
    );
    assert.match(acquisitionHtml, /data-acquisition-branch="buy_fame"/);

    const withNfts = renderView({
      ownedIds: [12],
      selectedOfferedId: 12,
      acquisitionSlot: null,
    });
    assert.doesNotMatch(withNfts, /data-acquisition-branch/);

    const noNftPage = renderView({
      ownedIds: [],
      selectedOfferedId: null,
      acquisitionSlot: createElement(FameRotatorAcquisitionView, {
        preflight: needsFame,
        skipRepair: null,
        reconciliation: null,
        renderCompactSwap: false,
      }),
    });
    assert.match(noNftPage, /data-acquisition-branch="buy_fame"/);
  });

  it("exposes bound, keyboard-friendly controls, and mobile stacking hooks", () => {
    const html = renderView();
    assert.match(html, /data-max-rotations="3"/);
    assert.match(html, /maxRotations = 3/);
    assert.match(html, /aria-label="Approve offered Society NFT for rotator"/);
    assert.match(html, /aria-label="Rotate offered Society NFT for target"/);
    assert.match(html, /aria-pressed="true"/);
    assert.match(html, /minHeight:44|min-height:\s*44/);
  });
});
