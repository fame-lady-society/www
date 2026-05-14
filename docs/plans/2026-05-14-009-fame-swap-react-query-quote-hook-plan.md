---
title: "refactor: Move FAME swap quote fetching to React Query"
type: refactor
status: complete
date: 2026-05-14
source_todo: .context/compound-engineering/todos/009-ready-p2-complete-widget-fetch-and-recovery-tests.md
---

# refactor: Move FAME Swap Quote Fetching To React Query

## Overview

Refactor `useFameSwapQuote` so TanStack React Query owns remote quote fetch lifecycle, cancellation, stale response protection, error state, and refresh identity. Keep local blocked quote states synchronous and structurally non-executable, and add focused tests around query keys, disabled states, signal propagation, request bodies, error mapping, and widget recovery states.

## Requirements Trace

- Todo `009`: `useFameSwapQuote` uses TanStack `useQuery` for remote quote fetches instead of custom local fetch lifecycle state.
- Todo `009`: query keys include token pair, amount, recipient, slippage, deadline, readiness, and refresh identity.
- Todo `009`: remote query is disabled for empty amount, missing recipient, or non-ready local states; blocked quotes remain synchronous.
- Todo `009`: query function passes React Query's `signal` to `fetch`.
- Todo `009`: non-OK responses become display-safe non-executable `quote_adapter_failure` quotes.
- Todo `009`: rapid amount edits are covered at the query-key/enabled boundary.
- Todo `009`: wallet rejection/write failure stays retryable, while expired quote and simulation failures block submission with clear recovery copy.

## Current-State Findings

- `src/context/Wagmi.tsx` already wraps the app in `QueryClientProvider`.
- `useFameSwapQuote` currently owns debounce timers, abort controllers, stale guards, local loading/error state, and refresh nonce.
- The hook's public return shape is small and can stay stable: `quote`, `isLoading`, `error`, `quoteKey`, and `refresh`.
- Existing tests cover quote wire deserialization and widget state, but not remote query keys, enabled gates, request body propagation, or abort signal propagation.

## Scope Boundaries

- Do not change the quote API route contract.
- Do not change route math, ranking, fee calculations, or transaction construction.
- Do not add another request/cache abstraction around React Query.
- Do not make non-ready or error quotes executable.

## Implementation Units

- [x] **Unit 1: Extract React Query Quote Helpers**

**Files:**

- Modify: `src/features/fame-swap/hooks/useFameSwapQuote.ts`
- Test: `src/features/fame-swap/hooks/useFameSwapQuote.test.ts`

**Approach:**

- Add a stable query-key builder that serializes all quote-affecting inputs and refresh nonce.
- Add an enabled predicate for remote quote fetching.
- Add a fetch helper that accepts React Query's `AbortSignal`, posts the current quote body, and deserializes the response.

- [x] **Unit 2: Refactor Hook Onto `useQuery`**

**Files:**

- Modify: `src/features/fame-swap/hooks/useFameSwapQuote.ts`

**Approach:**

- Replace custom effect/timer/abort state with `useQuery`.
- Keep synchronous local blocked quotes for missing amount, missing recipient, and non-ready readiness.
- Convert query errors into display-safe `quote_adapter_failure` results at the hook boundary.
- Preserve `refresh()` by bumping refresh identity in the query key.

- [x] **Unit 3: Add Recovery-State Coverage**

**Files:**

- Modify: `src/features/fame-swap/state.test.ts`

**Approach:**

- Add explicit widget-state assertions that wallet/write rejection remains retryable after a valid quote.
- Add explicit expired quote and protected simulation failure assertions for blocked recovery states.

- [x] **Unit 4: Review, Verify, And Close Todo**

**Files:**

- Modify: `.context/compound-engineering/todos/009-ready-p2-complete-widget-fetch-and-recovery-tests.md`
- Optional: this plan file completion notes.

**Approach:**

- Run hook, state, widget, quote wire, and quote-view tests.
- Run formatting/lint checks for touched files.
- Run a review pass and fix P1/P2 findings.
- Mark todo `009` complete only after verification passes.

## Verification Plan

- `bun test src/features/fame-swap/hooks/useFameSwapQuote.test.ts src/features/fame-swap/state.test.ts src/features/fame-swap/components/FameSwapWidget.test.ts src/features/fame-swap/solver/quoteWire.test.ts src/features/fame-swap/ui/quoteView.test.ts`
- `yarn lint --file src/features/fame-swap/hooks/useFameSwapQuote.ts --file src/features/fame-swap/hooks/useFameSwapQuote.test.ts --file src/features/fame-swap/state.test.ts`
- `./node_modules/.bin/prettier --check src/features/fame-swap/hooks/useFameSwapQuote.ts src/features/fame-swap/hooks/useFameSwapQuote.test.ts src/features/fame-swap/state.test.ts docs/plans/2026-05-14-009-fame-swap-react-query-quote-hook-plan.md`

## Risks

| Risk                                             | Likelihood | Impact | Mitigation                                                                                                           |
| ------------------------------------------------ | ---------- | ------ | -------------------------------------------------------------------------------------------------------------------- |
| Query error leaves stale executable data visible | Medium     | High   | Prefer error-derived `quote_adapter_failure` over cached data when the query errors.                                 |
| Query key omits a quote-affecting input          | Medium     | High   | Add direct query-key assertions for token pair, amount, recipient, slippage, deadline, readiness, and refresh.       |
| Disabled query suppresses useful blocked copy    | Low        | Medium | Keep local blocked quotes synchronous via `quoteFameSwap`.                                                           |
| Removing debounce increases request volume       | Medium     | Medium | Let query-key transitions and cancellation own stale protection; leave input debounce as future UX tuning if needed. |

## Completion Notes

- Refactored `useFameSwapQuote` to use TanStack `useQuery` for remote executable quote requests.
- Added shared quote query helpers for complete query keys, remote-enabled gates, remote input narrowing, and signal-aware quote fetches.
- Kept empty amount, missing recipient, and non-ready readiness states local and synchronous through `quoteFameSwap`.
- Converted non-OK remote responses into display-safe errors and mapped query failures to non-executable `quote_adapter_failure` quotes.
- Preserved refresh behavior by including refresh identity in the query key.
- Added tests for query keys, disabled gates, request body propagation, React Query abort signal propagation, fresh `QueryClient` execution, non-OK sanitization, non-ready wire responses, wallet retry state, expired quote state, and protected simulation failure state.
- Review artifact: `.context/compound-engineering/ce-review/20260514-009-react-query-quote-hook-codex/summary.md`; no P1/P2 findings.
- Verification passed with hook, state, widget, quote-wire, quote-view, and quote tests plus Prettier, lint, and diff whitespace checks.
