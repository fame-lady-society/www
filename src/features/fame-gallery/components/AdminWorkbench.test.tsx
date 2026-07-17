import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { BASE_SEPOLIA_TEST_GALLERY_CONFIG } from "../config/baseSepoliaTestGallery";
import { AdminWorkbenchView } from "./AdminWorkbench";
import { TestBadge } from "./TestBadge";

const config = BASE_SEPOLIA_TEST_GALLERY_CONFIG;

describe("TEST gallery admin access", () => {
  it("prompts disconnected visitors without rendering diagnostics", () => {
    const html = renderToStaticMarkup(
      <AdminWorkbenchView
        state={{
          status: "disconnected",
          connectionControl: <button>Connect wallet</button>,
        }}
      />,
    );

    assert.match(html, /Connect wallet/);
    assert.doesNotMatch(html, new RegExp(config.addresses.gallery, "i"));
  });

  it("keeps authority read failure distinct from access denial", () => {
    const html = renderToStaticMarkup(
      <AdminWorkbenchView
        state={{
          status: "failure",
          onRetry: () => undefined,
        }}
      />,
    );

    assert.match(html, /Could not check access/);
    assert.match(html, /read failure/i);
    assert.doesNotMatch(html, /Access denied/);
  });

  it("denies an unrelated wallet without leaking the workbench", () => {
    const html = renderToStaticMarkup(
      <AdminWorkbenchView state={{ status: "denied" }} />,
    );

    assert.match(html, /Access denied/);
    assert.doesNotMatch(
      html,
      new RegExp(`${config.addresses.gallery}|accrued fees|inventory`, "i"),
    );
  });

  it("admits an operator on the wrong wallet chain and requests a switch only for writes", () => {
    const html = renderToStaticMarkup(
      <AdminWorkbenchView
        state={{
          status: "authorized",
          account: config.addresses.smokeRecipient,
          connectedChainId: 1,
          authority: "operator",
          global: {
            status: "success",
            blockNumber: 44_300_000n,
            data: {
              gallery: config.addresses.gallery,
              fame: config.addresses.fame,
              mirror: config.addresses.mirror,
              creatorMagic: config.addresses.creatorMagic,
              renderer: config.addresses.renderer,
              feeRecipient: config.addresses.feeRecipient,
              accruedProtocolFees: 1_000n * 10n ** 18n,
              unit: 1_000_000n * 10n ** 18n,
              inventory: 2n,
            },
          },
          isSwitching: false,
          onSwitchChain: () => undefined,
        }}
      />,
    );

    assert.match(html, /operator/);
    assert.match(html, new RegExp(config.addresses.gallery, "i"));
    assert.match(html, /Switch to Base Sepolia/);
    assert.match(html, /read access remains available/i);
  });

  it("renders the compact TEST identity badge", () => {
    const html = renderToStaticMarkup(<TestBadge />);

    assert.match(html, />TEST</);
  });
});
