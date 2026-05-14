---
status: pending
priority: p2
issue_id: "005"
tags: [fame-swap, ui, quotes, rpc]
dependencies: []
---

# Add Pre-Approval Quote Fallback For FAME Swap

## Problem Statement

The FAME swap widget now attempts a read-only bundled approval-plus-swap simulation so ERC-20 routes can show Receive and Min receive before the user signs approval. That depends on RPC support for bundled call simulation. If the connected public client or upstream RPC does not support that method, the UI can only report that the estimate is unavailable until approval is confirmed and the protected swap simulation can run.

## Findings

- `src/features/fame-swap/hooks/useFameSwapTransaction.ts` uses viem `simulateCalls` to simulate the approval and swap as one read-only bundle.
- The UI now displays `Estimating` while that pre-approval simulation is pending and `Estimate unavailable` if it cannot produce output.
- The actual swap remains gated by the protected post-approval simulation, so this is an estimate hardening issue rather than a transaction safety regression.
- Checked-in route artifacts still do not carry reliable live output estimates for arbitrary user amounts.

## Proposed Solutions

### Option 1: Server-Side Quote Simulation

**Approach:** Add or extend a server quote endpoint that runs the same bundled simulation through a known Base RPC provider and returns estimated output plus quote diagnostics.

**Pros:**
- Keeps the estimate available even when the browser wallet RPC lacks bundled simulation support.
- Centralizes RPC error handling and observability.

**Cons:**
- Adds backend latency and provider dependency to the quote path.
- Needs rate limiting and cache/freshness boundaries.

**Effort:** 4-8 hours

**Risk:** Medium

### Option 2: Live Solver Quote Service

**Approach:** Move beyond route execution simulation and compute live route quotes, per-leg minimums, final minimums, and USDC estimates from a solver service.

**Pros:**
- Produces richer quote data and can support liquidity-fee estimates later.
- Reduces dependence on wallet simulation for display-only quote fields.

**Cons:**
- Larger architecture change.
- Needs careful parity tests against executable router routes.

**Effort:** 2-4 days

**Risk:** Medium to high

## Recommended Action

To be filled during triage. Start with Option 1 if production RPC telemetry shows frequent bundled simulation failures.

## Acceptance Criteria

- [ ] The widget can show Receive and Min receive before approval on supported routes even when the browser public client cannot run bundled simulations.
- [ ] The fallback quote has a clear freshness timestamp and does not enable swap submission by itself.
- [ ] The protected post-approval simulation remains the final transaction gate.
- [ ] Errors distinguish unsupported RPC simulation from route execution failures.
- [ ] Tests cover browser-simulation success, browser-simulation failure with server fallback, and total estimate unavailability.

## Work Log

### 2026-05-13 - Initial Discovery

**By:** Codex

**Actions:**
- Added client-side pre-approval bundled simulation.
- Added explicit pending/unavailable labels so the quote panel no longer hangs on `Checking wallet`.
- Captured this fallback as durable follow-up instead of inventing a static estimate from weak route artifacts.

**Learnings:**
- The current router artifact outputs are not sufficient as user-facing live estimates for arbitrary amounts.
- Bundled simulation is the narrowest safe client-side fix, but production reliability depends on RPC support.
