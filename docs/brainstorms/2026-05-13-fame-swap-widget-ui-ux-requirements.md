---
date: 2026-05-13
topic: fame-swap-widget-ui-ux
origin: docs/ideation/2026-05-13-fame-swap-widget-ui-ux-hardening-ideation.md
status: ready-for-planning
---

# FAME Swap Widget UI/UX Requirements

## Problem Frame

The current `/fame/swap` beta proves the router, quote, readiness, approval, swap, and receipt plumbing, but the visible widget still feels like a technical diagnostic panel. A Fame Lady Society user should understand the widget as a FAME buy/sell tool, see the expected output and route clearly, control real swap risk, and move through approval and swap submission without losing context.

The next pass should turn the beta into a comprehensive, user-friendly FAME swap widget while preserving the live Base router safety model that already exists.

The product bet comes from the current beta screenshot and review notes: the primary quote is not prominent, FAME is not the first mental model, route evidence is hidden behind debug-style diagnostics, the dark-mode CTA can be unreadable, and users have no balance presets or advanced risk controls. The highest-priority outcome is confident swap completion: users should know what they are swapping, what they expect to receive, what minimum is protected, why the route is valid, and what wallet action is currently required.

## Requirements

**FAME-First Trade Model**

- R1. The primary widget model must be "Buy FAME" or "Sell FAME", not arbitrary token-pair swapping.
- R2. FAME must stay anchored as one side of the trade, while the opposite side can be selected from the first-pass supported asset list: USDC, WETH, and ETH.
- R3. The widget must include a swap-sides control that flips between buy and sell mode while preserving a valid FAME route when possible.
- R4. Unsupported non-FAME pairs must not be presented as a normal primary-path choice.

**Quote Clarity**

- R5. Estimated receive amount must be promoted to a top-level quote area, not hidden in debug text, chips, or alert body copy.
- R6. The quote area must show protected minimum after fee, router fee, slippage, deadline or freshness, and the active input/output assets.
- R7. The widget must provide USDC-denominated estimates for direct USDC trades and any other trade where the existing quote boundary exposes a reliable USDC estimate; non-USDC routes must show an explicit unavailable state rather than inferred precision.
- R8. Quote states must be understandable before wallet submission: waiting for amount, checking router, simulating, ready, expired, blocked, and failed.
- R8a. Quote freshness must have a concrete contract: the UI must show quote expiry or freshness, invalidate quotes when amount, mode, asset, slippage, deadline, account, chain, recipient, router, or route changes, and revalidate immediately before approval and swap submission.

**Route Understanding**

- R9. A compact route summary must be visible as part of the normal widget experience, not only inside route diagnostics.
- R10. Full mode must include a product-facing route map area, separate from debug diagnostics, that visualizes the route using only current quote/artifact data: token nodes, leg order, venue labels, split/merge shape when present, and explicit "share unavailable" copy when exact route strengths are not exposed.
- R11. Raw hashes, artifact IDs, manifest details, calldata, and low-level readiness details may remain in diagnostics, but user-facing route display must explain the liquidity path without requiring debug knowledge.
- R12. Mobile route display must use a vertical stacked path or equivalent non-overlapping layout with abbreviated visible labels, accessible full labels, and no horizontal scrolling for normal supported routes.

**Risk Controls**

- R13. Slippage and deadline must be configurable from a gear-icon advanced control that opens an inline panel within the widget.
- R14. Advanced controls must use safe bounds, clear defaults, and visible changed-from-default state.
- R15. The selected slippage and deadline settings must affect the actual quote, protected route, and transaction that will be submitted.
- R16. The widget must keep critical safety output visible in compact mode, including output estimate, protected minimum, and blocking warnings.
- R16a. Transaction submission must remain impossible when readiness fails, chain is not Base, amount is invalid, balance is insufficient or unknown for balance-gated actions, quote is expired, protected simulation fails, route is unsupported, or recipient/router/asset validation fails.

**Wallet And Transaction Flow**

- R17. If the connected wallet is not on Base, the widget may show read-only quote context but must prioritize switching to Base before approval or swap submission and make that blocking state obvious.
- R17a. Network switching must cover pending, user-rejected, failed, and unsupported switch states with retry or manual-switch guidance; approval and swap submission stay blocked until the wallet is on Base.
- R18. The approval-to-swap flow must provide clear step-by-step feedback for approval needed, approval pending, approval confirmed, protected swap simulation, swap pending, confirmed, and failed/reverted states.
- R19. The widget may support an automatic swap submission after approval only when the user intentionally starts the combined flow and an immutable trade-intent snapshot still matches account, chain, input/output assets, amount, recipient, router/spender, protected minimum, deadline, and route identifier.
- R20. Transaction hashes and confirmations must be easy to inspect, with BaseScan links where available.
- R21. After confirmation, the widget must offer a clear path to start another swap without refreshing the page.

**Amount And Balance Controls**

- R22. The widget must show relevant wallet balance for the active input asset when connected.
- R22a. Balance states must cover loading, unavailable/error, and stale reads; balance-derived presets and max actions must be disabled until a usable balance is available, and unknown balance must not be treated as zero.
- R23. The first implementation must use 25%, 50%, 75%, and 100% preset buttons for the active input balance; a slider can be added later but is not required for this pass.
- R24. Percentage presets apply whenever the active input asset has a usable connected-wallet balance. Native ETH 100% must reserve gas so the generated amount is not obviously unfundable.
- R25. Invalid, empty, over-balance, too-small, balance-unavailable, and simulation-failed amount states must produce clear inline guidance without exposing raw exceptions.

**Visual Quality, Accessibility, And Responsiveness**

- R26. The main CTA and all disabled/loading/error text must remain readable in dark and light themes.
- R27. The widget must use theme-aware MUI styling and existing app visual conventions rather than introducing a separate design system.
- R28. Interactive controls must have visible focus states, keyboard reachability, and at least 44px tap targets on mobile.
- R29. The widget must not use visible in-app instructional copy about keyboard shortcuts, design choices, or implementation details.
- R30. Desktop and mobile layouts must avoid text overlap, clipped labels, and hidden critical information.
- R30a. Quote and transaction status changes must use accessible control names, aria-live or equivalent status announcements, focus management after advanced panel open/close and transaction completion, and a semantic text/list fallback for route visualization.

**Verification**

- R31. Unit/component tests must cover buy/sell mode, swap-sides behavior, quote panel states, quote freshness invalidation, advanced controls, balance states, amount presets, transaction timeline states, safety-blocked states, and route visualization fallback behavior.
- R32. Focused solver/transaction tests must continue to pass after UI changes.
- R33. Browser verification must cover `/fame/swap` through a local `doppler run -- yarn dev` server in light and dark/system theme conditions where feasible.
- R34. Live wallet-dependent behavior should be verified as far as possible with agent-browser, with any step requiring human wallet approval called out explicitly rather than silently assumed.

**Diagnostics And Abuse Resistance**

- R35. Production-visible diagnostics must not expose reusable raw calldata by default. Diagnostics may show route ID, shortened hashes, readiness reason, and route legs; any raw payload copy affordance must be absent or explicitly gated to a development-only path.
- R36. Quote, readiness, and simulation requests must be debounced or otherwise protected from excessive per-keystroke work at the UI boundary; any backend/RPC rate-limit assumptions must be documented in the implementation plan.

## Success Criteria

- The first screen communicates "buy FAME" or "sell FAME" without requiring knowledge of token pair direction.
- A user can enter an amount and immediately see the expected output, protected minimum, USDC estimate state, route path, and active risk settings.
- The route summary teaches how liquidity is routed through supported venues without making users parse debug details before they understand the quote.
- Approval and swap submission feel like one coherent flow with clear status, recovery, and completion states.
- The widget remains readable, accessible, and usable on desktop and mobile in dark and light themes.
- Relevant automated tests, lint, build, and browser checks pass or have explicit documented blockers.
- A reviewer can complete a read-only happy path through amount entry, quote review, route understanding, risk-setting review, and pre-wallet CTA state without asking what to do next.

## Scope Boundaries

- This pass does not need to build a new router solver or route ranking system; it consumes the existing quote/readiness/transaction boundaries.
- This pass does not need to support arbitrary non-FAME token pairs.
- This pass does not need to replace ConnectKit or the app's existing wagmi configuration.
- This pass does not need a marketing landing page or explanatory hero before the widget.
- Raw calldata, artifact hashes, and manifest details should remain available for diagnostics but are not the primary product surface.
- Route visualization in this pass must not invent route ranking, price impact, or split strength data that is not already exposed by the current quote/artifact boundary.
- Automatic post-approval swap submission can be deferred if a guided manual second step gives clearer safety and status feedback.

## Key Decisions

- Use buy/sell tabs instead of generic token-pair controls: this matches how users think about FAME and removes invalid pair combinations from the primary path.
- Make route understanding visible by default but progressive: the compact route summary is always visible, while a richer route map belongs in a product-facing route section rather than raw diagnostics.
- Gate automatic approval-to-swap continuation conservatively: user intent, quote freshness, readiness, and protected simulation must all still be valid.
- Keep advanced controls compact and deterministic: a gear opens an inline advanced panel for slippage and deadline, with visible reset/default state.
- Preserve the existing app stack: MUI, Tailwind, ConnectKit, wagmi, viem, and the current `src/features/fame-swap` boundaries remain the implementation context.

## Default Widget Anatomy

The full widget should prioritize content in this order:

1. Mode row: Buy FAME / Sell FAME tabs and swap-sides control.
2. Amount row: active input amount, active input asset, connected balance, and percentage presets when available.
3. Quote panel: estimated receive amount first, then protected minimum, USDC estimate state, fee, slippage, deadline/freshness, and blocking warning if present.
4. Route section: compact route summary plus route map in full mode; mobile may show compact summary with expandable route details.
5. Transaction timeline: network, quote/simulation, approval, protected simulation, swap, receipt.
6. Advanced controls and diagnostics: advanced risk controls are user-facing; raw diagnostics are secondary.

Compact mode may reduce visual density but must keep mode, amount, quote output, protected minimum, blocking warning, and primary CTA visible.

## State Matrix

| State | Required User-Facing Behavior |
|---|---|
| Disconnected | Show connect wallet CTA; allow non-wallet educational quote placeholders only if they cannot be mistaken for executable quotes. |
| Wrong chain | Show switch-to-Base CTA, allow read-only route/quote context when available, and block approval/swap. |
| Switch pending/rejected/failed | Preserve entered trade details, show retry or manual switch guidance, and keep approval/swap blocked. |
| Waiting for amount | Keep CTA disabled and guide the user to enter an amount for the active input asset. |
| Checking/simulating | Preserve controls where safe, show live status, and prevent duplicate transaction actions. |
| Ready | Show receive estimate, protected minimum, route summary, active risk settings, and the next wallet action. |
| Expired | Preserve the trade, show refresh guidance, and require a fresh quote before approval or swap. |
| Unsupported/blocked | Explain the route or readiness reason, show allowed FAME directions, and keep transaction actions blocked. |
| Approval needed/pending/confirmed | Show exact approval amount and spender context; after confirmation, move to protected swap simulation or the next explicit swap CTA. |
| Swap pending/confirmed | Show BaseScan link when a hash exists; on confirmation, offer start another swap. |
| Failed/reverted | Preserve trade context, show safe retry guidance, and keep raw errors secondary to actionable copy. |

## Dependencies / Assumptions

- The Base router is deployed and configured for live readiness checks.
- Wallet signing and final transaction approval require a real user wallet; browser automation can verify UI states around those boundaries but may need human assistance for actual signing.
- USDC valuation must use an explicitly chosen source during planning. The first acceptable fallback is exact/direct USDC trade context only, with "USDC estimate unavailable" for non-USDC routes until the solver/backend exposes a reliable source.
- Existing solver/backend follow-up work remains tracked separately in `docs/ideation/2026-05-12-fame-swap-router-solver-ideation.md`.

## Outstanding Questions

### Resolve Before Planning

None.

### Deferred to Planning

- [Affects R7][Technical] Decide whether first-pass USDC estimates support only direct USDC routes or whether an existing backend quote can safely provide broader USDC notional values.
- [Affects R10][Technical] Confirm the exact current route fields available for route map rendering; do not infer route strength or split share without exposed data.
- [Affects R19][Technical] Decide whether automatic post-approval swap submission is enabled in the first implementation or represented as a guided manual second step with clear status.
- [Affects R24][Technical] Decide the native ETH gas reserve amount or formula for 100% amount controls.
- [Affects R33][Technical] Decide the browser verification matrix that can run without human wallet signing versus the live wallet checks that require user assistance.
- [Affects R36][Technical] Confirm existing quote/readiness/simulation debounce and rate-limit behavior before adding new backend controls.

## Next Steps

-> `/ce:plan` for structured implementation planning.
