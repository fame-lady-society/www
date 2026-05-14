---
status: complete
priority: p2
issue_id: "002"
tags: [fame-swap, fork, doppler, anvil]
dependencies: []
---

# Validate FAME Swap Pinned Archive RPC Path

## Problem Statement

The fork smoke script defaults to the manifest-pinned Base block, but the available Doppler dev RPC timed out during local router deployment at that archive block. Latest-state validation passes with an explicit override, but pinned-block validation still needs an archive-capable RPC path.

## Findings

- `scripts/fame-swap-fork-smoke.ts` defaults `anvil --fork-block-number` to the manifest block.
- `doppler run --config dev -- bun run fame-swap:fork-smoke` timed out while deploying the local fork router.
- `doppler run --config dev -- env FAME_SWAP_FORK_BLOCK=latest FAME_SWAP_ALLOW_RPC_URL_PROCESS_ARG=1 bun run fame-swap:fork-smoke` passed.
- The loopback RPC proxy is safer for process listings, but this provider timed out through it during fork deployment.

## Proposed Solutions

### Option 1: Add Archive RPC Doppler Config

**Approach:** Add a minimal Doppler config or secret containing an archive-capable Base RPC URL and use it for pinned fork validation.

**Pros:**

- Preserves deterministic pinned-block evidence.
- Keeps secrets out of application runtime config.

**Cons:**

- Requires operator/provider setup.

**Effort:** 1-2 hours

**Risk:** Low

### Option 2: Harden the Loopback Proxy

**Approach:** Improve the local RPC proxy with request logging, timeout tuning, header forwarding, and batch request coverage, then rerun pinned validation through the proxy.

**Pros:**

- Avoids exposing secret-bearing RPC URLs in process args.
- Makes the harness safer for routine use.

**Cons:**

- Does not solve non-archive provider limitations.

**Effort:** 2-4 hours

**Risk:** Medium

## Recommended Action

Keep this as a P2 operator-validation item. Use an archive-capable Base RPC through Doppler and rerun the fork smoke with `FAME_SWAP_FORK_BLOCK` unset. The process-argument RPC exposure concern is explicitly not part of the next P1 fix scope, but the documented default path should still prefer the loopback proxy unless a local developer opts into process-arg exposure.

## Acceptance Criteria

- [x] Pinned fork smoke passes with `FAME_SWAP_FORK_BLOCK` unset.
- [x] The passing command uses a minimal Doppler config or documented secret mapping.
- [x] The command does not require `FAME_SWAP_ALLOW_RPC_URL_PROCESS_ARG=1` unless explicitly accepted for local debugging.
- [x] Operator docs include the exact verified command.

## Work Log

### 2026-05-14 - Triage

**By:** Codex

**Actions:**

- Promoted from pending to ready after review.
- Kept priority at P2 because the user explicitly excluded the fork-wrapper process-argument issue from the immediate P1 fix scope.

**Learnings:**

- Latest-state live route lab now passes through Doppler RPC, but pinned archive-block fork smoke still needs separate archive-provider evidence.

### 2026-05-13 - Initial Discovery

**By:** Codex

**Actions:**

- Added pinned-block default, local router deployment, artifact hash checks, and cleanup to fork smoke.
- Verified latest-state fork smoke against Doppler dev RPC.
- Captured archive-RPC/pinned validation as follow-up.

**Learnings:**

- The dev Doppler RPC can validate latest state but appears unsuitable or too slow for this pinned archive block through the current harness.

### 2026-05-14 - Completion

**By:** Codex

**Actions:**

- Confirmed local `anvil`, `forge`, and sibling `../fame-contracts` deploy script availability.
- Confirmed the local Doppler fallback file supplies `NEXT_PUBLIC_BASE_RPC_URL_1` without printing the secret value.
- Reproduced the safe loopback pinned fork failure under the previous Anvil default upstream timeout.
- Added archive-friendly Anvil fork defaults to `scripts/fame-swap-fork-smoke.ts`: 120s upstream timeout, 8 retries, and 1s fork retry backoff.
- Added provider-debug overrides: `FAME_SWAP_ANVIL_FORK_TIMEOUT_MS`, `FAME_SWAP_ANVIL_FORK_RETRIES`, and `FAME_SWAP_ANVIL_FORK_RETRY_BACKOFF_MS`.
- Updated `docs/fame-swap-fork-validation.md` with the exact verified command and timeout/retry knobs.
- Ran the required review pass; no P1/P2 findings remained.

**Verification:**

- Passed: `doppler run -- bun run fame-swap:fork-smoke`
- Conditions: `FAME_SWAP_FORK_BLOCK` unset, `FAME_SWAP_ALLOW_RPC_URL_PROCESS_ARG` unset, safe loopback RPC proxy used.
- Result: forked pinned Base block `45884844`, deployed local router `0x58597381dfe7d925014cdfbc264bc928a2d5929d`, passed six default fork cases, and emitted quote context `fork:8453:45884855`.
- Passed: `./node_modules/.bin/prettier --check scripts/fame-swap-fork-smoke.ts docs/fame-swap-fork-validation.md docs/plans/2026-05-14-004-fame-swap-pinned-archive-rpc-validation-plan.md`
- Passed: `yarn lint --file scripts/fame-swap-fork-smoke.ts`
- Passed: `git diff --check -- scripts/fame-swap-fork-smoke.ts docs/fame-swap-fork-validation.md docs/plans/2026-05-14-004-fame-swap-pinned-archive-rpc-validation-plan.md`

**Learnings:**

- The provider can serve the pinned archive fork, but Anvil's default 45s upstream timeout was too low for initial pinned-block account hydration through the safe loopback path.
