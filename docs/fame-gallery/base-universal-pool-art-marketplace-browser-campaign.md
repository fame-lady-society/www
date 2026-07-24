# Base Universal Pool Art Marketplace Browser Campaign

Status: ready for disposable-wallet transaction testing

This is concise evidence for the localhost Base fork campaign. It is not a
deployment manifest, recovery journal, or production authorization.

## Proven

- `/fame/gallery` renders directly and remains absent from both site menus.
- The page is bound to chain ID `8453`, temporary marketplace
  `0x54e7E4F2d439Be599706f51068f7EB2ce2D2a27e`, and the same literal loopback
  RPC on the browser and server.
- Explicit fork mode rejects public Base fallbacks and bypasses the external
  indexed quote helper.
- On-chain `tokenURI` reads plus direct browser metadata requests render 92
  purchasable artworks with zero unavailable cards.
- The compact funding widget retains USDC, WETH, and native ETH choices.
- Confirmed swap hashes notify the gallery once, and the funding callback
  refreshes global, pool, and held discovery state.
- Approval, purchase, fulfillment, and verification requests use the runtime
  marketplace rather than the Base Sepolia TEST address.
- The Base owner view cannot link to the Base Sepolia TEST admin route.
- Remote metadata fetches keep one deadline through body consumption, cancel
  oversized streams, and stop when TanStack Query cancels an abandoned card.

## Observed but not a transaction pass

Entering a disconnected USDC amount reached the local quote handler with the
indexed helper disabled. The local optimizer timed out before completing a safe
route quote. That proves the fork routing decision, not a usable quote or swap.

## Pending disposable-wallet cases

- Direct FAME approval and purchase
- Native ETH to FAME, followed by the ordinary FAME purchase
- USDC to FAME, followed by the ordinary FAME purchase
- WETH route evaluation and purchase if the fork exposes an executable route
- Receipt, event, ownership, inventory, and one-shell readback after each case
- Fork teardown and disposable wallet reset

These cases are `not executed`. They require the user to connect a disposable
wallet to chain ID `8453` at `http://127.0.0.1:8545`. No production Base
transaction is authorized by this document.
