import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { BASE_SEPOLIA_TEST_GALLERY_CONFIG } from "../config/baseSepoliaTestGallery";
import {
  MarketplaceLifecycleControl,
  PRIMARY_GALLERY_ADMIN_ACTIONS,
} from "./AdminMarketActions";
import { AdminWorkbenchView } from "./AdminWorkbench";

const config = BASE_SEPOLIA_TEST_GALLERY_CONFIG;
const owner = "0x0000000000000000000000000000000000000001" as const;
const feeRecipient = "0x0000000000000000000000000000000000000002" as const;

function authorizedMarkup(paused = false) {
  return renderToStaticMarkup(
    <AdminWorkbenchView
      state={{
        status: "authorized",
        account: owner,
        connectedChainId: 84_532,
        global: {
          status: "success",
          blockNumber: 44_400_000n,
          data: {
            marketplace: config.addresses.gallery,
            fame: config.addresses.fame,
            mirror: config.addresses.mirror,
            creatorMagic: config.addresses.creatorMagic,
            owner,
            paused,
            premium: 25n,
            feeRecipient,
            inventory: 2n,
            unit: 1_000_000n,
          },
        },
        isSwitching: false,
        onSwitchChain: () => undefined,
        actions: <div>Successor controls</div>,
      }}
    />,
  );
}

describe("TEST gallery admin workbench", () => {
  it("prompts disconnected visitors without rendering admin state", () => {
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

  it("keeps owner read failure distinct from access denial", () => {
    const html = renderToStaticMarkup(
      <AdminWorkbenchView
        state={{ status: "failure", onRetry: () => undefined }}
      />,
    );

    assert.match(html, /Could not check access/);
    assert.match(html, /read failure/i);
    assert.doesNotMatch(html, /Access denied/);
  });

  it("denies a confirmed non-owner without leaking the workbench", () => {
    const html = renderToStaticMarkup(
      <AdminWorkbenchView state={{ status: "denied" }} />,
    );

    assert.match(html, /Access denied/);
    assert.doesNotMatch(
      html,
      new RegExp(`${config.addresses.gallery}|premium|inventory`, "i"),
    );
  });

  it("shows the current owner, live state, premium, recipient, inventory, and explorer", () => {
    const html = authorizedMarkup();

    assert.match(html, /Live/);
    assert.match(html, /25 TEST/);
    assert.match(html, /2 NFTs/);
    assert.match(html, new RegExp(owner, "i"));
    assert.match(html, new RegExp(feeRecipient, "i"));
    assert.match(html, /View contract on BaseScan/);
    assert.match(html, /Successor controls/);
  });

  it("shows paused as canonical lifecycle state", () => {
    assert.match(authorizedMarkup(true), /Paused/);
  });

  it("renders one lifecycle toggle matching canonical state", () => {
    const live = renderToStaticMarkup(
      <MarketplaceLifecycleControl
        paused={false}
        busy={false}
        onToggle={() => undefined}
      />,
    );
    const paused = renderToStaticMarkup(
      <MarketplaceLifecycleControl
        paused
        busy={false}
        onToggle={() => undefined}
      />,
    );
    const unavailable = renderToStaticMarkup(
      <MarketplaceLifecycleControl
        paused={null}
        busy={false}
        onToggle={() => undefined}
      />,
    );

    assert.equal(live.match(/<button/g)?.length, 1);
    assert.match(live, /Pause marketplace/);
    assert.doesNotMatch(live, /Unpause marketplace/);
    assert.equal(paused.match(/<button/g)?.length, 1);
    assert.match(paused, /Unpause marketplace/);
    assert.match(unavailable, /disabled=""/);
  });

  it("exposes only the four successor calls across three operational controls", () => {
    assert.deepEqual(PRIMARY_GALLERY_ADMIN_ACTIONS, [
      "set_premium",
      "set_fee_recipient",
      "pause",
      "unpause",
    ]);
    assert.ok(
      PRIMARY_GALLERY_ADMIN_ACTIONS.every(
        (action) =>
          !/list|rotation|withdraw|scan|operator|ownership|rescue/.test(action),
      ),
    );
  });
});
