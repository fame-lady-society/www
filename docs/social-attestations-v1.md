# Social OAuth Attestations (V1)

This document defines the v1 schema and conventions for storing social account
attestations in the FLS Naming KV store.

## Goals

- Let a trusted backend attest that a namehash is linked to a social handle.
- Store a compact, publicly verifiable attestation on-chain.
- Preserve privacy by not storing provider subject IDs on-chain.
- Support backend continuity checks with HMAC subtags.

## Key Schema (KV)

KV keys are derived as `keccak256(utf8(keyName))` and stored as `bytes32`.

Key names:

- `social:<provider>:att:v1` -> Attestation payload (ABI-encoded bytes)
- `social:<provider>:subtag:v1` -> HMAC subtag (bytes32) (optional, redundant)
- `social:<provider>:status:v1` -> `linked|revoked|expired` (optional)

Provider IDs (v1):

- `x`
- `discord`

## Attestation Payload (ABI)

The attestation payload is ABI-encoded and stored as `bytes` in KV.

Tuple encoding (in order):

- `uint8 v` (schema version, `1`)
- `bytes32 namehash`
- `bytes32 provider` (keccak256 of provider id string)
- `string handle` (normalized handle)
- `uint64 issuedAt` (unix seconds)
- `uint64 expiresAt` (unix seconds)
- `bytes32 nonce`
- `string aud` (service audience, e.g. domain)
- `bytes32 subtag` (HMAC output)
- `uint8 subtagKeyId`
- `bytes sig` (attestor signature)

## Digest (EIP-712)

Typed data domain:

- `name`: `FLSNamingSocialAttestation`
- `version`: `1`
- `chainId`: chain id
- `verifyingContract`: FLSNaming contract address

Message fields:

- `uint8 v`
- `bytes32 namehash`
- `bytes32 provider`
- `bytes32 handleHash` (`keccak256(utf8(handle))`)
- `uint64 issuedAt`
- `uint64 expiresAt`
- `bytes32 nonce`
- `bytes32 audHash` (`keccak256(utf8(aud))`)
- `bytes32 subtag`
- `uint8 subtagKeyId`

Signature is `signTypedData` over the above fields. Verifiers recover and
compare against the configured attestor address.

## Handle Normalization

Normalize before hashing and storing:

- Trim whitespace
- Convert to lowercase
- Remove leading `@`

Provider specifics:

- `x`: remove leading `@`, keep only username portion
- `discord`: remove leading `@`, keep username portion (do not include `#` tag)

## HMAC Subtag

Subtag input (backend only):

```
HMAC-SHA256(
  subtagSecret,
  "SOCIAL_SUBTAG_V1" || chainId || verifyingContract || namehash || provider || subject
)
```

Where `provider` is `keccak256(utf8(providerId))` and `subject` is the provider
stable user id (not stored on-chain). Store full 32-byte output in the payload.

## Expiration

- `expiresAt` should be bounded (suggest 180-365 days).
- Verifiers treat expired attestations as invalid.

## Verification Rules

An attestation is valid if:

1. Signature recovers to the configured attestor address.
2. `expiresAt >= now`.
3. `namehash` and `provider` match the expected identity.
4. `handleHash` and `audHash` match the payload values.

## Key Rotation

When rotating HMAC secrets, increment `subtagKeyId` and keep previous secrets
available for continuity checks until old attestations expire.
