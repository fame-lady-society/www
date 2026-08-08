import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { Hash } from "viem";
import type { GalleryPurchaseState } from "../transactions/purchaseQueue";
import {
  GalleryPurchaseModalActions,
  GalleryPurchaseModalContent,
} from "./GalleryPurchaseModal";

const approvalHash = `0x${"a".repeat(64)}` as Hash;
const purchaseHash = `0x${"b".repeat(64)}` as Hash;
const runtimePresentation = {
  tokenSymbol: "FAME",
  networkName: "Base",
  explorerBaseUrl: "https://basescan.org",
} as const;

function state(overrides: Partial<GalleryPurchaseState>): GalleryPurchaseState {
  return {
    status: "idle",
    terms: null,
    approvalHash: null,
    purchaseHash: null,
    failure: null,
    acquisition: null,
    refreshFailure: null,
    ...overrides,
  };
}

describe("gallery purchase modal content", () => {
  it("contains no testnet presentation defaults", () => {
    const source = readFileSync(
      resolve(
        process.cwd(),
        "src/features/fame-market/components/GalleryPurchaseModal.tsx",
      ),
      "utf8",
    );

    assert.doesNotMatch(source, /\bTEST\b/);
    assert.doesNotMatch(source, /Base Sepolia/);
    assert.doesNotMatch(source, /sepolia\.basescan\.org/);
  });

  it("states the approval confirmation wait", () => {
    const html = renderToStaticMarkup(
      <GalleryPurchaseModalContent
        state={state({ status: "confirming_approval", approvalHash })}
        transactions={[{ kind: "FAME approval", hash: approvalHash }]}
        {...runtimePresentation}
      />,
    );

    assert.match(html, /Waiting for Base approval confirmation/);
  });

  it("states the purchase confirmation wait", () => {
    const html = renderToStaticMarkup(
      <GalleryPurchaseModalContent
        state={state({ status: "confirming_purchase", purchaseHash })}
        transactions={[{ kind: "gallery purchase", hash: purchaseHash }]}
        {...runtimePresentation}
      />,
    );

    assert.match(html, /Waiting for Base confirmation/);
  });

  it("shows confirmed transaction links without offering another purchase", () => {
    const currentState = state({
      status: "confirmed_unverified",
      approvalHash,
      purchaseHash,
      failure: {
        stage: "verification",
        cause: new Error("archive read unavailable"),
      },
    });
    const transactions = [
      { kind: "FAME approval", hash: approvalHash },
      { kind: "gallery purchase", hash: purchaseHash },
    ];
    const html = renderToStaticMarkup(
      <>
        <GalleryPurchaseModalContent
          state={currentState}
          transactions={transactions}
          {...runtimePresentation}
        />
        <GalleryPurchaseModalActions
          state={currentState}
          onDone={() => undefined}
        />
      </>,
    );

    assert.match(
      html,
      /Purchase transaction confirmed, but the delivered artwork could not be verified/,
    );
    assert.match(html, /archive read unavailable/);
    assert.match(html, new RegExp(`https://basescan\\.org/tx/${approvalHash}`));
    assert.match(html, new RegExp(`https://basescan\\.org/tx/${purchaseHash}`));
    assert.match(html, new RegExp(approvalHash));
    assert.match(html, new RegExp(purchaseHash));
    assert.doesNotMatch(html, /Retry purchase/i);
    assert.match(html, /Done/);
  });

  it("does not offer a transaction retry after a failed simulation", () => {
    const currentState = state({
      status: "error",
      terms: {} as GalleryPurchaseState["terms"],
      failure: {
        stage: "purchase_simulation",
        cause: new Error("simulation reverted"),
      },
    });
    const html = renderToStaticMarkup(
      <GalleryPurchaseModalActions
        state={currentState}
        onDone={() => undefined}
      />,
    );

    assert.doesNotMatch(html, /Retry purchase/i);
    assert.match(html, /Done/);
  });

  it("names an approval receipt timeout without redacting its public hash link", () => {
    const timeout = new Error(
      `Timed out while waiting for transaction with hash "${approvalHash}" to be confirmed.`,
    );
    timeout.name = "WaitForTransactionReceiptTimeoutError";
    const html = renderToStaticMarkup(
      <GalleryPurchaseModalContent
        state={state({
          status: "error",
          terms: {} as GalleryPurchaseState["terms"],
          approvalHash,
          failure: {
            stage: "approval_receipt",
            cause: timeout,
          },
        })}
        transactions={[{ kind: "FAME approval", hash: approvalHash }]}
        {...runtimePresentation}
      />,
    );

    assert.match(
      html,
      /Timed out while waiting for the FAME approval transaction to be confirmed/,
    );
    assert.doesNotMatch(html, /\[redacted-hex\]/);
    assert.match(html, new RegExp(approvalHash));
  });

  it("keeps each transaction link on one clipped line", () => {
    const html = renderToStaticMarkup(
      <GalleryPurchaseModalContent
        state={state({ approvalHash })}
        transactions={[{ kind: "FAME approval", hash: approvalHash }]}
        {...runtimePresentation}
      />,
    );

    assert.match(html, /white-space:nowrap/);
    assert.match(html, /overflow:hidden/);
    assert.match(html, /text-overflow:ellipsis/);
    assert.doesNotMatch(html, /overflow-wrap:anywhere/);
  });
});
