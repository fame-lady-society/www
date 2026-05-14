---
date: 2026-05-13
topic: fame-swap-widget-ui-ux-hardening
focus: "Frontend UI/UX hardening for the current FAME swap widget"
status: active
source_branch: feat/fame-swap-router-solver
related_solver_doc: docs/ideation/2026-05-12-fame-swap-router-solver-ideation.md
---

# Ideation: FAME Swap Widget UI/UX Hardening

## Purpose

This document is the UI/UX half of the FAME swap ideation split. The current `/fame/swap` implementation proves that route artifacts, readiness checks, wallet simulation, approval, swap submission, and receipt tracking can work together. The visible widget still reads like an engineering prototype: output estimates are small chips or alert text, route evidence is behind diagnostics, pair selection is generic, and the main CTA can become unreadable in dark mode.

The goal here is to identify the strongest frontend work needed to turn the beta widget into a clear FAME buy/sell experience.

## Codebase Context

### Current Widget Shape

- `src/features/fame-swap/components/FameSwapWidget.tsx` renders the whole beta surface with MUI `Stack`, `Alert`, `Chip`, token selects, amount field, primary CTA, fallback links, and route diagnostics.
- `src/features/fame-swap/state.ts` maps disconnected, wrong-chain, amount-entry, unsupported, stale-artifact, not-live-ready, quote-expired, approval-needed, ready, submitting, confirmed, and reverted states.
- `src/features/fame-swap/components/RouteDiagnostics.tsx` renders route status, artifact ID, hashes, and leg text behind a disclosure.
- `src/features/fame-swap/components/TokenSelect.tsx` allows any token pair from FAME, USDC, WETH, and ETH, even though the product model is really buy FAME or sell FAME.
- `src/features/fame-swap/components/SwapAmountField.tsx` is a single amount input with no balance, max, percentage presets, or slider.
- `src/features/fame-swap/hooks/useFameSwapTransaction.ts` supports approval and swap submission, but the UI exposes this as a two-step manual CTA rather than a guided transaction timeline.

### Screenshot Observations

- The page says "FAME swap", but the form starts with generic Sell and Buy selects. FAME is not the primary mental model.
- The protected minimum and simulated output are not top-level quote information. Users see a large alert and small chips, while the actual output estimate is easy to miss.
- The primary CTA is visually broken in dark mode because disabled/theme text contrast is nearly invisible.
- Route diagnostics contain useful route evidence, but the route itself is hidden behind a debug-style disclosure instead of helping the user understand how liquidity is routed.
- There is no route graph, split-strength visualization, USDC estimate, balance-aware amount control, or advanced settings surface.

### Product Constraints

- This should stay a swap tool, not a landing page.
- FAME should be first-class: everything is either buying FAME or selling FAME.
- Solver/backend follow-ups are tracked separately in `docs/ideation/2026-05-12-fame-swap-router-solver-ideation.md`.
- UI work should reuse the existing MUI, Tailwind, ConnectKit, wagmi, and viem patterns rather than introducing a new design system.

## Raw Candidate Pool

The candidate pool was generated from four frames: user/operator pain, removing painful steps, assumption-breaking, and leverage on future work.

- Replace generic token-pair selects with Buy FAME and Sell FAME tabs.
- Add a swap-sides button that flips buy/sell mode while keeping FAME fixed as the anchor.
- Default to the most common FAME action while still making sell mode obvious.
- Move output estimate into a top-level quote panel.
- Show estimated receive amount, protected minimum, fee, slippage, deadline, and quote freshness together.
- Add USDC value estimates for input, output, and price impact context.
- Use FAME/USDC as the base reference price even when the selected route uses ETH or WETH.
- Promote route visualization from diagnostics into the normal widget.
- Render a DAG route graph with edge strengths, split percentages, venue labels, and final fee.
- Make route graph compact on mobile while preserving leg order and split/merge shape.
- Add a "why this route" explanation without turning the widget into docs.
- Add an advanced gear menu for slippage and deadline.
- Allow max total slippage separate from route display slippage.
- Keep dangerous advanced settings bounded and resettable.
- Auto-switch or strongly prompt switching to Base before quote submission.
- Turn approve and submit into one guided transaction flow with clear wallet and receipt states.
- Auto-submit the swap after approval when the user opted into the combined flow and the protected simulation still passes.
- Add transaction timeline rows: quote, simulation, approval, protected simulation, swap, receipt.
- Fix theme-aware CTA text, disabled states, alert contrast, and chip contrast.
- Add balance display, max button, 25/50/75/100 sell presets, and a sell percentage slider.
- Add "start another swap" reset after confirmation.
- Add route-specific failure recovery copy for unsupported route, expired quote, simulation failure, reverted swap, and readiness failure.
- Add compact mode rules that do not hide output, warnings, or route summary.
- Add keyboard/focus handling around chain switch, approval completion, swap submission, and confirmation.
- Add visual regression screenshots for dark/light and mobile/desktop states.
- Add component tests for buy/sell tab mode, advanced controls, quote panel, and transaction timeline.

## Ranked Ideas

### 1. FAME-Centric Buy/Sell Mode

**Description:** Replace the two generic token selects with Buy FAME and Sell FAME tabs. FAME stays anchored on one side of the trade, and the other side becomes the selectable asset: USDC, WETH, or ETH. Add a swap-sides button for flipping between buy and sell mode without making users reason about arbitrary pair direction.

**Rationale:** This matches the real product: every route is either buying FAME or selling FAME. It removes unsupported pair combinations from the primary path and makes the widget easier to scan.

**Downsides:** The component model changes more than a visual pass. Tests need to assert that all supported route directions remain reachable.

**Confidence:** 94%

**Complexity:** Medium

**Status:** Unexplored

### 2. Top-Level Quote And USDC Valuation Panel

**Description:** Add a first-class quote panel directly under the amount controls showing estimated receive amount, protected minimum after fee, USDC value estimate, fee, slippage, quote freshness, and deadline. Remove output-critical information from small chips and alert body text.

**Rationale:** The current widget hides the most important swap question: "what do I get?" A top-level quote panel makes the router useful before the user reaches the CTA.

**Downsides:** USDC valuation needs a trustworthy source and careful stale/missing-state handling. Until backend price support is stronger, the UI may need explicit "estimate unavailable" states.

**Confidence:** 92%

**Complexity:** Medium

**Status:** Unexplored

### 3. Route DAG Visualization As Product Surface

**Description:** Promote route evidence into a normal route visualization: a compact directed graph showing input, intermediate tokens, output, venue families, split/merge edges, relative route strengths, and final fee. Keep raw hashes in diagnostics, but let users learn how liquidity is routed without opening debug details.

**Rationale:** The FAME router's differentiator is multi-leg routing. A graph turns technical complexity into trust and understanding instead of hiding it behind "Route diagnostics."

**Downsides:** Requires deriving edge weights and graph layout from route metadata. A bad graph would be worse than text, especially on mobile.

**Confidence:** 86%

**Complexity:** Medium

**Status:** Unexplored

### 4. Guided Approve-To-Swap Transaction Timeline

**Description:** Replace the single-state CTA with a transaction timeline and clear step feedback: quote prepared, wallet simulation, approval needed, approval pending, approval confirmed, protected swap simulation, swap pending, confirmed or failed. Support an auto-submit-after-approval path only when the user explicitly starts the combined flow and the protected simulation still passes.

**Rationale:** The transaction hook already has most of the mechanical state. The UI needs to make the two wallet actions understandable and prevent users from wondering what happened after approval.

**Downsides:** Auto-submit must be conservative. If the route expires, readiness changes, or simulation fails after approval, the flow must stop visibly.

**Confidence:** 88%

**Complexity:** Medium

**Status:** Unexplored

### 5. Advanced Gear Controls For Slippage And Deadline

**Description:** Add a gear-triggered advanced panel for max total slippage, transaction deadline, and route safety details. Keep defaults simple, enforce safe bounds, and show when values differ from defaults.

**Rationale:** Slippage and deadline are real swap controls, but they should not dominate the primary form. A bounded advanced panel gives experienced users control without overwhelming the default flow.

**Downsides:** Frontend controls need backend quote integration so changed settings affect the materialized route and protected simulation.

**Confidence:** 82%

**Complexity:** Medium

**Status:** Unexplored

### 6. Balance-Aware Amount Controls

**Description:** Add wallet balance display, max button, 25/50/75/100 presets for sell flows, and a slider for percentage sells. For buy flows, keep amount entry anchored to the non-FAME input asset and show how much FAME is estimated.

**Rationale:** The current amount box is bare. Presets reduce friction, especially for selling FAME, and they prevent avoidable insufficient-balance failures.

**Downsides:** Requires balance reads for FAME, USDC, WETH, and ETH. Need careful handling for gas reserve on native ETH max.

**Confidence:** 84%

**Complexity:** Medium

**Status:** Unexplored

### 7. Theme, Accessibility, And Error-State Hardening

**Description:** Fix CTA contrast in dark and light mode, disabled text visibility, alert/chip contrast, mobile spacing, focus restoration, keyboard reachability, and specific error recovery copy. Add visual regression screenshots for core states across theme and viewport.

**Rationale:** The screenshot shows a concrete dark-mode failure, and swap flows are state-heavy. Polish here directly affects whether users trust the page enough to sign transactions.

**Downsides:** This is easy to under-scope. It should be paired with a state screenshot matrix so regressions are visible.

**Confidence:** 90%

**Complexity:** Medium

**Status:** Unexplored

## Rejection Summary

| # | Idea | Reason Rejected |
|---|------|-----------------|
| 1 | Keep route visualization only inside debug diagnostics | Conflicts with the goal of making route learning first-class. |
| 2 | Preserve arbitrary pair selection as the main UI | The product model is FAME buy/sell, not a generic DEX. |
| 3 | Add a marketing hero before the widget | The user needs the swap tool as the first screen. |
| 4 | Use chips as the primary quote display | Too easy to miss and already failing the screenshot review. |
| 5 | Auto-submit swap after approval unconditionally | Unsafe if quote, deadline, readiness, or simulation changes. |
| 6 | Expose every route hash and calldata detail by default | Useful for diagnostics, but too technical for the main widget. |
| 7 | Hide advanced slippage entirely | Users need control over real swap risk. |
| 8 | Add presets only for all tokens | Percentage presets are most useful and least ambiguous for sell flows. |
| 9 | Wait for full solver route ranking before improving UI | The current route can already be made much clearer. |
| 10 | Treat dark-mode CTA contrast as cosmetic | It blocks the primary action from being readable. |

## Suggested Brainstorm Seeds

1. Define the FAME-centric buy/sell interaction model and state transitions.
2. Define the quote panel and USDC valuation contract.
3. Define the route DAG data model and responsive visualization.
4. Define the approve-to-swap transaction timeline and auto-submit safety rules.
5. Define the visual regression matrix for widget states, themes, and viewports.

## Session Log

- 2026-05-13: Initial UI/UX hardening ideation. Grounded in the current widget screenshot, `FameSwapWidget`, `state.ts`, route diagnostics, transaction hook behavior, todo state, and commit `6c07283`. Generated 26 frontend candidates; 7 survived.
