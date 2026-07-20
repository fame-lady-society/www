import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Address, Hash, Hex } from "viem";
import { encodeFunctionData } from "viem";
import { fameBurnPoolRotatorAbi, fameMirrorAbi } from "@/wagmi";
import {
  executeRotatorTransaction,
  type ExecuteRotatorTransactionDependencies,
  type ExecuteRotatorTransactionResult,
} from "./useFameRotatorTransaction";
import {
  buildApprovalRequest,
  buildRotationRequest,
  freezeApprovalContext,
  freezeRotationContext,
} from "../transactions/contractRequests";
import type {
  RotatorFrozenIntent,
  RotatorTransactionEvent,
} from "../transactionState";

const ACCOUNT = "0x1111111111111111111111111111111111111111" as Address;
const ROTATOR = "0xC0e0A441660361ab2B6Ff8032Ed1860E230274bc" as Address;
const MIRROR = "0xBB5ED04dD7B207592429eb8d599d103CCad646c4" as Address;
const ZERO = "0x0000000000000000000000000000000000000000" as Address;
const HASH = `0x${"1".repeat(64)}` as Hash;
const HASH2 = `0x${"2".repeat(64)}` as Hash;

const approvalContext = freezeApprovalContext({
  account: ACCOUNT,
  offeredId: 12,
  mirror: MIRROR,
  rotator: ROTATOR,
});
const approvalRequest = buildApprovalRequest(approvalContext);
const approvalInput = encodeFunctionData({
  abi: fameMirrorAbi,
  functionName: "approve",
  args: [ROTATOR, 12n],
});

const rotationContext = freezeRotationContext({
  account: ACCOUNT,
  targetId: 5,
  offeredId: 12,
  maxRotations: 3,
  mirror: MIRROR,
  rotator: ROTATOR,
});
const rotationRequest = buildRotationRequest(rotationContext);
const rotationInput = encodeFunctionData({
  abi: fameBurnPoolRotatorAbi,
  functionName: "rotateTo",
  args: [12n, 5n, 3n, ACCOUNT],
});

function frozenApprove(): RotatorFrozenIntent {
  return {
    action: "approve",
    account: ACCOUNT,
    chainId: 8453,
    targetId: null,
    offeredId: 12n,
    maxRotations: null,
    recipient: null,
    rotator: ROTATOR,
    mirror: MIRROR,
    callDataFingerprint: approvalInput,
  };
}

function frozenRotate(): RotatorFrozenIntent {
  return {
    action: "rotate",
    account: ACCOUNT,
    chainId: 8453,
    targetId: 5n,
    offeredId: 12n,
    maxRotations: 3n,
    recipient: ACCOUNT,
    rotator: ROTATOR,
    mirror: MIRROR,
    callDataFingerprint: rotationInput,
  };
}

function matchingTx(input: Hex, to: Address = ROTATOR) {
  return {
    from: ACCOUNT,
    to,
    value: 0n,
    input,
  };
}

function baseDeps(
  overrides: Partial<ExecuteRotatorTransactionDependencies> = {},
): {
  events: RotatorTransactionEvent[];
  deps: ExecuteRotatorTransactionDependencies;
} {
  const events: RotatorTransactionEvent[] = [];
  const deps: ExecuteRotatorTransactionDependencies = {
    dispatch: (event) => events.push(event),
    simulate: async (request) => request,
    write: async () => HASH,
    wait: async () => ({
      status: "success",
      blockNumber: 100n,
      transactionHash: HASH,
    }),
    getTransaction: async () => matchingTx(rotationInput),
    expectedInput: rotationInput,
    frozenIntent: frozenRotate(),
    confirmApprovalAuthorization: async () => true,
    readRotationOwnershipAtBlock: async () => ({
      targetOwner: ACCOUNT,
      offeredOwner: ZERO,
    }),
    refreshLatest: async () => undefined,
    ...overrides,
  };
  return { events, deps };
}

describe("executeRotatorTransaction — approval", () => {
  it("progresses through simulation, wallet, broadcast, receipt, and verified authorization", async () => {
    const order: string[] = [];
    const { events, deps } = baseDeps({
      expectedInput: approvalInput,
      frozenIntent: frozenApprove(),
      getTransaction: async () => matchingTx(approvalInput, MIRROR),
      simulate: async (request) => {
        order.push("simulate");
        assert.equal(request.functionName, "approve");
        return request;
      },
      write: async (request) => {
        order.push("write");
        assert.equal(request.functionName, "approve");
        return HASH;
      },
      wait: async () => {
        order.push("wait");
        return {
          status: "success",
          blockNumber: 42n,
          transactionHash: HASH,
        };
      },
      confirmApprovalAuthorization: async () => {
        order.push("confirmAuth");
        return true;
      },
      refreshLatest: async () => {
        order.push("refresh");
      },
    });

    const result = await executeRotatorTransaction(approvalRequest, deps);

    assert.deepEqual(order, [
      "simulate",
      "write",
      "wait",
      "confirmAuth",
      "refresh",
    ]);
    assert.equal(result.status, "verified");
    assert.equal(
      events.map((e) => e.type).join(">"),
      "started>wallet_requested>broadcast>mined>verified",
    );
    assert.equal(events[0]?.type === "started" && events[0].action, "approve");
  });

  it("keeps rejected, reverted, cancelled, and replaced approvals distinct", async () => {
    // Wallet reject
    {
      const { deps } = baseDeps({
        expectedInput: approvalInput,
        frozenIntent: frozenApprove(),
        getTransaction: async () => matchingTx(approvalInput, MIRROR),
        write: async () => {
          throw { code: 4001, name: "UserRejectedRequestError" };
        },
      });
      const result = await executeRotatorTransaction(approvalRequest, deps);
      assert.equal(result.status, "failed");
      if (result.status === "failed") {
        assert.equal(result.error.kind, "wallet_rejected");
      }
    }

    // Receipt revert
    {
      const { deps } = baseDeps({
        expectedInput: approvalInput,
        frozenIntent: frozenApprove(),
        getTransaction: async () => matchingTx(approvalInput, MIRROR),
        wait: async () => ({
          status: "reverted",
          blockNumber: 1n,
          transactionHash: HASH,
        }),
      });
      const result = await executeRotatorTransaction(approvalRequest, deps);
      assert.equal(result.status, "failed");
      if (result.status === "failed") {
        assert.equal(result.error.kind, "receipt_reverted");
      }
    }

    // Cancelled replacement
    {
      const { events, deps } = baseDeps({
        expectedInput: approvalInput,
        frozenIntent: frozenApprove(),
        getTransaction: async () => matchingTx(approvalInput, MIRROR),
        wait: async (_hash, onReplaced) => {
          onReplaced({ reason: "cancelled", hash: HASH2 });
          return {
            status: "success",
            blockNumber: 1n,
            transactionHash: HASH2,
          };
        },
      });
      const result = await executeRotatorTransaction(approvalRequest, deps);
      assert.equal(result.status, "cancelled");
      assert.equal(events.at(-1)?.type, "cancelled");
    }

    // Different calldata replacement (destination mismatch)
    {
      const { deps } = baseDeps({
        expectedInput: approvalInput,
        frozenIntent: frozenApprove(),
        getTransaction: async () =>
          matchingTx(approvalInput, ROTATOR /* wrong destination */),
        wait: async (_hash, onReplaced) => {
          onReplaced({ reason: "replaced", hash: HASH2 });
          return {
            status: "success",
            blockNumber: 1n,
            transactionHash: HASH2,
          };
        },
      });
      const result = await executeRotatorTransaction(approvalRequest, deps);
      assert.equal(result.status, "different_transaction");
    }
  });
});

describe("executeRotatorTransaction — rotation", () => {
  it("blocks duplicate semantics by preserving the exact simulated request through write", async () => {
    let written: unknown = null;
    const simulated = { ...rotationRequest, gas: 123_456n };
    const { deps } = baseDeps({
      simulate: async () => simulated,
      write: async (request) => {
        written = request;
        return HASH;
      },
    });

    await executeRotatorTransaction(rotationRequest, deps);
    assert.deepEqual(written, simulated);
  });

  it("repriced rotation adopts the replacement hash and receipt block", async () => {
    const { events, deps } = baseDeps({
      wait: async (_hash, onReplaced) => {
        onReplaced({ reason: "repriced", hash: HASH2 });
        return {
          status: "success",
          blockNumber: 999n,
          transactionHash: HASH2,
        };
      },
      getTransaction: async (hash) => {
        assert.equal(hash, HASH2);
        return matchingTx(rotationInput);
      },
    });

    const result = await executeRotatorTransaction(rotationRequest, deps);
    assert.equal(result.status, "verified");
    if (result.status === "verified") {
      assert.equal(result.hash, HASH2);
      assert.equal(result.replacement?.reason, "repriced");
    }
    assert.equal(
      events.some(
        (e) => e.type === "replaced" && e.reason === "repriced" && e.hash === HASH2,
      ),
      true,
    );
    assert.equal(
      events.some(
        (e) =>
          e.type === "mined" && e.hash === HASH2 && e.blockNumber === 999n,
      ),
      true,
    );
  });

  it("cancelled rotation terminates without success; changed destination is a different transaction", async () => {
    {
      const { deps } = baseDeps({
        wait: async (_hash, onReplaced) => {
          onReplaced({ reason: "cancelled", hash: HASH2 });
          return {
            status: "success",
            blockNumber: 1n,
            transactionHash: HASH2,
          };
        },
      });
      const result = await executeRotatorTransaction(rotationRequest, deps);
      assert.equal(result.status, "cancelled");
    }

    {
      const { deps } = baseDeps({
        getTransaction: async () => matchingTx(rotationInput, MIRROR),
      });
      const result = await executeRotatorTransaction(rotationRequest, deps);
      assert.equal(result.status, "different_transaction");
    }

    {
      // Changed calldata (args differ) even with correct destination.
      const otherInput = encodeFunctionData({
        abi: fameBurnPoolRotatorAbi,
        functionName: "rotateTo",
        args: [12n, 5n, 99n, ACCOUNT],
      });
      const { deps } = baseDeps({
        getTransaction: async () => matchingTx(otherInput),
      });
      const result = await executeRotatorTransaction(rotationRequest, deps);
      assert.equal(result.status, "different_transaction");
    }
  });

  it("TargetNotReached maps to stale-pool recovery", async () => {
    const { events, deps } = baseDeps({
      simulate: async () => {
        throw { data: { errorName: "TargetNotReached" } };
      },
    });
    const result = await executeRotatorTransaction(rotationRequest, deps);
    assert.equal(result.status, "failed");
    if (result.status === "failed") {
      assert.equal(result.error.kind, "target_not_reached");
      assert.equal(result.error.shouldRefresh, true);
      assert.match(result.error.message, /pool|bound|refresh/i);
    }
    assert.equal(events.at(-1)?.type, "reverted");
  });

  it("successful receipt plus target owner and zero offered owner confirms rotation", async () => {
    const { deps } = baseDeps({
      readRotationOwnershipAtBlock: async (block) => {
        assert.equal(block, 100n);
        return { targetOwner: ACCOUNT, offeredOwner: ZERO };
      },
    });
    const result = await executeRotatorTransaction(rotationRequest, deps);
    assert.equal(result.status, "verified");
  });

  it("successful receipt with mismatched owners remains unresolved and never reports success", async () => {
    const { events, deps } = baseDeps({
      readRotationOwnershipAtBlock: async () => ({
        targetOwner: ACCOUNT,
        offeredOwner: ACCOUNT, // not burned
      }),
    });
    const result = await executeRotatorTransaction(rotationRequest, deps);
    assert.equal(result.status, "failed");
    if (result.status === "failed") {
      assert.equal(result.error.kind, "ownership_mismatch");
      assert.equal(result.error.blockRetryWrite, true);
    }
    assert.equal(
      events.some((e) => e.type === "verified"),
      false,
    );
  });

  it("getTransaction failure after a successful receipt enters mined/verifying without re-arming writes", async () => {
    const { events, deps } = baseDeps({
      getTransaction: async () => {
        throw new Error("RPC pruned transaction");
      },
    });
    const result = await executeRotatorTransaction(rotationRequest, deps);
    assert.equal(result.status, "verification_pending");
    assert.equal(
      events.some((e) => e.type === "mined"),
      true,
    );
    assert.equal(
      events.some((e) => e.type === "verification_pending"),
      true,
    );
    assert.equal(
      events.some((e) => e.type === "failed"),
      false,
    );
  });

  it("historical read failure enters mined/verifying; retry path is without another write", async () => {
    const { events, deps } = baseDeps({
      readRotationOwnershipAtBlock: async () => ({
        targetOwner: null,
        offeredOwner: null,
      }),
    });
    const result = await executeRotatorTransaction(rotationRequest, deps);
    assert.equal(result.status, "verification_pending");
    if (result.status === "verification_pending") {
      assert.equal(result.hash, HASH);
      assert.equal(result.blockNumber, 100n);
    }
    assert.equal(events.at(-1)?.type, "verification_pending");
    assert.equal(
      events.some((e) => e.type === "verified"),
      false,
    );
  });

  it("latest refresh failure after receipt-block proof retains confirmed rotation", async () => {
    const { events, deps } = baseDeps({
      refreshLatest: async () => {
        throw new Error("RPC unavailable");
      },
    });
    const result = await executeRotatorTransaction(rotationRequest, deps);
    assert.equal(result.status, "refresh_failed_after_verified");
    assert.equal(
      events.some((e) => e.type === "verified"),
      true,
    );
    assert.equal(events.at(-1)?.type, "refresh_failed_after_verified");
    if (result.status === "refresh_failed_after_verified") {
      assert.equal(result.hash, HASH);
    }
  });

  it("frozen intent is attached at start so open wallet prompts keep original attribution", async () => {
    const { events, deps } = baseDeps({
      write: async () => {
        // Capture that started already froze intent before wallet return.
        const started = events.find((e) => e.type === "started");
        assert.ok(started && started.type === "started");
        if (started.type === "started") {
          assert.equal(started.frozenIntent.targetId, 5n);
          assert.equal(started.frozenIntent.offeredId, 12n);
          assert.equal(started.frozenIntent.maxRotations, 3n);
        }
        return HASH;
      },
    });
    await executeRotatorTransaction(rotationRequest, deps);
  });

  it("mining-time revert is presented as a plain failure with refresh recommended", async () => {
    const { deps } = baseDeps({
      wait: async () => ({
        status: "reverted",
        blockNumber: 50n,
        transactionHash: HASH,
      }),
    });
    const result: ExecuteRotatorTransactionResult =
      await executeRotatorTransaction(rotationRequest, deps);
    assert.equal(result.status, "failed");
    if (result.status === "failed") {
      assert.equal(result.error.kind, "receipt_reverted");
      assert.equal(result.error.shouldRefresh, true);
      assert.match(result.error.message, /reverted|offered NFT|refresh/i);
    }
  });
});
