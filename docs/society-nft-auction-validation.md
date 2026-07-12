# Society NFT Auction Validation

Use this runbook to validate the public bidder route against the current Base
fork, then repeat the identity checks before enabling a production auction. The
owner starts the auction outside this UI; `/fame/auction` intentionally exposes
only bidding and permissionless settlement.

## Current proof

As of 2026-07-12, direct fork probes confirmed:

- chain ID `8453` at `http://127.0.0.1:8545`
- deployed bytecode at `0x6536A328419785212BD4DA43F4E5155af60dB7D2`
- `SOCIETY_NFT()` equals `0xBB5ED04dD7B207592429eb8d599d103CCad646c4`
- `lifecycle()` equals `0` (`Unstarted`)
- the browser route at `http://localhost:3002/fame/auction` rendered “Auction
  has not started” without displaying token `144`

The fork was later stopped. Active-auction, real browser bid, replacement bid,
deadline, and settlement proof remain pending until the fork is restarted and
the owner calls `start(144)`.

## Local configuration

Use Doppler for the app's normal environment and override only these public
fork values in the shell. Do not commit them.

```bash
export RPC=http://127.0.0.1:8545
export AUCTION=0x6536A328419785212BD4DA43F4E5155af60dB7D2
export SOCIETY_NFT=0xBB5ED04dD7B207592429eb8d599d103CCad646c4

doppler run -- env \
  NEXT_PUBLIC_BASE_RPC_URL_1="$RPC" \
  NEXT_PUBLIC_SOCIETY_NFT_AUCTION_ADDRESS="$AUCTION" \
  yarn dev --port 3002
```

If Doppler is unavailable, supply the same two overrides plus only the public
environment values the app requires from your local environment. Never paste a
private key or secret-bearing RPC URL into a committed file or a public
`NEXT_PUBLIC_*` variable.

The injected browser wallet must also use `http://127.0.0.1:8545` as its Base
RPC with chain ID `8453`. Changing the app RPC does not redirect the wallet.
Import only disposable, funded Anvil accounts; do not connect a production
wallet or reuse a production private key.

## Contract and binding checks

Restart the fork, then run these probes before connecting a wallet:

```bash
cast chain-id --rpc-url "$RPC"
cast code "$AUCTION" --rpc-url "$RPC"
cast call "$AUCTION" "SOCIETY_NFT()(address)" --rpc-url "$RPC"
cast call "$AUCTION" "lifecycle()(uint8)" --rpc-url "$RPC"
cast call "$AUCTION" "owner()(address)" --rpc-url "$RPC"
```

Expected results are chain `8453`, non-empty auction bytecode, the Society NFT
address above, and lifecycle `0` before start. Stop if any identity check
differs.

Generate bindings normally from the sibling Foundry checkout:

```bash
doppler run -- npx wagmi generate
rg -n "societyNftAuctionAbi" src/wagmi/index.ts
git diff --exit-code -- src/wagmi/index.ts
```

The normal wagmi config also generates unrelated explorer-backed ABIs, so the
Etherscan key must be present (Doppler normally provides it). There is no pinned
contract revision or special codegen CI step. Generated output is committed in
`src/wagmi/index.ts`; a clean diff proves it is current.

## Start outside the webpage

The owner must start token `144` with their own contract workflow. For a local
Anvil owner key, the equivalent direct command is:

```bash
cast send "$AUCTION" "start(uint256)" 144 \
  --rpc-url "$RPC" \
  --private-key "$AUCTION_OWNER_PRIVATE_KEY"
```

Do not expose this key to the browser app. After the receipt, verify custody and
the authoritative timing:

```bash
cast call "$AUCTION" "lifecycle()(uint8)" --rpc-url "$RPC"
cast call "$AUCTION" "tokenId()(uint256)" --rpc-url "$RPC"
cast call "$AUCTION" "startTime()(uint256)" --rpc-url "$RPC"
cast call "$AUCTION" "endTime()(uint256)" --rpc-url "$RPC"
cast call "$SOCIETY_NFT" "ownerOf(uint256)(address)" 144 --rpc-url "$RPC"
```

Expect lifecycle `1`, token `144`, a three-day window, and `ownerOf(144)` equal
to the auction address. Refresh the route and confirm its artwork, status, bid
facts, and countdown agree.

## Browser bid flow

1. Open `http://localhost:3002/fame/auction` with a funded disposable Anvil
   account. The read-only auction must remain visible while disconnected.
2. Connect the wallet and wait for “Wallet is ready.” The page must block writes
   while its wallet-provider bytecode and `SOCIETY_NFT()` preflight is pending.
3. Enter a native ETH amount and place the first bid. Reject any wallet-added
   data or token approval; `bid()` is a payable native ETH call.
4. Record the submitted hash, wait for the confirmed receipt, and compare the UI
   to direct reads:

   ```bash
   cast receipt <first-bid-hash> --rpc-url "$RPC"
   cast call "$AUCTION" "highestBidder()(address)" --rpc-url "$RPC"
   cast call "$AUCTION" "highestBid()(uint256)" --rpc-url "$RPC"
   ```

5. Switch to a second funded disposable account and place a strictly higher
   bid. Verify its receipt and repeat the two direct reads. The refreshed UI
   must show the second bidder and exact winning bid.
6. Submit a stale/equal/lower amount after another bid lands. Simulation or the
   receipt must fail legibly, the page must refresh, and it must not claim the
   stale bidder is winning.

The bidder page must contain no refund warning, donation amount, or
`failedRefundDonations` state. Audit non-test runtime callsites with:

```bash
rg -n "failedRefundDonations" \
  src/features/society-nft-auction \
  --glob '!*.test.*'
```

Expected output: none. Do not add a direct `failedRefundDonations()` probe to
this runbook; it is not bidder-facing state.

## Exact deadline and settlement

Read the deadline, copy its decimal value into `END_TIME`, then mine a block at
that exact timestamp—not one second later:

```bash
cast call "$AUCTION" "endTime()(uint256)" --rpc-url "$RPC"
export END_TIME=<decimal-end-time>
cast rpc --rpc-url "$RPC" evm_setNextBlockTimestamp "$END_TIME"
cast rpc --rpc-url "$RPC" evm_mine
```

After the page refreshes, bidding must be disabled and `Settle auction` must be
available. Connect any funded non-owner Anvil account, settle from the webpage,
wait for its receipt, then verify:

```bash
cast receipt <settlement-hash> --rpc-url "$RPC"
cast call "$AUCTION" "lifecycle()(uint8)" --rpc-url "$RPC"
cast call "$AUCTION" "settledRecipient()(address)" --rpc-url "$RPC"
cast call "$AUCTION" "highestBid()(uint256)" --rpc-url "$RPC"
cast call "$SOCIETY_NFT" "ownerOf(uint256)(address)" 144 --rpc-url "$RPC"
```

Expect lifecycle `2`, the NFT recipient to equal the highest bidder (or owner
when there were no bids), and the UI's winning bid to equal `highestBid()`.
Settlement is permissionless; withdrawal and sweep remain owner-only workflows
outside this page.

## Browser failure and presentation matrix

Record each result before production handoff:

- Disconnected: all public auction facts remain visible; only execution is
  gated behind wallet connection.
- Wrong chain: writes are disabled and the wallet is prompted to switch to Base.
- Same chain, wrong wallet RPC: missing/different bytecode or collection blocks
  value-bearing actions even though both networks report `8453`.
- App RPC unavailable: the page shows a retryable read error and no write action.
- Rejected signature: rejection is visible, no success is claimed, and retry is
  available.
- Pending/refetching/stale: last-known facts may remain visible, but bid and
  settle controls stay disabled until authoritative reads refresh.
- Concurrent higher bid or settlement: revert/replacement state is legible and
  the page refreshes before claiming current leadership or settlement.
- Mobile and desktop: artwork/status precede the action panel; input labels,
  keyboard focus, errors, and transaction announcements remain usable in both
  light and dark themes.
- Scope: no start, owner withdrawal, sweep, FAME, WETH, approval, allowance, or
  reserve control is rendered.

## Production handoff

1. Build once with `NEXT_PUBLIC_SOCIETY_NFT_AUCTION_ADDRESS` absent and confirm
   `/fame/auction` fails safely as “Auction is not configured.”
2. After the production contract is deployed, set the production Base public
   RPC values and `NEXT_PUBLIC_SOCIETY_NFT_AUCTION_ADDRESS` in Vercel. Do not put
   secret-bearing server RPCs in public variables.
3. Rebuild and redeploy. Next.js embeds `NEXT_PUBLIC_*` values into the client
   bundle, so changing the environment without a rebuild is insufficient.
4. Against the production RPC, repeat `cast chain-id`, `cast code`,
   `SOCIETY_NFT()`, `lifecycle()`, and—after the owner starts—the token, custody,
   start, and end-time reads. Verify the configured public RPC is healthy.
5. Confirm disconnected rendering, wallet-provider identity preflight, and
   BaseScan links before announcing the route.
6. The owner continues to start, withdraw, and sweep through their own contract
   workflow. Do not add temporary admin controls to the public page.
