import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { Address, Hash } from "viem";
import type {
  AuctionActiveProjection,
  AuctionEndedProjection,
  AuctionSettledProjection,
  AuctionUnstartedProjection,
} from "../types";
import type { AuctionTransactionState } from "../transactionState";
import { AuctionActionPanel } from "./AuctionActionPanel";
import { AuctionHero, formatAuctionEth } from "./AuctionHero";
import { AuctionTransactionStatus } from "./AuctionTransactionStatus";

const auctionAddress = "0x6536A328419785212BD4DA43F4E5155af60dB7D2" as Address;
const societyNft = "0xBB5ED04dD7B207592429eb8d599d103CCad646c4" as Address;
const bidder = "0x1111111111111111111111111111111111111111" as Address;
const recipient = "0x2222222222222222222222222222222222222222" as Address;

const active: AuctionActiveProjection = {
  kind: "active",
  message: "Auction is live",
  auctionAddress,
  societyNft,
  lot: { tokenId: 144n },
  startTime: 1_000n,
  endTime: 2_000n,
  highestBidder: bidder,
  highestBid: 1_250_000_000_000_000_000n,
  canBid: true,
  canSettle: false,
};

const ended: AuctionEndedProjection = {
  ...active,
  kind: "ended_unsettled",
  message: "Auction ended — ready to settle",
  canBid: false,
  canSettle: true,
};

const settled: AuctionSettledProjection = {
  ...active,
  kind: "settled",
  message: "Auction settled",
  settledRecipient: recipient,
  winningBid: active.highestBid,
  canBid: false,
  canSettle: false,
};

const metadata = {
  image: "/images/fame/gold-leaf-square.png",
  name: "Society NFT #144",
  description: "A one-of-one Society NFT.",
  error: null,
};

function renderAction(
  projection: AuctionActiveProjection | AuctionEndedProjection,
  walletStatus: "disconnected" | "ready" = "ready",
  isRefreshing = false,
) {
  return renderToStaticMarkup(
    <AuctionActionPanel
      projection={projection}
      bidValue="1.5"
      walletStatus={walletStatus}
      walletMessage={
        walletStatus === "ready"
          ? "Wallet is ready."
          : "Connect your wallet to bid."
      }
      walletControl={
        walletStatus === "disconnected" ? <button>Connect wallet</button> : null
      }
      canBid={projection.canBid}
      canSettle={projection.canSettle}
      isPending={false}
      isRefreshing={isRefreshing}
    />,
  );
}

describe("Society NFT auction view", () => {
  it("renders exact ETH amounts without truncating meaningful wei", () => {
    assert.equal(formatAuctionEth(1n), "0.000000000000000001 ETH");
    assert.equal(
      formatAuctionEth(1_000_000_000_000_000_001n),
      "1.000000000000000001 ETH",
    );
  });

  it("keeps the active lot and bid facts visible while disconnected", () => {
    const hero = renderToStaticMarkup(
      <AuctionHero
        projection={active}
        metadata={metadata}
        remainingSeconds={3_661n}
      />,
    );
    const action = renderAction(active, "disconnected");

    assert.match(hero, /Live auction/);
    assert.match(hero, /Society NFT #144/);
    assert.match(hero, /1\.25 ETH/);
    assert.match(hero, /01:01:01/);
    assert.match(action, /Bid amount in ETH/);
    assert.match(action, /Connect wallet/);
  });

  it("renders the unstarted state without lot details or action controls", () => {
    const unstarted: AuctionUnstartedProjection = {
      kind: "unstarted",
      message: "Auction has not started",
      auctionAddress,
      societyNft,
      canBid: false,
      canSettle: false,
    };
    const html = renderToStaticMarkup(
      <AuctionHero
        projection={unstarted}
        metadata={{ ...metadata, name: "Must stay hidden" }}
        remainingSeconds={null}
      />,
    );

    assert.match(html, /Auction has not started/);
    assert.match(html, new RegExp(auctionAddress, "i"));
    assert.doesNotMatch(html, /Must stay hidden|Society NFT #144|button/i);
  });

  it("uses one labeled native ETH input in the live action", () => {
    const html = renderAction(active);

    assert.match(html, /Bid amount in ETH/);
    assert.match(html, /Native ETH on Base/);
    assert.match(html, /Bid with ETH/);
  });

  it("shows settlement action only after bidding ends", () => {
    const html = renderAction(ended);

    assert.match(html, /Close the auction/);
    assert.match(html, /Settle auction/);
    assert.doesNotMatch(html, /Bid amount in ETH/);
  });

  it("shows settled recipient, winning bid, and explorer links", () => {
    const html = renderToStaticMarkup(
      <AuctionHero
        projection={settled}
        metadata={metadata}
        remainingSeconds={0n}
      />,
    );

    assert.match(html, /Auction complete/);
    assert.match(html, /Winning bid/);
    assert.match(html, /1\.25 ETH/);
    assert.match(html, new RegExp(recipient.slice(0, 8), "i"));
    assert.match(html, /basescan\.org/);
  });

  it("keeps implementation and administrative language out of public states", () => {
    const markup = [
      renderToStaticMarkup(
        <AuctionHero
          projection={active}
          metadata={metadata}
          remainingSeconds={600n}
        />,
      ),
      renderAction(active),
      renderToStaticMarkup(
        <AuctionHero
          projection={ended}
          metadata={metadata}
          remainingSeconds={0n}
        />,
      ),
      renderAction(ended),
      renderToStaticMarkup(
        <AuctionHero
          projection={settled}
          metadata={metadata}
          remainingSeconds={0n}
        />,
      ),
    ].join(" ");
    const visibleText = markup.replace(/<[^>]*>/g, " ");

    assert.doesNotMatch(
      visibleText,
      /refund|donation|failedRefundDonations|FAME|WETH|approval|allowance|reserve|owner|start auction/i,
    );
  });

  it("announces loading, RPC failure, and refreshing states", () => {
    const loading = renderToStaticMarkup(
      <AuctionHero
        projection={{
          kind: "loading",
          message: "Loading auction",
          canBid: false,
          canSettle: false,
        }}
        metadata={null}
        remainingSeconds={null}
      />,
    );
    const failure = renderToStaticMarkup(
      <AuctionHero
        projection={{
          kind: "failure",
          message: "Auction is not configured",
          retryable: true,
          canBid: false,
          canSettle: false,
        }}
        metadata={null}
        remainingSeconds={null}
      />,
    );
    const refreshing = renderAction(active, "ready", true);

    assert.match(loading, /Loading auction/);
    assert.match(failure, /Auction unavailable/);
    assert.match(failure, /Auction is not configured/);
    assert.match(refreshing, /Updating the latest bid/);
  });

  it("renders pending, rejected, reverted, and confirmed transaction states", () => {
    const hash = `0x${"ab".repeat(32)}` as Hash;
    const states: Array<[AuctionTransactionState, RegExp]> = [
      [
        {
          status: "confirming",
          action: "bid",
          hash,
          replacement: null,
          error: null,
        },
        /Transaction submitted/,
      ],
      [
        {
          status: "error",
          action: "bid",
          hash: null,
          replacement: null,
          error: {
            kind: "wallet_rejected",
            message: "The wallet request was rejected.",
            retryable: true,
            shouldRefresh: false,
          },
        },
        /wallet request was rejected/,
      ],
      [
        {
          status: "error",
          action: "bid",
          hash,
          replacement: null,
          error: {
            kind: "receipt_reverted",
            message: "The transaction reverted onchain.",
            retryable: true,
            shouldRefresh: true,
          },
        },
        /transaction reverted onchain/,
      ],
      [
        {
          status: "confirmed",
          action: "settle",
          hash,
          replacement: null,
          error: null,
        },
        /Auction settled/,
      ],
    ];

    for (const [state, expected] of states) {
      const html = renderToStaticMarkup(
        <AuctionTransactionStatus state={state} />,
      );
      assert.match(html, expected);
    }
  });
});
