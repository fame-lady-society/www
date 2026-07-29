import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { keccak256, type Hex } from "viem";
import { base, mainnet, sepolia } from "viem/chains";
import {
  FAME_BURN_POOL_ROTATOR_BASE_ADDRESS,
  FAME_BURN_POOL_ROTATOR_EXPECTED_FAME,
  FAME_BURN_POOL_ROTATOR_EXPECTED_MIRROR,
  FAME_BURN_POOL_ROTATOR_RUNTIME_BYTECODE,
  FAME_BURN_POOL_ROTATOR_RUNTIME_FINGERPRINT,
  evaluateRotatorExecutionIdentity,
  getFameRotatorConfig,
  hasRequiredRotatorAbiSurface,
} from "./config";
import { fameBurnPoolRotatorAbi } from "@/wagmi";

const ROTATOR = "0xC0e0A441660361ab2B6Ff8032Ed1860E230274bc" as const;
const FAME = "0xf307e242BfE1EC1fF01a4Cef2fdaa81b10A52418" as const;
const MIRROR = "0xBB5ED04dD7B207592429eb8d599d103CCad646c4" as const;

describe("Fame burn pool rotator config", () => {
  it("returns the exact Base deployment, FAME, and mirror addresses", () => {
    const config = getFameRotatorConfig(base.id);
    assert.equal(config.status, "configured");
    if (config.status !== "configured") return;
    assert.equal(config.address, ROTATOR);
    assert.equal(config.address, FAME_BURN_POOL_ROTATOR_BASE_ADDRESS);
    assert.equal(config.expectedFame, FAME);
    assert.equal(config.expectedFame, FAME_BURN_POOL_ROTATOR_EXPECTED_FAME);
    assert.equal(config.expectedMirror, MIRROR);
    assert.equal(
      config.expectedMirror,
      FAME_BURN_POOL_ROTATOR_EXPECTED_MIRROR,
    );
    assert.equal(
      config.expectedRuntimeBytecode,
      FAME_BURN_POOL_ROTATOR_RUNTIME_BYTECODE,
    );
    assert.equal(
      config.expectedRuntimeFingerprint,
      FAME_BURN_POOL_ROTATOR_RUNTIME_FINGERPRINT,
    );
  });

  it("fails closed for unsupported chains and missing/malformed deployment values", () => {
    assert.equal(getFameRotatorConfig(mainnet.id).status, "not_configured");
    assert.equal(getFameRotatorConfig(sepolia.id).status, "not_configured");
    // Default argument is Base; explicit Base remains configured.
    assert.equal(getFameRotatorConfig().status, "configured");
    assert.equal(getFameRotatorConfig(base.id).status, "configured");

    const invalidAddresses = [
      "   ",
      "not-an-address",
      "0x0000000000000000000000000000000000000000",
      "0xC0e0A441660361ab2B6Ff8032Ed1860E230274bC",
    ];
    for (const address of invalidAddresses) {
      assert.deepEqual(getFameRotatorConfig(base.id, address), {
        status: "not_configured",
        chainId: base.id,
        address: null,
        expectedFame: null,
        expectedMirror: null,
        expectedRuntimeBytecode: null,
        expectedRuntimeFingerprint: null,
        abi: null,
      });
    }
  });

  it("generated ABI exposes rotateTo, TargetNotReached, fame, and mirror", () => {
    assert.equal(hasRequiredRotatorAbiSurface(fameBurnPoolRotatorAbi), true);
    const names = new Set(
      fameBurnPoolRotatorAbi.map((e) => ("name" in e ? e.name : undefined)),
    );
    assert.ok(names.has("rotateTo"));
    assert.ok(names.has("TargetNotReached"));
    assert.ok(names.has("fame"));
    assert.ok(names.has("mirror"));
  });

  it("runtime identity rejects empty code, lookalike runtime, and mismatched getters", () => {
    const good = {
      code: FAME_BURN_POOL_ROTATOR_RUNTIME_BYTECODE,
      fame: FAME,
      mirror: MIRROR,
      expectedRuntimeBytecode: FAME_BURN_POOL_ROTATOR_RUNTIME_BYTECODE,
      expectedFame: FAME,
      expectedMirror: MIRROR,
    };

    assert.deepEqual(evaluateRotatorExecutionIdentity(good), {
      compatible: true,
    });

    assert.equal(
      evaluateRotatorExecutionIdentity({ ...good, code: "0x" }).reason,
      "missing_code",
    );
    assert.equal(
      evaluateRotatorExecutionIdentity({ ...good, code: "0x00" }).reason,
      "missing_code",
    );

    // Lookalike: non-empty different bytecode but matching getters
    const lookalike = "0x6001600055" as Hex;
    assert.equal(
      evaluateRotatorExecutionIdentity({ ...good, code: lookalike }).reason,
      "runtime_mismatch",
    );

    assert.equal(
      evaluateRotatorExecutionIdentity({
        ...good,
        fame: "0x0000000000000000000000000000000000000001",
      }).reason,
      "fame_mismatch",
    );
    assert.equal(
      evaluateRotatorExecutionIdentity({
        ...good,
        mirror: "0x0000000000000000000000000000000000000001",
      }).reason,
      "mirror_mismatch",
    );
    assert.equal(
      evaluateRotatorExecutionIdentity({ ...good, fame: null }).reason,
      "invalid_fame",
    );
    assert.equal(
      evaluateRotatorExecutionIdentity({ ...good, mirror: null }).reason,
      "invalid_mirror",
    );
  });

  it("pinned fingerprint matches keccak of the pinned runtime bytecode", () => {
    assert.equal(
      FAME_BURN_POOL_ROTATOR_RUNTIME_FINGERPRINT,
      keccak256(FAME_BURN_POOL_ROTATOR_RUNTIME_BYTECODE),
    );
    assert.match(FAME_BURN_POOL_ROTATOR_RUNTIME_BYTECODE, /^0x[0-9a-fA-F]+$/);
    assert.ok(FAME_BURN_POOL_ROTATOR_RUNTIME_BYTECODE.length > 100);
    // Independently derived live Base fingerprint captured at pin time.
    assert.equal(
      FAME_BURN_POOL_ROTATOR_RUNTIME_FINGERPRINT,
      "0x982e54e0f6df3475fe87675a0892d5f47688e26b52190186493e6c445c875514",
    );
  });
});
