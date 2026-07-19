---
date: 2026-07-18
topic: universal-pool-art-marketplace
title: Universal Pool Art Marketplace Requirements
type: feat
---

# Universal Pool Art Marketplace Requirements

## Summary

Replace the listing-oriented TEST gallery with an artwork-first catalog of canonically fulfillable targets. Fulfillable artwork remains visible when the market is paused or its presentation cannot render, but purchase is unavailable in those states. A hidden live resolver may replace stale fulfillment routes while preserving the artwork the buyer selected, one Buy action carries the buyer through any required TEST approval and purchase request, the acquired-artwork result appears only after receipt-block verification, and a small owner-only route exposes the successor contract's operational controls. Shared presentation stays independent of the TEST payment implementation so a later production route can acquire FAME through the existing swap infrastructure.

---

## Problem Frame

The previous marketplace required operators to curate per-token listings, premiums, and artwork rotations. That model exposed administrative structure instead of letting a buyer choose the artwork they wanted.

The successor marketplace can fulfill artwork already held by the marketplace or artwork eligible through the Mint or Burn Pool. Those paths are contract mechanics, not product categories. The public experience should present one catalog of artwork available at one global price.

Marketplace custody is not currently enumerable. Discovering newly held artwork therefore requires a bounded scan of the 888-token collection, while the Mint and Burn Pool artwork can load as complete batches using existing product patterns.

---

## Key Decisions

- **Canonically fulfillable artwork only.** The public catalog excludes artwork the marketplace cannot fulfill and does not expose the broader collection as a browser. Paused or render-failed targets remain visible with purchase unavailable.
- **Artwork-first identity.** Artwork is the product identity; source, shell, and other token IDs stay out of the public catalog.
- **Invisible fulfillment.** Marketplace-held, Mint Pool, and Burn Pool artwork use the same cards and price presentation without origin labels.
- **Two-stage loading.** Pool artwork appears as one block-pinned initial batch, while marketplace-held artwork may append later in deterministic scan order after cached holdings and the block-pinned full custody scan are verified.
- **Disposable custody hints.** Previously discovered marketplace holdings may accelerate repeat visits, but current ownership must be verified before display.
- **Silent secondary failure.** Failure of the custody scan does not interrupt or qualify the pool-derived catalog.
- **No speculative aggregation.** Canonical targets remain separate entries even when two cards happen to render the same artwork.
- **Presentation trust boundary.** A target whose artwork cannot render remains visible but cannot be selected until its artwork loads successfully.
- **Replaceable fulfillment.** Held or pool routing and delivery-shell selection may change without interrupting the buyer while their selected artwork remains unchanged.
- **Artwork as consent.** The selected artwork hash is immutable buyer intent; a changed hash means that artwork is no longer available.
- **Maximum TEST spend.** The buyer-authorized maximum is the token's fixed `unit()` plus the displayed premium. The displayed premium becomes `maxPremium`, and settlement may use a lower current premium.
- **One sequential purchase.** One Buy action queues any required approval and the purchase, while the marketplace prevents carts and overlapping purchase flows.
- **No wallet eligibility rule.** The connected wallet is the recipient and `minBuyerMirrorBalanceAfter` remains zero.
- **Verified acquired result.** A successful receipt alone is not enough for the "You got" state; the purchase event, NFT transfer, receipt-block owner, and receipt-block artwork must reconcile.
- **Artwork-first result.** The acquired artwork leads the result while its delivered token ID, actual spend, recipient, and transaction link remain secondary.
- **Targeted post-purchase refresh.** Receipt-affected holdings and complete pool batches refresh after acquisition without another full collection scan.
- **Contract-owner administration.** The separate admin route follows the successor contract's current `owner()` exactly and does not preserve the previous marketplace's operator concept.
- **Operational controls only.** The admin UI supports premium, fee recipient, and pause state; ownership handover and non-core rescue remain script operations.
- **Contract lifecycle only.** The contract's `paused()` value is the sole market activation state; deployment flags and readiness gates do not participate.
- **TEST payment only in this slice.** The TEST route pays the marketplace directly in TEST and does not expose production payment tokens, quotes, or swaps.
- **Replaceable payment controller.** Shared catalog and acquired-result presentation depend on normalized artwork and payment state rather than TEST-specific transaction details.
- **Future one-button production payment.** A later controller may acquire FAME from FAME, USDC, WETH, or ETH and then re-resolve the selected artwork before purchase.
- **Merge-decision check, not a gate.** Wagmi generation, local browser inspection, and one signed TEST purchase inform the developer's merge decision without controlling route or deployment availability.

---

## Actors

- A1. **Public visitor:** Browses available artwork without needing to understand marketplace inventory or pool mechanics.
- A2. **Buyer:** Selects visible artwork after connecting a wallet in a later purchase flow.
- A3. **Marketplace stack:** Supplies current lifecycle state, artwork identity, fulfillment eligibility, and marketplace custody.
- A4. **Sponsored RPC provider:** Serves public reads without recurring idle-tab traffic.
- A5. **Contract owner:** Uses the separate TEST admin route for ordinary marketplace operation.
- A6. **Developer:** Runs the app locally against Base Sepolia and decides whether the implementation is ready to merge.

---

## Requirements

**Catalog contents and identity**

- R1. The clearly labeled public TEST route at `/fame/gallery/test` must show only artwork targets that are canonically fulfillable by the marketplace.
- R2. Marketplace-held, Mint Pool, and Burn Pool targets must use the same catalog presentation and global price.
- R3. The public catalog must not label fulfillment origin, marketplace inventory, pool membership, source IDs, or delivery shell IDs.
- R4. Catalog cards must use artwork metadata rather than token ID as their visible identity.
- R5. Each canonical target must remain a separate card without artwork-hash deduplication or quantity aggregation.
- R6. Art Pool and otherwise unavailable targets must not appear in the catalog.
- R7. A paused marketplace must remain browsable as a read-only catalog with one clear global paused state.

**Canonical loading and freshness**

- R8. Mint and Burn Pool artwork must appear as one coherent block-pinned initial catalog batch rather than streaming one card at a time. The route must use the app's existing loading state until that primary batch resolves, show an empty state only after a successful canonical read returns no targets, and use the existing retryable query-error presentation when global or pool reads fail.
- R9. Previously discovered marketplace holdings may be checked first, but only holdings that still belong to the marketplace may appear.
- R10. Every initial page load must perform one bounded block-pinned scan of token IDs 1 through 888 to discover current marketplace custody. A reverted or nonexistent `ownerOf` result must exclude that ID without aborting the remaining scan; only a successful owner read matching the marketplace establishes custody.
- R11. Newly discovered marketplace-held artwork must append once after the initial pool batch in deterministic scan order, without highlighting, reclassification, or reordering cards already visible in the page session.
- R12. Failure of the marketplace-custody scan must silently omit undiscovered held artwork while preserving the pool-derived catalog.
- R13. The full custody scan must not repeat on regained focus, scheduled polling, or background watching.
- R14. Reloading the page must begin a new initial custody scan.
- R15. Global marketplace state, each coherent catalog-membership projection, and individual artwork presentation must remain independently refreshable. Related reads within one projection must share a block boundary, while the resolver must perform current wagmi revalidation before preparing a purchase.
- R16. Cached catalog information must remain a disposable optimization rather than canonical truth.
- R17. An untouched visible tab must not generate continuing RPC reads.

**Artwork presentation failures**

- R18. A canonically fulfillable target whose metadata or image cannot render must appear as an artwork-unavailable card.
- R19. An artwork-unavailable card must offer a per-card retry without exposing a token ID fallback.
- R20. An artwork-unavailable card must not offer purchase until the artwork can be rendered.
- R21. Metadata failure must not change the underlying canonical fulfillment classification.
- R21a. Catalog controls, retry actions, the existing transaction modal, and admin forms must reuse the app's responsive and accessible component behavior, including keyboard operation, visible focus, status announcements, focus restoration, labels, and usable touch targets.

**Fulfillment routing**

- R22. Selecting artwork must resolve any currently contract-valid fulfillment route without asking the buyer to choose a path or delivery shell.
- R23. Fulfillment path, pool state, delivery shell, and routing changes must remain hidden from the buyer.
- R24. If the selected route becomes invalid before the purchase wallet prompt, the resolver must refresh canonical state and use another valid route when one exists.
- R25. A route or shell change must not interrupt the flow while the selected artwork, recipient, and buyer-visible purchase terms remain unchanged.
- R26. If every route is exhausted, the artwork must leave the buyable catalog and any active purchase flow must stop as unavailable. The existing transaction-error presentation must explain that the artwork is no longer available, unlock purchasing, and return focus to the catalog.
- R27. If the selected artwork hash changes, the flow must stop and remove the stale artwork rather than substituting its replacement, using the same unavailable-artwork return path.
- R28. Other catalog artwork whose hidden target changes must remain available when the resolver can find another valid route.
- R29. Ambiguous pool eligibility, Art Pool membership, ineligible sources, and unavailable shells must not be guessed into a fulfillment path.
- R30. Once purchase calldata has been submitted, a later route failure must require a fresh wallet-authorized retry rather than silent resubmission.

**One-button TEST purchase**

- R31. When a connected wallet enters the route, the app must reuse its existing page-load chain-switch behavior to request Base Sepolia. A disconnected Buy action must invoke the app's existing wallet-connect flow; connection cancellation or a rejected network switch must end the attempt before a purchase flow is started or locked and must use the existing wagmi error behavior.
- R32. After wallet connection and network selection succeed, one Buy action must begin the complete approval-and-purchase flow without requiring a second application button click.
- R33. The connected buyer wallet must be the purchase recipient, and the call must set `minBuyerMirrorBalanceAfter` to zero.
- R34. Selecting Buy must freeze the selected artwork hash, connected recipient, fixed TEST unit, and displayed premium as the buyer-authorized purchase terms.
- R35. The displayed premium must become `maxPremium` for the purchase call, and the maximum authorized TEST spend must equal the fixed TEST unit plus `maxPremium`.
- R36. A current premium at or below `maxPremium` may settle automatically; a premium above `maxPremium` must stop the flow for refreshed buyer consent.
- R37. If the current TEST allowance is sufficient for the maximum authorized TEST spend defined by R35, the flow must skip approval.
- R38. If the current TEST allowance is insufficient, the flow must request approval for exactly the fixed TEST unit plus `maxPremium`, rather than the allowance shortfall or an unlimited amount.
- R39. After approval is mined, the flow must wait for one block of confirmation before preparing the purchase.
- R40. If the follow-up allowance simulation cannot yet observe the approval, the flow may wait for up to three blocks before reporting the existing transaction error.
- R41. After approval confirmation, the flow must refresh hidden fulfillment state, simulate the current purchase request, and automatically open its wallet prompt when valid.
- R42. If approval succeeds but the purchase cannot proceed, the approval must remain in place and the buyer must be offered Retry purchase.
- R43. Retry purchase must recheck current allowance and must not request another approval while the existing allowance remains sufficient.
- R44. Only one marketplace purchase flow may be active at a time.
- R45. While a purchase flow is active, all marketplace purchase actions must remain locked until the flow succeeds, fails, or is rejected.
- R46. The catalog may remain browsable while purchase actions are locked, but it must not provide a cart, sequential shopping queue, or concurrent purchase.
- R47. Dismissing the existing transaction modal must not cancel a pending transaction or unlock marketplace purchase actions.
- R48. Approval and purchase failures must reuse the app's existing transaction-error handling and display flows.
- R49. The public purchase flow must not add special pricing, eligibility, or access behavior for the marketplace fee-recipient wallet.

**Verified acquired-artwork result**

- R50. The purchase receipt must reach one block of confirmation before acquired-artwork verification begins.
- R51. Verification must require exactly one `ArtworkPurchased` event emitted by the configured Base Sepolia marketplace and matching the submitted buyer, recipient, selected artwork hash, authorized price terms, and the successful inventory invariant `inventoryAfter >= inventoryBefore`.
- R52. Verification must require exactly one matching NFT transfer emitted by the configured Base Sepolia mirror from the marketplace to the recipient for the delivered shell in the same receipt.
- R53. A read at the canonical Base Sepolia receipt block must confirm that the recipient owns the delivered shell.
- R54. A receipt-block read must confirm that the delivered shell's artwork hash matches the artwork selected by the buyer.
- R55. The app must not show the "You got" result until R51-R54 all reconcile.
- R56. The verified result must lead with the acquired artwork and name, with delivered token ID, actual TEST paid, recipient, and Base Sepolia explorer link as secondary details.
- R57. The verified result must not expose held-versus-pool routing, source ID, or other fulfillment mechanics.
- R58. Failed verification reads or reconciliation must reuse the app's existing wagmi transaction-error handling and display flow without a gallery-specific error layer.
- R59. A completed purchase transaction must unlock marketplace purchase actions even when acquired-artwork verification reports an error.
- R60. The verified result must remain in the existing dismissible transaction modal and be reopenable through View purchase for the current page session.
- R61. If the acquired artwork image fails after the acquisition facts verify, the result must remain verified and show Artwork unavailable with a per-result Retry action.
- R62. After a verified purchase, the app must refresh global marketplace state and the complete Mint and Burn Pool batches.
- R63. The post-purchase refresh must use mirror NFT transfers from the purchase receipt to revalidate affected marketplace-held token IDs.
- R64. The post-purchase refresh must not repeat the full 888-token custody scan.

**Owner administration**

- R65. The TEST marketplace must retain a separate admin route at `/fame/gallery/test/admin`.
- R66. Admin-route access must be authorized exclusively by reading the successor marketplace's current `owner()`.
- R67. A connected non-owner wallet must receive Access denied rather than a read-only admin workbench.
- R68. A failed owner read must remain an access-read error rather than being presented as a confirmed denial.
- R69. The public gallery must show its Admin link only when the connected wallet matches the current contract owner.
- R70. The normal admin UI must expose only set premium, set fee recipient, and pause or unpause.
- R71. Ownership handover and paused rescue of non-core assets must not be exposed in the admin UI.
- R72. The admin route must show a compact canonical summary containing live or paused state, current premium, fee recipient, marketplace inventory, owner, and a marketplace explorer link.
- R73. When the connected owner enters the admin route, the app must reuse its existing page-load chain-switch behavior to request Base Sepolia.
- R74. Each admin form must show its current value and proposed value before submission.
- R75. Selecting an explicit admin action must simulate the exact contract call and proceed directly to the wallet prompt without another application review dialog or typed confirmation.
- R76. After an admin write is mined, the flow must wait for one block of confirmation and refresh the affected canonical state.
- R77. Confirmed admin state must display the newly read current value rather than treating the submitted value as canonical.
- R78. Admin transactions must reuse the app's existing transaction modal and wagmi transaction-error handling.
- R79. Execution-time contract authorization and named reverts must remain authoritative for premium, fee-recipient, authority, and lifecycle restrictions rather than duplicated frontend eligibility rules. Wagmi `owner()` reads control admin-route presentation, and wagmi simulation remains a preflight step before writes.
- R80. Public and admin market availability must follow the contract's `paused()` state without a deployment flag, readiness check, validation report, or other frontend activation gate.

**Payment boundary and local merge-decision check**

- R81. Every marketplace payment implemented in this TEST slice must settle directly in TEST.
- R82. The TEST route must not offer FAME, USDC, WETH, or ETH selection, production quotes, or swap execution.
- R83. Shared catalog cards and acquired-result components must consume normalized artwork, price, transaction status, and actual-spend presentation rather than importing TEST-specific contract execution.
- R84. TEST allowance, approval, and marketplace calls must remain owned by a TEST-specific payment controller.
- R85. The payment boundary must permit a future production controller to support direct FAME and FAME acquisition from USDC, WETH, or native ETH through the existing swap infrastructure.

**Deferred production constraints — no implementation or acceptance coverage in this TEST slice**

- R86. A future production alternative-token purchase must remain one application Buy flow that queues any required payment-token approval, FAME swap, and marketplace purchase wallet requests.
- R87. After a future FAME swap confirms, the production flow must refresh buyer ownership, selected artwork hash, fulfillment eligibility, marketplace shells, unit, premium, FAME balance, and allowance before preparing the marketplace purchase.
- R88. A future production flow must not submit a stale marketplace purchase when the preceding swap changed buyer ownership or the selected artwork's available route.

**Current TEST slice implementation and local merge-decision check**

- R89. `wagmi.config.ts` must include `UniversalPoolArtMarketplace.sol/**`, and generated bindings must be refreshed with `doppler run -- yarn wagmi generate`.
- R90. Generated wagmi output must contain the successor marketplace reads, writes, `ArtworkPurchased` event, and named errors used by the feature.
- R91. The developer's local merge-decision check must run the relevant feature checks and application build.
- R92. The local browser check must inspect `/fame/gallery/test` and `/fame/gallery/test/admin` against Base Sepolia.
- R93. The local browser check must exercise the current-owner workbench and a confirmed non-owner Access denied state.
- R94. The developer must complete one signed TEST purchase through any currently valid fulfillment route and inspect its verified acquired-artwork result before deciding whether to merge.
- R95. Automated feature coverage must exercise held, Mint Pool, and Burn Pool routing independently; the one signed browser purchase does not need to repeat all three paths.
- R96. The local check requires no exported report, persisted validation artifact, or prescribed merge decision.
- R97. Application behavior, route availability, and deployment must not depend on whether the local merge-decision check was run or passed.
- R98. The Base Sepolia manifest must supply deployment facts for the successor marketplace without acting as an environment, explorer-verification, activation, or validation gate.

---

## Key Flows

- F1. Initial catalog load

  - **Trigger:** A1 opens the marketplace route.
  - **Actors:** A1, A3, A4
  - **Steps:** The route reads global state, loads the complete pool-derived artwork batch against one block boundary, verifies cached marketplace holdings, and starts one block-pinned scan of token IDs 1 through 888. Verified cached holdings may appear early, and newly discovered holdings append once in deterministic scan order when the scan completes.
  - **Outcome:** The visitor receives a useful artwork catalog without waiting for marketplace custody discovery.
  - **Covered by:** R1-R17

- F2. Paused marketplace browsing

  - **Trigger:** A1 opens the route while marketplace purchases are paused.
  - **Actors:** A1, A3
  - **Steps:** The catalog loads normally and presents the marketplace's paused lifecycle state without exposing fulfillment mechanics.
  - **Outcome:** Artwork remains inspectable while purchase is contractually unavailable.
  - **Covered by:** R1-R7

- F3. Artwork presentation retry

  - **Trigger:** A catalog target is fulfillable but its artwork cannot render.
  - **Actors:** A1, A3
  - **Steps:** The route displays an artwork-unavailable card. The visitor retries that artwork without restarting the full catalog load.
  - **Outcome:** Successful metadata resolution restores the normal card; continued failure leaves the card unavailable.
  - **Covered by:** R18-R21

- F4. Hidden fulfillment resolution

  - **Trigger:** A2 selects visible artwork.
  - **Actors:** A2, A3
  - **Steps:** The marketplace stack resolves a held or pool path and selects any required delivery shell without exposing those choices.
  - **Outcome:** The buyer proceeds with the artwork they selected rather than choosing contract machinery.
  - **Covered by:** R22-R25, R29

- F5. Stale route recovery

  - **Trigger:** The selected path or shell becomes unavailable before the purchase wallet prompt.
  - **Actors:** A2, A3
  - **Steps:** The resolver refreshes canonical state and searches for another route while preserving the selected artwork and buyer-visible terms.
  - **Outcome:** The flow continues silently when another route exists or stops as unavailable when none remains.
  - **Covered by:** R24-R30

- F6. One-button purchase with approval

  - **Trigger:** A2 selects Buy with insufficient TEST allowance.
  - **Actors:** A2, A3
  - **Steps:** The app freezes the buyer-authorized artwork, recipient, fixed TEST unit, and premium ceiling; requests exact approval for the unit plus `maxPremium`; waits one confirmation; refreshes and simulates the hidden fulfillment route through wagmi; then automatically requests purchase authorization.
  - **Outcome:** The buyer completes the required transaction sequence from one application action while authorizing each wallet transaction.
  - **Covered by:** R32-R41

- F7. One-button purchase with existing allowance

  - **Trigger:** A2 selects Buy with sufficient TEST allowance.
  - **Actors:** A2, A3
  - **Steps:** The app freezes the buyer-authorized terms, skips approval, refreshes and simulates hidden fulfillment, and requests purchase authorization.
  - **Outcome:** The buyer is not asked for a redundant approval transaction.
  - **Covered by:** R32-R37, R41

- F8. Purchase recovery after approval

  - **Trigger:** Approval succeeds but purchase preparation or settlement fails.
  - **Actors:** A2, A3
  - **Steps:** The app presents the failure through the existing transaction flow, leaves the approval intact, and offers Retry purchase.
  - **Outcome:** Retry revalidates allowance, price, artwork, and fulfillment without restarting a valid approval.
  - **Covered by:** R36, R42-R43, R48

- F9. Single active purchase

  - **Trigger:** A2 has an approval or purchase transaction in progress.
  - **Actors:** A2, A3
  - **Steps:** The catalog remains inspectable, but all marketplace purchase actions stay locked even if the transaction modal is dismissed.
  - **Outcome:** The buyer must finish the active flow before beginning another purchase.
  - **Covered by:** R44-R47

- F10. Verified acquired-artwork result

  - **Trigger:** A2's purchase receipt reaches one confirmation.
  - **Actors:** A2, A3, A4
  - **Steps:** The app reconciles the matching `ArtworkPurchased` event from the configured Base Sepolia marketplace and marketplace-to-recipient NFT transfer from the configured mirror, then reads the delivered shell's owner and artwork hash at the canonical receipt block.
  - **Outcome:** A matching acquisition opens an artwork-first "You got" result in the existing transaction modal.
  - **Covered by:** R50-R57, R60

- F11. Acquired-result verification error

  - **Trigger:** The purchase transaction completes but a verification read or reconciliation fails.
  - **Actors:** A2, A3, A4
  - **Steps:** The app unlocks marketplace purchase actions and presents the error through the existing wagmi transaction-error flow.
  - **Outcome:** The app does not claim what the buyer received until verification succeeds.
  - **Covered by:** R55, R58-R59

- F12. Targeted post-purchase refresh

  - **Trigger:** The acquired-artwork result verifies.
  - **Actors:** A2, A3, A4
  - **Steps:** The app refreshes global state and the complete Mint and Burn Pool batches, then uses the receipt's NFT transfers to revalidate affected marketplace holdings.
  - **Outcome:** The catalog reflects the purchase without repeating the full 888-token custody scan.
  - **Covered by:** R62-R64

- F13. Admin access

  - **Trigger:** A connected wallet opens the TEST admin route.
  - **Actors:** A3, A4, A5
  - **Steps:** The route reads the current marketplace owner through wagmi. A matching wallet receives the compact workbench; a confirmed non-owner receives Access denied; a failed read remains an access-read error.
  - **Outcome:** Admin access mirrors the contract's authority without an operator role or public read-only workbench.
  - **Covered by:** R65-R69

- F14. Ordinary admin write

  - **Trigger:** A5 selects set premium, set fee recipient, pause, or unpause.
  - **Actors:** A3, A4, A5
  - **Steps:** The app displays current and proposed state, uses wagmi to simulate and submit the exact contract call, waits one confirmation, and refreshes the affected canonical read.
  - **Outcome:** The workbench displays the contract's newly read current value through the existing transaction flow.
  - **Covered by:** R70, R72-R79

- F15. Contract-controlled activation

  - **Trigger:** A5 unpauses or pauses the marketplace.
  - **Actors:** A1, A2, A3, A5
  - **Steps:** The owner submits the exact contract action and the app refreshes `paused()`.
  - **Outcome:** Purchase availability follows the confirmed contract state without another application gate.
  - **Covered by:** R76-R80

- F16. Direct TEST payment

  - **Trigger:** A2 selects Buy on the TEST route.
  - **Actors:** A2, A3
  - **Steps:** Shared presentation hands the selected normalized artwork and price to the TEST payment controller, which performs the exact TEST approval and marketplace purchase flow.
  - **Outcome:** The TEST route settles in TEST without loading production token or quote behavior.
  - **Covered by:** R81-R84

- F17. Deferred future production alternative-token payment

  - **Status:** Future design constraint only; no implementation or acceptance coverage is required in this TEST slice.
  - **Trigger:** A buyer later selects USDC, WETH, or ETH in a production marketplace.
  - **Actors:** A2, A3
  - **Steps:** The future production controller queues any required approval and FAME swap, waits for confirmation, refreshes buyer and marketplace state, and prepares a marketplace purchase only from the refreshed route.
  - **Outcome:** Alternative-token settlement preserves the one-button product flow without coupling swap mechanics to shared artwork presentation.
  - **Covered by:** R83, R85-R88

- F18. Local merge-decision check
  - **Trigger:** A6 evaluates the completed slice.
  - **Actors:** A1, A2, A3, A4, A5, A6
  - **Steps:** The developer regenerates wagmi bindings, runs relevant checks and the build, inspects both localhost routes and owner states, and completes one signed TEST purchase through any available route.
  - **Outcome:** The developer sees the verified acquired result and independently decides whether to merge; no application or deployment behavior records or depends on that decision.
  - **Covered by:** R89-R98

---

## Acceptance Examples

- AE1. Pool artwork before custody scan

  - **Covers:** R8-R12
  - **Given:** The pool batch is readable and the custody scan is still running.
  - **When:** The initial pool read completes.
  - **Then:** All pool-derived artwork appears together while marketplace-held artwork may join later.

- AE2. Valid cached marketplace holding

  - **Covers:** R9-R11, R16
  - **Given:** The browser remembers a previously marketplace-owned target.
  - **When:** Current ownership still identifies the marketplace.
  - **Then:** Its artwork may appear before the full custody scan completes.

- AE3. Failed custody scan

  - **Covers:** R12
  - **Given:** The pool catalog loaded and the full custody scan fails.
  - **When:** The page settles.
  - **Then:** The pool catalog remains visible without a custody-failure warning or completeness claim.

- AE4. Paused lifecycle

  - **Covers:** R7
  - **Given:** The marketplace reports that purchases are paused.
  - **When:** A visitor opens the catalog.
  - **Then:** The artwork remains visible beneath one global read-only paused state.

- AE5. Broken artwork

  - **Covers:** R18-R21
  - **Given:** A target is canonically fulfillable but its artwork cannot render.
  - **When:** Its catalog card is displayed.
  - **Then:** The card shows an artwork-unavailable state with Retry and no purchase action or token ID fallback.

- AE6. Identical-looking targets

  - **Covers:** R5
  - **Given:** Two canonical targets resolve to visually identical artwork.
  - **When:** Both are fulfillable.
  - **Then:** Both remain separate catalog cards without deduplication or quantity presentation.

- AE7. Regained focus

  - **Covers:** R13-R17
  - **Given:** The catalog completed its initial custody scan.
  - **When:** The visitor leaves and returns to the tab.
  - **Then:** The app does not repeat the full 888-token custody scan or begin recurring reads.

- AE8. Delivery shell becomes unavailable

  - **Covers:** R22-R25
  - **Given:** Pool fulfillment was prepared and its selected shell leaves marketplace custody.
  - **When:** Another valid marketplace shell exists before the purchase wallet prompt.
  - **Then:** The resolver selects the replacement shell and continues without exposing the change.

- AE9. Fulfillment path changes

  - **Covers:** R24-R25, R28
  - **Given:** Artwork moves between a pool-eligible position and marketplace custody.
  - **When:** The selected artwork hash and buyer-visible terms remain unchanged.
  - **Then:** The resolver uses the currently valid path without asking the buyer to understand the transition.

- AE10. Every route is exhausted

  - **Covers:** R26, R29
  - **Given:** Selected artwork no longer has a contract-valid fulfillment path.
  - **When:** Canonical routing is refreshed.
  - **Then:** Its card leaves the catalog, the existing transaction-error presentation reports that the artwork is unavailable, purchasing unlocks, and focus returns to the catalog.

- AE11. Selected artwork changes

  - **Covers:** R27
  - **Given:** The contract artwork hash no longer matches the artwork the buyer selected.
  - **When:** The flow revalidates before the purchase wallet prompt.
  - **Then:** The flow stops, removes the stale artwork, reports it as unavailable through the existing transaction-error presentation, and returns to the catalog without substituting the new artwork.

- AE12. Route failure after submission

  - **Covers:** R30
  - **Given:** Purchase calldata has already been submitted.
  - **When:** Settlement fails because its route is no longer valid.
  - **Then:** The app does not submit another purchase automatically and requires a fresh wallet-authorized retry.

- AE13. Existing TEST allowance

  - **Covers:** R32, R37, R41
  - **Given:** The connected buyer has sufficient TEST allowance for the maximum authorized spend.
  - **When:** The buyer selects Buy.
  - **Then:** The app skips approval and proceeds to the simulated purchase wallet request.

- AE14. Exact TEST approval

  - **Covers:** R32, R38-R41
  - **Given:** The connected buyer has insufficient TEST allowance.
  - **When:** The buyer selects Buy and confirms approval for exactly the fixed TEST unit plus `maxPremium`.
  - **Then:** The app waits one block, refreshes and simulates fulfillment, and opens the purchase wallet prompt without another application click.

- AE15. Premium changes during the queue

  - **Covers:** R34-R36
  - **Given:** The buyer selected Buy at a displayed premium.
  - **When:** The current premium decreases before purchase.
  - **Then:** The purchase may settle at the lower premium.
  - **And when:** The current premium instead increases above the displayed amount.
  - **Then:** The flow stops for refreshed buyer consent.

- AE16. Purchase unavailable after approval

  - **Covers:** R42-R43, R48
  - **Given:** Exact TEST approval succeeded.
  - **When:** No valid purchase can be prepared.
  - **Then:** The existing transaction flow reports the failure, keeps the approval intact, and offers Retry purchase without another approval while allowance remains sufficient.

- AE17. Attempted overlapping purchase

  - **Covers:** R44-R47
  - **Given:** A marketplace purchase flow is active.
  - **When:** The buyer browses another artwork or dismisses the transaction modal.
  - **Then:** The catalog remains inspectable, but no other purchase can begin until the active flow ends.

- AE18. Fee-recipient wallet

  - **Covers:** R49
  - **Given:** The connected buyer is also the contract's fee recipient.
  - **When:** The public catalog and purchase flow render.
  - **Then:** The app adds no wallet-specific access rule or special public pricing branch.

- AE19. Matching acquired artwork

  - **Covers:** R50-R57, R60
  - **Given:** A purchase receipt is one block confirmed with one matching `ArtworkPurchased` event from the configured Base Sepolia marketplace and one marketplace-to-recipient NFT transfer from the configured mirror.
  - **When:** Receipt-block reads confirm that the recipient owns the delivered shell with the selected artwork hash.
  - **Then:** The transaction modal shows "You got" with the artwork and name first and the delivered token ID, actual TEST paid, recipient, and explorer link as secondary details.

- AE20. Receipt succeeds but verification fails

  - **Covers:** R55, R58-R59
  - **Given:** The purchase transaction completed.
  - **When:** Its verification reads fail or its acquisition evidence does not reconcile.
  - **Then:** Marketplace purchase actions unlock, the existing wagmi error flow displays the failure, and no "You got" result appears.

- AE21. Verified artwork image fails

  - **Covers:** R61
  - **Given:** Ownership and artwork hash verification succeeded.
  - **When:** The result image cannot render.
  - **Then:** The modal retains the verified result, shows Artwork unavailable, preserves the secondary acquisition details, and offers Retry.

- AE22. Post-purchase catalog refresh

  - **Covers:** R62-R64
  - **Given:** An acquired-artwork result verifies.
  - **When:** The app refreshes the catalog.
  - **Then:** Global state and complete Mint and Burn Pool batches refresh, receipt-affected marketplace holdings are revalidated, and no full 888-token scan runs.

- AE23. Current owner opens admin

  - **Covers:** R65-R73
  - **Given:** The connected wallet matches the marketplace's current owner.
  - **When:** The wallet opens the admin route.
  - **Then:** The compact state summary and three operational controls are available, and the app requests Base Sepolia through its existing page-load switch behavior when needed.

- AE24. Non-owner opens admin

  - **Covers:** R66-R68
  - **Given:** The owner read succeeds and the connected wallet does not match.
  - **When:** The wallet opens the admin route.
  - **Then:** The route displays Access denied and does not render a read-only workbench.

- AE25. Confirmed premium update

  - **Covers:** R70, R74-R78
  - **Given:** The owner enters a proposed premium.
  - **When:** The exact `setPremium` call simulates, is authorized, and reaches one confirmation.
  - **Then:** The workbench refreshes and displays the contract's current premium without another application confirmation step.

- AE26. Contract rejects an admin input

  - **Covers:** R78-R79
  - **Given:** An admin input violates a contract requirement.
  - **When:** The exact call is simulated.
  - **Then:** The existing wagmi error flow presents the contract failure and the app does not invent a separate eligibility rule.

- AE27. Owner unpauses the marketplace

  - **Covers:** R76-R80
  - **Given:** The marketplace contract is paused.
  - **When:** The owner confirms `unpause` and the refreshed canonical read reports unpaused.
  - **Then:** Public purchase actions become available without consulting any deployment or readiness flag.

- AE28. TEST route payment presentation

  - **Covers:** R81-R84
  - **Given:** A visitor opens the TEST marketplace.
  - **When:** Artwork price and purchase actions render.
  - **Then:** The route presents TEST payment only and does not load FAME, USDC, WETH, ETH, quote, or swap controls.

- AE29. Deferred future swap changes marketplace inputs

  - **Status:** Future design constraint only; this is not acceptance coverage for the TEST slice.
  - **Covers:** R85-R88
  - **Given:** A future production buyer selects an alternative payment token and its FAME swap confirms.
  - **When:** Buyer ownership or artwork fulfillment changed during the swap.
  - **Then:** The production controller uses refreshed canonical state and does not submit the stale marketplace request.

- AE30. Developer's signed TEST check
  - **Covers:** R89-R98
  - **Given:** Generated bindings, relevant feature checks, the build, and both localhost routes are available.
  - **When:** The developer completes one signed TEST purchase through any current valid path.
  - **Then:** The local UI shows the verified acquired-artwork result, and the developer decides whether to merge without producing a report or changing any route gate.

---

## Scope Boundaries

The following are outside this catalog slice:

- Repairing or rewriting existing artwork metadata.
- Adding contract-side custody enumeration or transfer tracking.
- Showing marketplace inventory, pool membership, fulfillment path, token IDs, or available quantity on public catalog cards. This does not exclude the admin inventory summary or the delivered token ID in a verified purchase result.
- Deduplicating targets by artwork identity.
- Repeating the full custody scan on focus or through background polling.
- Reserving artwork or marketplace shells before settlement.
- Shopping carts, multi-item purchase queues, or concurrent marketplace transactions.
- A public fee-recipient purchasing mode or fee-recipient-specific presentation.
- Exportable validation reports or acquisition receipts beyond the explorer link.
- Persistent purchase history or restoring the acquired result after page reload.
- An operator role or frontend-defined admin authority.
- UI for ownership handover or paused non-core asset rescue.
- Deployment flags, readiness gates, or validation artifacts controlling route or purchase availability.
- Production FAME, USDC, WETH, or ETH payment selection, quoting, approvals, or swap execution.
- Persisting local validation status or automating the developer's merge decision.

Production payment conversion remains a future implementation behind the boundary defined here. R86-R88, F17, and AE29 record deferred constraints only and are not implementation or acceptance criteria for this TEST slice.

---

## Dependencies and Assumptions

- The contract remains authoritative for marketplace lifecycle, artwork identity, and fulfillment eligibility.
- Mint and Burn Pool membership can be read as bounded complete sets.
- Marketplace custody requires scanning the fixed token-ID domain 1 through 888 until the contract provides enumeration; missing or reverted ownership reads do not abort the remaining scan.
- Metadata resolution remains a replaceable presentation boundary and does not decide canonical fulfillment.
- Pool fulfillment depends on at least one currently marketplace-owned delivery shell.
- Contract simulation and named reverts remain authoritative for ambiguous or stale fulfillment state.
- Public RPC reads are sponsored, but idle tabs must remain quiet.
- TEST supports the standard allowance behavior required by the exact-approval flow.
- The app's existing page-load network switching, transaction modal, and transaction-error presentation remain reusable.
- `ArtworkPurchased` and mirror NFT transfer logs provide the delivered shell and receipt-level acquisition facts.
- The Base Sepolia RPC supports historical contract reads at the purchase receipt block.
- The successor marketplace exposes `owner()`, `paused()`, `premium()`, `feeRecipient()`, and `inventory()` as the canonical admin summary.
- The existing production FAME swap infrastructure remains the future source of FAME acquisition for USDC, WETH, and native ETH payments.
