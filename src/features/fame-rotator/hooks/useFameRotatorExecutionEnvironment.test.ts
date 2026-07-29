import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  encodeFunctionResult,
  keccak256,
  type Address,
  type Hex,
} from "viem";
import { fameBurnPoolRotatorAbi } from "@/wagmi";
import {
  FAME_BURN_POOL_ROTATOR_EXPECTED_FAME,
  FAME_BURN_POOL_ROTATOR_EXPECTED_MIRROR,
  FAME_BURN_POOL_ROTATOR_RUNTIME_BYTECODE,
  FAME_BURN_POOL_ROTATOR_RUNTIME_FINGERPRINT,
  evaluateRotatorExecutionIdentity,
} from "../config";
import {
  readWalletRotatorIdentity,
  resolveFameRotatorExecutionEnvironment,
} from "./useFameRotatorExecutionEnvironment";

const ROTATOR: Address = "0xC0e0A441660361ab2B6Ff8032Ed1860E230274bc";
const FAME = FAME_BURN_POOL_ROTATOR_EXPECTED_FAME;
const MIRROR = FAME_BURN_POOL_ROTATOR_EXPECTED_MIRROR;
const OTHER_FAME: Address = "0x0000000000000000000000000000000000000001";
const OTHER_MIRROR: Address = "0x0000000000000000000000000000000000000002";
const DIFFERENT_CODE: Hex = "0x6001600055";

describe("wallet rotator identity evaluation (execution gate)", () => {
  it("blocks writes when wallet bytecode is empty", () => {
    const identity = evaluateRotatorExecutionIdentity({
      code: "0x",
      fame: FAME,
      mirror: MIRROR,
      expectedRuntimeBytecode: FAME_BURN_POOL_ROTATOR_RUNTIME_BYTECODE,
      expectedFame: FAME,
      expectedMirror: MIRROR,
    });
    assert.equal(identity.compatible, false);
    if (identity.compatible) return;
    assert.equal(identity.reason, "missing_code");
  });

  it("blocks writes when wallet bytecode differs from the pinned runtime", () => {
    const identity = evaluateRotatorExecutionIdentity({
      code: DIFFERENT_CODE,
      fame: FAME,
      mirror: MIRROR,
      expectedRuntimeBytecode: FAME_BURN_POOL_ROTATOR_RUNTIME_BYTECODE,
      expectedFame: FAME,
      expectedMirror: MIRROR,
    });
    assert.equal(identity.compatible, false);
    if (identity.compatible) return;
    assert.equal(identity.reason, "runtime_mismatch");
  });

  it("blocks writes when the runtime fingerprint disagrees with the pin", () => {
    const differentFingerprint = keccak256(DIFFERENT_CODE);
    assert.notEqual(
      differentFingerprint,
      FAME_BURN_POOL_ROTATOR_RUNTIME_FINGERPRINT,
    );
    // Full bytecode mismatch is the authority; fingerprint is the independent check.
    const identity = evaluateRotatorExecutionIdentity({
      code: DIFFERENT_CODE,
      fame: FAME,
      mirror: MIRROR,
      expectedRuntimeBytecode: FAME_BURN_POOL_ROTATOR_RUNTIME_BYTECODE,
      expectedFame: FAME,
      expectedMirror: MIRROR,
    });
    assert.equal(identity.compatible, false);
    assert.notEqual(
      keccak256(DIFFERENT_CODE),
      FAME_BURN_POOL_ROTATOR_RUNTIME_FINGERPRINT,
    );
  });

  it("blocks writes when fame() or mirror() getters mismatch the pin", () => {
    const fameMismatch = evaluateRotatorExecutionIdentity({
      code: FAME_BURN_POOL_ROTATOR_RUNTIME_BYTECODE,
      fame: OTHER_FAME,
      mirror: MIRROR,
      expectedRuntimeBytecode: FAME_BURN_POOL_ROTATOR_RUNTIME_BYTECODE,
      expectedFame: FAME,
      expectedMirror: MIRROR,
    });
    assert.equal(fameMismatch.compatible, false);
    if (!fameMismatch.compatible) {
      assert.equal(fameMismatch.reason, "fame_mismatch");
    }

    const mirrorMismatch = evaluateRotatorExecutionIdentity({
      code: FAME_BURN_POOL_ROTATOR_RUNTIME_BYTECODE,
      fame: FAME,
      mirror: OTHER_MIRROR,
      expectedRuntimeBytecode: FAME_BURN_POOL_ROTATOR_RUNTIME_BYTECODE,
      expectedFame: FAME,
      expectedMirror: MIRROR,
    });
    assert.equal(mirrorMismatch.compatible, false);
    if (!mirrorMismatch.compatible) {
      assert.equal(mirrorMismatch.reason, "mirror_mismatch");
    }
  });

  it("accepts matching pinned bytecode plus fame() and mirror()", () => {
    const identity = evaluateRotatorExecutionIdentity({
      code: FAME_BURN_POOL_ROTATOR_RUNTIME_BYTECODE,
      fame: FAME,
      mirror: MIRROR,
      expectedRuntimeBytecode: FAME_BURN_POOL_ROTATOR_RUNTIME_BYTECODE,
      expectedFame: FAME,
      expectedMirror: MIRROR,
    });
    assert.deepEqual(identity, { compatible: true });
  });
});

describe("readWalletRotatorIdentity", () => {
  it("reads code, fame(), and mirror() through the wallet provider", async () => {
    const calls: Array<{ method: string; params?: readonly unknown[] }> = [];
    let ethCallCount = 0;
    const request = async (input: {
      method: string;
      params?: readonly unknown[];
    }) => {
      calls.push(input);
      if (input.method === "eth_getCode") {
        return FAME_BURN_POOL_ROTATOR_RUNTIME_BYTECODE;
      }
      ethCallCount += 1;
      if (ethCallCount === 1) {
        return encodeFunctionResult({
          abi: fameBurnPoolRotatorAbi,
          functionName: "fame",
          result: FAME,
        });
      }
      return encodeFunctionResult({
        abi: fameBurnPoolRotatorAbi,
        functionName: "mirror",
        result: MIRROR,
      });
    };

    const identity = await readWalletRotatorIdentity(request, ROTATOR);

    assert.equal(identity.code, FAME_BURN_POOL_ROTATOR_RUNTIME_BYTECODE);
    assert.equal(identity.fame, FAME);
    assert.equal(identity.mirror, MIRROR);
    assert.deepEqual(
      calls.map((call) => call.method),
      ["eth_getCode", "eth_call", "eth_call"],
    );
    assert.deepEqual(calls[0].params, [ROTATOR, "latest"]);
  });

  it("does not call fame/mirror getters when code is empty", async () => {
    const calls: string[] = [];
    const identity = await readWalletRotatorIdentity(async ({ method }) => {
      calls.push(method);
      return "0x";
    }, ROTATOR);

    assert.deepEqual(identity, { code: "0x", fame: null, mirror: null });
    assert.deepEqual(calls, ["eth_getCode"]);
  });

  it("times out instead of hanging on a stuck wallet provider", async () => {
    await assert.rejects(
      readWalletRotatorIdentity(
        () => new Promise<never>(() => undefined),
        ROTATOR,
        1,
      ),
      /timed out/i,
    );
  });
});

describe("resolveFameRotatorExecutionEnvironment", () => {
  it("exposes disconnected and wrong-chain recovery without canExecute", () => {
    assert.equal(
      resolveFameRotatorExecutionEnvironment({
        isConnected: false,
        connectedChainId: undefined,
        hasExpectedIdentity: true,
        identityPending: false,
        identity: null,
        identityError: null,
      }).status,
      "disconnected",
    );
    assert.equal(
      resolveFameRotatorExecutionEnvironment({
        isConnected: true,
        connectedChainId: 1,
        hasExpectedIdentity: true,
        identityPending: false,
        identity: null,
        identityError: null,
      }).status,
      "wrong_chain",
    );
  });

  it("blocks canExecute while identity is pending or missing", () => {
    const pending = resolveFameRotatorExecutionEnvironment({
      isConnected: true,
      connectedChainId: 8453,
      hasExpectedIdentity: true,
      identityPending: true,
      identity: null,
      identityError: null,
    });
    assert.equal(pending.status, "checking");
    assert.equal(pending.canExecute, false);

    const missingPin = resolveFameRotatorExecutionEnvironment({
      isConnected: true,
      connectedChainId: 8453,
      hasExpectedIdentity: false,
      identityPending: false,
      identity: null,
      identityError: null,
    });
    assert.equal(missingPin.status, "checking");
    assert.equal(missingPin.canExecute, false);
  });

  it("surfaces wallet provider failures as retryable environment errors", () => {
    const result = resolveFameRotatorExecutionEnvironment({
      isConnected: true,
      connectedChainId: 8453,
      hasExpectedIdentity: true,
      identityPending: false,
      identity: null,
      identityError: new Error("RPC unavailable"),
    });
    assert.equal(result.status, "error");
    assert.equal(result.canExecute, false);
  });

  it("blocks writes when identity is incompatible", () => {
    const result = resolveFameRotatorExecutionEnvironment({
      isConnected: true,
      connectedChainId: 8453,
      hasExpectedIdentity: true,
      identityPending: false,
      identity: {
        compatible: false,
        reason: "runtime_mismatch",
        message:
          "Your wallet provider is connected to a different rotator environment.",
      },
      identityError: null,
    });
    assert.equal(result.status, "incompatible");
    assert.equal(result.canExecute, false);
  });

  it("allows execution only when identity is compatible", () => {
    const result = resolveFameRotatorExecutionEnvironment({
      isConnected: true,
      connectedChainId: 8453,
      hasExpectedIdentity: true,
      identityPending: false,
      identity: { compatible: true },
      identityError: null,
    });
    assert.equal(result.status, "ready");
    assert.equal(result.canExecute, true);
  });
});
