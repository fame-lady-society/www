import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { type Hex, bytesToHex, keccak256, toHex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import {
  buildAttestationTypedData,
  decodeAttestationV1,
  encodeAttestationV1,
  normalizeHandle,
  providerIdToBytes32,
  verifyAttestation,
} from "../index";

describe("social attestation v1", () => {
  it("normalizes handles", () => {
    assert.equal(normalizeHandle("x", "@FLS_Example"), "fls_example");
    assert.equal(normalizeHandle("discord", "@Lady#1234"), "lady");
  });

  it("encodes and verifies signatures", async () => {
    const chainId = 84532;
    const verifyingContract = "0x0000000000000000000000000000000000000001";
    const namehash = keccak256(toHex("alice"));
    const nonce = bytesToHex(new Uint8Array(32).fill(7));
    const provider = providerIdToBytes32("x");
    const account = privateKeyToAccount(
      "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    );

    const attestation = {
      v: 1 as const,
      namehash,
      provider,
      handle: "alice",
      issuedAt: 1_700_000_000,
      expiresAt: 1_900_000_000,
      nonce,
      aud: "https://fameladysociety.com",
      subtag: bytesToHex(new Uint8Array(32).fill(9)),
      subtagKeyId: 1,
      sig: "0x" as Hex,
    };

    const typedData = buildAttestationTypedData(
      attestation,
      chainId,
      verifyingContract,
    );
    const sig = await account.signTypedData(typedData);
    const signed = { ...attestation, sig };
    const encoded = encodeAttestationV1(signed);
    const decoded = decodeAttestationV1(encoded);

    assert.ok(decoded);
    assert.equal(decoded?.handle, signed.handle);
    assert.equal(decoded?.provider, signed.provider);

    const verification = await verifyAttestation(decoded!, {
      provider: "x",
      namehash,
      chainId,
      verifyingContract,
      attestorAddress: account.address,
      expectedAudience: attestation.aud,
      now: 1_800_000_000,
    });

    assert.equal(verification.valid, true);
  });
});
