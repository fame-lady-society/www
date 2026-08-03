import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { GalleryGlobalState } from "../types";
import { GalleryStakeDepositContent } from "./GalleryStakeDepositView";

const global = {
  providerFee: 100n * 10n ** 18n,
  totalProviderUnits: 3n,
  activeProviderCount: 2n,
  activeProviderCap: 88n,
} as GalleryGlobalState;

describe("gallery stake deposit view", () => {
  it("keeps disconnected ownership honest and asks for a wallet", () => {
    const html = renderToStaticMarkup(
      <GalleryStakeDepositContent
        state={{ status: "disconnected" }}
        selectedIds={[]}
        global={global}
        providerUnitCount={0n}
        operatorApproved={false}
        busy={false}
        walletControl={<button>Connect wallet</button>}
        onToggle={() => undefined}
        onApprove={() => undefined}
        onDeposit={() => undefined}
      />,
    );
    assert.match(html, /Connect wallet/);
    assert.doesNotMatch(html, /Stake 0 Society NFTs/);
  });

  it("shows at most eight selected, resulting current share, and approval first", () => {
    const html = renderToStaticMarkup(
      <GalleryStakeDepositContent
        state={{
          status: "ready",
          tokens: [
            { tokenId: 1n, tokenUri: "data:token/1" },
            { tokenId: 2n, tokenUri: "data:token/2" },
          ],
        }}
        selectedIds={[1n, 2n]}
        global={global}
        providerUnitCount={0n}
        operatorApproved={false}
        busy={false}
        onToggle={() => undefined}
        onApprove={() => undefined}
        onDeposit={() => undefined}
        renderToken={(token, selected) => (
          <div>{`Society #${token.tokenId} ${selected ? "selected" : ""}`}</div>
        )}
      />,
    );
    assert.match(html, /2 selected \/ 8 maximum/);
    assert.match(html, /40 FAME per marketplace sale/);
    assert.match(html, /Approve Society NFTs/);
    assert.doesNotMatch(html, />Stake 2 Society NFTs</);
  });

  it("uses one atomic batch action after operator approval", () => {
    const html = renderToStaticMarkup(
      <GalleryStakeDepositContent
        state={{
          status: "ready",
          tokens: [{ tokenId: 1n, tokenUri: "data:token/1" }],
        }}
        selectedIds={[1n]}
        global={global}
        providerUnitCount={0n}
        operatorApproved
        busy={false}
        onToggle={() => undefined}
        onApprove={() => undefined}
        onDeposit={() => undefined}
        renderToken={() => <div>Society #1</div>}
      />,
    );
    assert.match(html, /Stake 1 Society NFT/);
    assert.match(html, /one atomic batch/i);
  });
});
