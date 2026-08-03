import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { GalleryStakeUnstakeContent } from "./GalleryStakeUnstakeView";

const inventory = {
  status: "ready" as const,
  tokens: [
    { tokenId: 7n, tokenUri: "data:token/7" },
    { tokenId: 8n, tokenUri: "data:token/8" },
  ],
};

describe("gallery stake unstake view", () => {
  it("keeps public inventory browseable without misleading exit controls", () => {
    const html = renderToStaticMarkup(
      <GalleryStakeUnstakeContent
        state={inventory}
        provider={{ status: "ready", unitCount: 0n }}
        selectedTokenId={null}
        premium={25n * 10n ** 18n}
        fameAllowance={0n}
        busy={false}
        onSelect={() => undefined}
        onRandomWithdrawal={() => undefined}
        onApproveSelectedWithdrawal={() => undefined}
        onSelectedWithdrawal={() => undefined}
        renderToken={(token) => <div>{`Society #${token.tokenId}`}</div>}
      />,
    );
    assert.match(html, /Society #7/);
    assert.match(html, /Stake Society NFTs/);
    assert.doesNotMatch(html, /Receive one pseudorandom Society/);
    assert.doesNotMatch(html, /Confirm selected exit/);
  });

  it("gives providers a free pseudorandom exit and inline selected exit", () => {
    const html = renderToStaticMarkup(
      <GalleryStakeUnstakeContent
        state={inventory}
        provider={{ status: "ready", unitCount: 2n }}
        selectedTokenId={7n}
        premium={25n * 10n ** 18n}
        fameAllowance={0n}
        busy={false}
        onSelect={() => undefined}
        onRandomWithdrawal={() => undefined}
        onApproveSelectedWithdrawal={() => undefined}
        onSelectedWithdrawal={() => undefined}
        renderToken={(token, selected) => (
          <div>{`Society #${token.tokenId} ${selected ? "selected" : ""}`}</div>
        )}
      />,
    );
    assert.match(html, /Receive one pseudorandom Society/);
    assert.match(html, /no FAME cost/i);
    assert.match(html, /25 FAME directly/i);
    assert.match(html, /no self-rebate/i);
    assert.match(html, /Approve 25 FAME/);
    assert.doesNotMatch(html, /Confirm selected exit/);
  });

  it("confirms selected withdrawal inline when direct FAME allowance is ready", () => {
    const html = renderToStaticMarkup(
      <GalleryStakeUnstakeContent
        state={inventory}
        provider={{ status: "ready", unitCount: 1n }}
        selectedTokenId={8n}
        premium={25n}
        fameAllowance={25n}
        busy={false}
        onSelect={() => undefined}
        onRandomWithdrawal={() => undefined}
        onApproveSelectedWithdrawal={() => undefined}
        onSelectedWithdrawal={() => undefined}
        renderToken={() => <div>Society #8</div>}
      />,
    );
    assert.match(html, /Confirm selected exit/);
  });

  it("bounds initial metadata hydration while keeping the full inventory browseable", () => {
    const html = renderToStaticMarkup(
      <GalleryStakeUnstakeContent
        state={{
          status: "ready",
          tokens: Array.from({ length: 25 }, (_, index) => ({
            tokenId: BigInt(index + 1),
            tokenUri: `data:token/${index + 1}`,
          })),
        }}
        provider={{ status: "disconnected" }}
        selectedTokenId={null}
        premium={25n}
        fameAllowance={0n}
        busy={false}
        onSelect={() => undefined}
        onRandomWithdrawal={() => undefined}
        onApproveSelectedWithdrawal={() => undefined}
        onSelectedWithdrawal={() => undefined}
        renderToken={(token) => <div>{`Society #${token.tokenId}`}</div>}
      />,
    );
    assert.match(html, /Society #24/);
    assert.doesNotMatch(html, /Society #25/);
    assert.match(html, /Show more pool Society NFTs/);
  });

  it("does not call a failed provider-position read an empty position", () => {
    const html = renderToStaticMarkup(
      <GalleryStakeUnstakeContent
        state={inventory}
        provider={{ status: "error", message: "Position unavailable" }}
        selectedTokenId={null}
        premium={25n}
        fameAllowance={0n}
        busy={false}
        onSelect={() => undefined}
        onRandomWithdrawal={() => undefined}
        onApproveSelectedWithdrawal={() => undefined}
        onSelectedWithdrawal={() => undefined}
        onRetryPosition={() => undefined}
        renderToken={(token) => <div>{`Society #${token.tokenId}`}</div>}
      />,
    );
    assert.match(html, /Position unavailable/);
    assert.doesNotMatch(html, /no credited provider position/i);
    assert.doesNotMatch(html, /Receive one pseudorandom Society/);
  });

  it("blocks selected exits until the live premium is available", () => {
    const html = renderToStaticMarkup(
      <GalleryStakeUnstakeContent
        state={inventory}
        provider={{ status: "ready", unitCount: 1n }}
        selectedTokenId={7n}
        premium={null}
        fameAllowance={0n}
        busy={false}
        onSelect={() => undefined}
        onRandomWithdrawal={() => undefined}
        onApproveSelectedWithdrawal={() => undefined}
        onSelectedWithdrawal={() => undefined}
        onRetryGlobal={() => undefined}
        renderToken={(token) => <div>{`Society #${token.tokenId}`}</div>}
      />,
    );
    assert.match(html, /live FAME premium is unavailable/i);
    assert.doesNotMatch(html, /Approve .* FAME/);
    assert.doesNotMatch(html, /Confirm selected exit/);
  });
});
