---
status: pending
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

To be filled during triage.

## Acceptance Criteria

- [ ] Pinned fork smoke passes with `FAME_SWAP_FORK_BLOCK` unset.
- [ ] The passing command uses a minimal Doppler config or documented secret mapping.
- [ ] The command does not require `FAME_SWAP_ALLOW_RPC_URL_PROCESS_ARG=1` unless explicitly accepted for local debugging.
- [ ] Operator docs include the exact verified command.

## Work Log

### 2026-05-13 - Initial Discovery

**By:** Codex

**Actions:**
- Added pinned-block default, local router deployment, artifact hash checks, and cleanup to fork smoke.
- Verified latest-state fork smoke against Doppler dev RPC.
- Captured archive-RPC/pinned validation as follow-up.

**Learnings:**
- The dev Doppler RPC can validate latest state but appears unsuitable or too slow for this pinned archive block through the current harness.
