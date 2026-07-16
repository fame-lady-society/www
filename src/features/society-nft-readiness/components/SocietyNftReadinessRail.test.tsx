import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { Hash } from "viem";
import type { SocietyNftReadinessProjection } from "../state";
import {
  initialReadinessTransactionState,
  readinessTransactionError,
  readinessTransactionStatusCopy,
  type ReadinessTransactionState,
} from "../transactionState";
import {
  shouldOpenSocietyNftReadinessDialog,
  SOCIETY_NFT_READINESS_DIALOG_DESCRIPTION_ID,
  SOCIETY_NFT_READINESS_DIALOG_TITLE_ID,
  SocietyNftGenerationSettingView,
  SocietyNftMintedDialogContent,
  SocietyNftReadinessDialogContent,
  SocietyNftReadinessRailView,
} from "./SocietyNftReadinessRail";

const HASH = `0x${"1".repeat(64)}` as Hash;
const BASE_TRANSACTION_URL = `https://basescan.org/tx/${HASH}`;
const noop = () => undefined;

function renderRail({
  readiness = { status: "affected" },
  transactionState = initialReadinessTransactionState,
}: {
  readiness?: SocietyNftReadinessProjection;
  transactionState?: ReadinessTransactionState;
} = {}) {
  return renderToStaticMarkup(
    <SocietyNftReadinessRailView
      readiness={readiness}
      transactionState={transactionState}
      onRepair={noop}
      onRetryDetection={noop}
      onRetryVerification={noop}
    />,
  );
}

describe("Society NFT readiness rail", () => {
  it("renders the mandatory consequence-first warning with one repair action", () => {
    const html = renderRail();

    assert.match(html, /<aside/);
    assert.match(html, /aria-labelledby="society-nft-readiness-heading"/);
    assert.match(html, /Society NFT generation is off for this wallet/);
    assert.match(html, /Your account is a smart account/);
    assert.match(
      html,
      /By default, smart accounts do not generate Society NFTs/,
    );
    assert.match(
      html,
      /holding 1 million \$FAME will not generate a Society NFT/,
    );
    assert.match(html, /Enable Society NFT generation/);
    assert.equal((html.match(/<button/g) ?? []).length, 1);
    assert.match(html, /min-height:44px/);
    assert.doesNotMatch(html, /close|dismiss/i);
  });

  it("renders no warning for disconnected, checking, or unaffected wallets", () => {
    for (const status of ["disconnected", "checking", "unaffected"] as const) {
      assert.equal(renderRail({ readiness: { status } }), "", status);
    }
  });

  it("renders a neutral detection retry without claiming readiness", () => {
    const html = renderRail({ readiness: { status: "error" } });

    assert.match(html, /role="status"/);
    assert.match(html, /check Society NFT settings/);
    assert.match(html, /Retry readiness check/);
    assert.doesNotMatch(
      html,
      /Society NFT generation is (on|enabled)|wallet is ready/i,
    );
    assert.doesNotMatch(html, /Society NFT generation is off/);
  });

  it("announces each pending stage and disables the repair action", () => {
    const pendingStates: ReadinessTransactionState[] = [
      { status: "switching", hash: null, error: null },
      { status: "awaiting_wallet", hash: null, error: null },
      { status: "confirming", hash: HASH, error: null },
      { status: "verifying", hash: HASH, error: null },
    ];

    for (const transactionState of pendingStates) {
      const html = renderRail({
        transactionState,
      });

      const copy = readinessTransactionStatusCopy(transactionState);
      assert.ok(copy);
      assert.match(html, new RegExp(copy.title));
      assert.match(html, /role="status"/);
      assert.match(html, /aria-live="polite"/);
      assert.match(html, /<button[^>]*disabled/);
    }
  });

  it("preserves the rail and uses verification retry for readback failures", () => {
    const transactionState: ReadinessTransactionState = {
      status: "error",
      hash: HASH,
      error: readinessTransactionError("verification_failed"),
    };
    const html = renderRail({
      transactionState,
    });

    assert.match(html, /Society NFT generation is off for this wallet/);
    assert.match(html, /role="alert"/);
    assert.match(html, /aria-live="assertive"/);
    assert.match(html, /Transaction not completed/);
    assert.match(html, /Try verification again/);
    assert.doesNotMatch(html, /<button[^>]*disabled/);
  });

  it("uses a fresh repair retry for wallet and transaction failures", () => {
    const transactionState: ReadinessTransactionState = {
      status: "error",
      hash: null,
      error: readinessTransactionError("wallet_request_failed"),
    };
    const html = renderRail({ transactionState });

    assert.match(html, /Try again/);
    assert.doesNotMatch(html, /Try verification again/);
  });

  it("uses a fresh repair retry when the block-pinned readback mismatches", () => {
    const transactionState: ReadinessTransactionState = {
      status: "error",
      hash: HASH,
      error: readinessTransactionError("verification_mismatch"),
    };
    const html = renderRail({ transactionState });

    assert.match(html, /Try again/);
    assert.doesNotMatch(html, /Try verification again/);
  });

  it("uses fixed error copy without accepting provider details", () => {
    const transactionState: ReadinessTransactionState = {
      status: "error",
      hash: HASH,
      error: readinessTransactionError("receipt_failed"),
    };
    const html = renderToStaticMarkup(
      <SocietyNftReadinessRailView
        readiness={{ status: "affected" }}
        transactionState={transactionState}
        onRepair={noop}
        onRetryDetection={noop}
        onRetryVerification={noop}
      />,
    );

    assert.match(html, /The transaction could not be confirmed on Base/);
    assert.doesNotMatch(html, /hostile-rpc|secret request|0xdeadbeef/);
  });

  it("links only the matching hash through the fixed Base explorer origin", () => {
    const transactionState: ReadinessTransactionState = {
      status: "confirming",
      hash: HASH,
      error: null,
    };
    const html = renderRail({
      transactionState,
    });

    assert.match(
      html,
      new RegExp(`href="${BASE_TRANSACTION_URL.replaceAll("/", "\\/")}"`),
    );
    assert.match(html, /target="_blank"/);
    assert.match(html, /rel="noopener noreferrer"/);
  });
});

describe("Society NFT generation setting", () => {
  it("makes the inverted skipNFT values explicit for a smart account", () => {
    const html = renderToStaticMarkup(
      <SocietyNftGenerationSettingView
        generationEnabled
        transactionState={initialReadinessTransactionState}
        offsetForHeader
        onGenerationEnabledChange={noop}
      />,
    );

    assert.match(html, /Society NFT generation setting/);
    assert.match(html, /Generate Society NFTs/);
    assert.match(html, /setSkipNFT\(false\)/);
    assert.match(html, /setSkipNFT\(true\)/);
    assert.match(html, /checked/);
  });

  it("disables the setting while its transaction is pending", () => {
    const html = renderToStaticMarkup(
      <SocietyNftGenerationSettingView
        generationEnabled={false}
        transactionState={{ status: "confirming", hash: HASH, error: null }}
        offsetForHeader={false}
        onGenerationEnabledChange={noop}
      />,
    );

    assert.match(html, /disabled/);
    assert.match(html, /Waiting for Base confirmation/);
  });

  it("keeps the setting disabled until the live skip value refreshes", () => {
    const html = renderToStaticMarkup(
      <SocietyNftGenerationSettingView
        generationEnabled={false}
        generationRefreshing
        transactionState={{ status: "confirmed", hash: HASH, error: null }}
        offsetForHeader={false}
        onGenerationEnabledChange={noop}
      />,
    );

    assert.match(html, /disabled/);
    assert.match(html, /FAME now reflects your selection/);
  });
});

describe("verified post-fix guidance", () => {
  it("does not authorize a modal before both verification and confirmation", () => {
    const verified = {
      status: "verified" as const,
      branch: "future" as const,
      balance: 1n,
      unit: 2n,
      nftBalance: 0n,
      eligibleNftCount: 0n,
      nftDeficit: 0n,
    };

    assert.equal(
      shouldOpenSocietyNftReadinessDialog(
        { status: "verifying", hash: HASH, error: null },
        verified,
      ),
      false,
    );
    assert.equal(
      shouldOpenSocietyNftReadinessDialog(
        { status: "confirmed", hash: HASH, error: null },
        { status: "unresolved", reason: "readback" },
      ),
      false,
    );
    assert.equal(
      shouldOpenSocietyNftReadinessDialog(
        { status: "confirmed", hash: HASH, error: null },
        verified,
      ),
      true,
    );
  });

  it("renders future-receipt guidance with one explicit Done action", () => {
    const html = renderToStaticMarkup(
      <SocietyNftReadinessDialogContent
        branch="future"
        nftDeficit={0n}
        reconciliationState={initialReadinessTransactionState}
        onDone={noop}
        onReconcile={noop}
      />,
    );

    assert.match(html, /id="society-nft-readiness-dialog-title"/);
    assert.match(html, /id="society-nft-readiness-dialog-description"/);
    assert.match(html, /Society NFT generation is enabled/);
    assert.match(
      html,
      /future qualifying \$FAME receipts can generate Society NFTs/i,
    );
    assert.match(html, />Done</);
    assert.equal((html.match(/<button/g) ?? []).length, 1);
    assert.match(html, /min-height:44px/);
    assert.doesNotMatch(html, /1 wei|retroactive|self-transfer/i);
    assert.doesNotMatch(html, /close|dismiss/i);
  });

  it("offers a 1 wei self-transfer only when the wallet has an NFT deficit", () => {
    const html = renderToStaticMarkup(
      <SocietyNftReadinessDialogContent
        branch="catch_up"
        nftDeficit={1n}
        reconciliationState={initialReadinessTransactionState}
        onDone={noop}
        onReconcile={noop}
      />,
    );

    assert.match(html, /not retroactive/i);
    assert.match(html, /already holds at least 1 million \$FAME/i);
    assert.match(html, /receiving or self-transferring at least 1 wei/i);
    assert.match(html, /Society NFT reconciliation/i);
    assert.match(html, /1 Society NFT can be generated/i);
    assert.match(html, /Transfer 1 wei to myself/);
    assert.doesNotMatch(html, /href="\/fame\/swap"/);
    assert.doesNotMatch(html, /guarantee|will mint|will generate/i);
  });

  it("does not offer a write when the current NFT balance already matches", () => {
    const html = renderToStaticMarkup(
      <SocietyNftReadinessDialogContent
        branch="current"
        nftDeficit={0n}
        reconciliationState={initialReadinessTransactionState}
        onDone={noop}
        onReconcile={noop}
      />,
    );

    assert.match(html, /already matches this wallet/i);
    assert.match(html, /current \$FAME balance/i);
    assert.match(html, />Done</);
    assert.doesNotMatch(html, /Transfer 1 wei to myself/);
    assert.doesNotMatch(html, /href="\/fame\/swap"/);
  });

  it("shows transfer progress inside the catch-up dialog", () => {
    const html = renderToStaticMarkup(
      <SocietyNftReadinessDialogContent
        branch="catch_up"
        nftDeficit={2n}
        reconciliationState={{ status: "confirming", hash: HASH, error: null }}
        onDone={noop}
        onReconcile={noop}
      />,
    );

    assert.match(html, /2 Society NFTs can be generated/i);
    assert.match(html, /Transfer submitted/);
    assert.match(html, /<button[^>]*disabled/);
  });

  it("does not offer another write after a confirmed transfer mints nothing", () => {
    const html = renderToStaticMarkup(
      <SocietyNftReadinessDialogContent
        branch="catch_up"
        nftDeficit={1n}
        reconciliationState={{
          status: "error",
          hash: HASH,
          error: readinessTransactionError("mint_not_detected"),
        }}
        onDone={noop}
        onReconcile={noop}
      />,
    );

    assert.match(html, /Transfer confirmed/);
    assert.match(html, /No Society NFT was generated/);
    assert.match(html, />Done</);
    assert.doesNotMatch(html, /Try 1 wei transfer again/);
  });

  it("exposes stable dialog labels", () => {
    assert.equal(
      SOCIETY_NFT_READINESS_DIALOG_TITLE_ID,
      "society-nft-readiness-dialog-title",
    );
    assert.equal(
      SOCIETY_NFT_READINESS_DIALOG_DESCRIPTION_ID,
      "society-nft-readiness-dialog-description",
    );
  });
});

describe("minted Society NFT follow-up", () => {
  it("renders every NFT extracted from the self-transfer receipt", () => {
    const html = renderToStaticMarkup(
      <SocietyNftMintedDialogContent
        hash={HASH}
        nfts={[
          {
            tokenId: 41n,
            metadata: {
              image: "https://arweave.net/first.png",
              name: "Society Lady #41",
              description: null,
              error: null,
            },
          },
          {
            tokenId: 42n,
            metadata: {
              image: "/images/fame/gold-leaf-square.png",
              name: null,
              description: null,
              error: "metadata unavailable",
            },
          },
        ]}
        onDone={noop}
      />,
    );

    assert.match(html, /Your Society NFTs arrived/);
    assert.match(html, /Society Lady #41/);
    assert.match(html, /Society NFT #42/);
    assert.match(html, /first\.png/);
    assert.match(html, /gold-leaf-square\.png/);
    assert.match(html, new RegExp(BASE_TRANSACTION_URL.replaceAll("/", "\\/")));
    assert.match(html, />Done</);
  });
});
