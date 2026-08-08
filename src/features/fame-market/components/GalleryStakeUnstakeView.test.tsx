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

const callbacks = {
  onSelect: () => undefined,
  onApproveWithdrawal: () => undefined,
  onWithdrawal: () => undefined,
};

describe("gallery stake unstake view", () => {
  it("keeps public inventory browseable without provider withdrawal controls", () => {
    const html = renderToStaticMarkup(
      <GalleryStakeUnstakeContent
        state={inventory}
        provider={{ status: "ready", unitCount: 0n }}
        selectedTokenId={null}
        premium={null}
        fameAllowance={{ status: "idle" }}
        busy={false}
        {...callbacks}
        renderToken={(token) => <div>{`Society #${token.tokenId}`}</div>}
      />,
    );
    assert.match(html, /Society #7/);
    assert.match(html, /Stake Society NFTs/);
    assert.doesNotMatch(html, /Withdraw Society|Approve .* FAME/);
  });

  it("shows the selected withdrawal premium and its decay window", () => {
    const html = renderToStaticMarkup(
      <GalleryStakeUnstakeContent
        state={inventory}
        provider={{ status: "ready", unitCount: 2n }}
        selectedTokenId={7n}
        premium={25n * 10n ** 18n}
        fameAllowance={{ status: "ready", amount: 0n }}
        busy={false}
        {...callbacks}
        renderToken={(token, selected) => (
          <button aria-pressed={selected}>{`Society #${token.tokenId}`}</button>
        )}
      />,
    );
    assert.match(html, /Approve 25 FAME/);
    assert.match(html, /Premium: 25 FAME\. Reaches 0 after 24 hours\./);
    assert.doesNotMatch(html, /remaining credited units|exiting unit|frozen/);
    assert.match(html, /aria-pressed="true"/);
    assert.doesNotMatch(html, /pseudorandom|no self-rebate/i);
  });

  it("rounds displayed premiums to the nearest whole FAME", () => {
    const html = renderToStaticMarkup(
      <GalleryStakeUnstakeContent
        state={inventory}
        provider={{ status: "ready", unitCount: 1n }}
        selectedTokenId={7n}
        premium={49_807n * 10n ** 18n + 291_666_666_666_666_667n}
        fameAllowance={{ status: "ready", amount: 0n }}
        busy={false}
        {...callbacks}
        renderToken={() => <div>Society #7</div>}
      />,
    );
    assert.match(html, /Premium: 49,807 FAME/);
    assert.match(html, /Approve 49,807 FAME/);
    assert.doesNotMatch(html, /291\.291|666666/);
  });

  it("withdraws with a zero ceiling without an approval action", () => {
    const html = renderToStaticMarkup(
      <GalleryStakeUnstakeContent
        state={inventory}
        provider={{ status: "ready", unitCount: 1n }}
        selectedTokenId={8n}
        premium={0n}
        fameAllowance={{ status: "ready", amount: 0n }}
        busy={false}
        {...callbacks}
        renderToken={() => <div>Society #8</div>}
      />,
    );
    assert.match(html, /Withdraw Society #8/);
    assert.match(html, /Premium: 0 FAME/);
    assert.doesNotMatch(html, /Reaches 0 after 24 hours/);
    assert.doesNotMatch(html, /Approve/);
  });

  it("fails closed while allowance is loading or unavailable", () => {
    const loading = renderToStaticMarkup(
      <GalleryStakeUnstakeContent
        state={inventory}
        provider={{ status: "ready", unitCount: 1n }}
        selectedTokenId={7n}
        premium={25n}
        fameAllowance={{ status: "loading" }}
        busy={false}
        {...callbacks}
        renderToken={() => <div>Society #7</div>}
      />,
    );
    assert.match(loading, /Checking FAME allowance/i);
    assert.doesNotMatch(loading, /Approve 25 FAME|Withdraw Society/);

    const failed = renderToStaticMarkup(
      <GalleryStakeUnstakeContent
        state={inventory}
        provider={{ status: "ready", unitCount: 1n }}
        selectedTokenId={7n}
        premium={25n}
        fameAllowance={{ status: "error", message: "Allowance unavailable" }}
        busy={false}
        {...callbacks}
        onRetryAllowance={() => undefined}
        renderToken={() => <div>Society #7</div>}
      />,
    );
    assert.match(failed, /Allowance unavailable/);
    assert.match(failed, /Retry allowance/);
    assert.doesNotMatch(failed, /Approve 25 FAME|Withdraw Society/);
  });

  it("retains stale visual selection as non-actionable during inventory failure", () => {
    const html = renderToStaticMarkup(
      <GalleryStakeUnstakeContent
        state={{ status: "error", message: "Inventory unavailable" }}
        provider={{ status: "ready", unitCount: 1n }}
        selectedTokenId={7n}
        premium={25n}
        fameAllowance={{ status: "ready", amount: 25n }}
        busy={false}
        {...callbacks}
        onRetry={() => undefined}
      />,
    );
    assert.match(html, /Selected Society #7/);
    assert.match(
      html,
      /selection is not actionable until inventory refreshes/i,
    );
    assert.doesNotMatch(html, /Withdraw Society #7/);
  });

  it("disables writes on a wallet-chain mismatch", () => {
    const html = renderToStaticMarkup(
      <GalleryStakeUnstakeContent
        state={inventory}
        provider={{ status: "ready", unitCount: 1n }}
        selectedTokenId={7n}
        premium={25n}
        fameAllowance={{ status: "ready", amount: 25n }}
        chainMismatch
        busy={false}
        {...callbacks}
        renderToken={() => <div>Society #7</div>}
      />,
    );
    assert.match(html, /wallet is connected to a different network/i);
    assert.doesNotMatch(html, /Withdraw Society #7/);
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
        premium={null}
        fameAllowance={{ status: "idle" }}
        busy={false}
        {...callbacks}
        renderToken={(token) => <div>{`Society #${token.tokenId}`}</div>}
      />,
    );
    assert.match(html, /Society #24/);
    assert.doesNotMatch(html, /Society #25/);
    assert.match(html, /Show more marketplace Society NFTs/);
  });

  it("does not call a failed provider-position read an empty position", () => {
    const html = renderToStaticMarkup(
      <GalleryStakeUnstakeContent
        state={inventory}
        provider={{ status: "error", message: "Position unavailable" }}
        selectedTokenId={null}
        premium={null}
        fameAllowance={{ status: "idle" }}
        busy={false}
        {...callbacks}
        onRetryPosition={() => undefined}
        renderToken={(token) => <div>{`Society #${token.tokenId}`}</div>}
      />,
    );
    assert.match(html, /Position unavailable/);
    assert.doesNotMatch(html, /no credited provider position/i);
  });
});
