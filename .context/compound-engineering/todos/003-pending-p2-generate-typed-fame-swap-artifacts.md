---
status: pending
priority: p2
issue_id: "003"
tags: [fame-swap, artifacts, typescript, validation]
dependencies: []
---

# Generate Typed FAME Swap Artifacts

## Problem Statement

The FAME swap feature imports copied JSON artifacts and validates route hashes/encodings at runtime, but the JSON imports still require TypeScript assertions. A generator or schema parser would make malformed artifact shape fail earlier and more clearly.

## Findings

- `src/features/fame-swap/solver/artifacts.ts` casts copied JSON into route file interfaces.
- `src/features/fame-swap/solver/integrity.ts` now validates schema version, pinned block, route ids, ABI encodings, and route hashes at readiness time.
- There is no generated `.ts` artifact module using `satisfies`, and no runtime schema library in the current implementation.

## Proposed Solutions

### Option 1: Generate `.ts` Artifact Modules

**Approach:** Add a sync script that reads sibling `fame-contracts` JSON fixtures and writes typed `.ts` modules with `satisfies` declarations.

**Pros:**
- Moves malformed shape failures into TypeScript compile time.
- Keeps runtime bundle simple.

**Cons:**
- Requires generator maintenance when artifact schema evolves.

**Effort:** 1 day

**Risk:** Low

### Option 2: Add Runtime Schema Parser

**Approach:** Validate imported JSON through a small hand-written parser or a schema library before exposing artifacts to solver code.

**Pros:**
- Gives precise runtime errors for bad artifacts.
- Does not require checked-in generated TypeScript data.

**Cons:**
- Adds parser code or a dependency.

**Effort:** 1 day

**Risk:** Low

## Recommended Action

To be filled during triage.

## Acceptance Criteria

- [ ] Invalid addresses, hex strings, route ids, and numeric strings fail before quote construction.
- [ ] Artifact sync from `../fame-contracts/test/router/fixtures` is documented and repeatable.
- [ ] Existing route hash and ABI parity tests still pass.
- [ ] No `as any` or `as unknown` is introduced.

## Work Log

### 2026-05-13 - Initial Discovery

**By:** Codex

**Actions:**
- Added runtime artifact integrity checks for copied JSON content.
- Captured stronger artifact shape typing as durable follow-up.

**Learnings:**
- Runtime route hash checks protect execution, but generated typed artifacts would make artifact drift easier to diagnose.
