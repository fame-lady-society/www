import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Address, Hash } from "viem";
import { base, mainnet } from "viem/chains";
import { fameBurnPoolRotatorAbi, fameMirrorAbi } from "@/wagmi";
import {
  buildApprovalRequest,
  buildRotationRequest,
  classifyRotatorRequestError,
  deriveMaxRotationsFromOrderedIds,
  evaluateRotationSimulationReadiness,
  freezeApprovalContext,
  freezeRotationContext,
  freezeRotationContextFromFifo,
  isApprovalContextValid,
  isRotationContextValid,
  isRotatorAuthorizedForOffered,
  needsRotatorApproval,
  simulateThenWriteExactRequest,
  type FrozenApprovalContext,
  type FameRotatorApprovalRequest,
  type FameRotatorRotationRequest,
} from "./contractRequests";

const ACCOUNT: Address = "0x00000000000000000000000000000000000000A1";
const OTHER_ACCOUNT: Address = "0x00000000000000000000000000000000000000A2";
const MIRROR: Address = "0xBB5ED04dD7B207592429eb8d599d103CCad646c4";
const OTHER_MIRROR: Address = "0x00000000000000000000000000000000000000AA";
const ROTATOR: Address = "0xC0e0A441660361ab2B6Ff8032Ed1860E230274bc";
const OTHER_ROTATOR: Address = "0x00000000000000000000000000000000000000BB";
const UNRELATED_SPENDER: Address = "0x00000000000000000000000000000000000000CC";
const ZERO: Address = "0x0000000000000000000000000000000000000000";

const OFFERED_ID = 12;
const TARGET_ID = 42;

describe("approval request builders", () => {
  it("builds a token-scoped approve on mirror with rotator spender, offered ID, account, and Base", () => {
    const context = freezeApprovalContext({
      account: ACCOUNT,
      offeredId: OFFERED_ID,
      mirror: MIRROR,
      rotator: ROTATOR,
    });
    const request = buildApprovalRequest(context);

    assert.equal(request.address, MIRROR);
    assert.equal(request.abi, fameMirrorAbi);
    assert.equal(request.functionName, "approve");
    assert.equal(request.account, ACCOUNT);
    assert.equal(request.chainId, base.id);
    assert.deepEqual(request.args, [ROTATOR, BigInt(OFFERED_ID)]);
    // No value, no operator-style setApprovalForAll surface.
    assert.equal("value" in request, false);
    assert.notEqual(request.functionName, "setApprovalForAll");
  });

  it("freezes account, Base, offered ID, mirror, and rotator spender", () => {
    const context = freezeApprovalContext({
      account: ACCOUNT,
      offeredId: 7,
      mirror: MIRROR,
      rotator: ROTATOR,
    });

    assert.deepEqual(context, {
      account: ACCOUNT,
      chainId: base.id,
      offeredId: 7n,
      mirror: MIRROR,
      rotator: ROTATOR,
    } satisfies FrozenApprovalContext);
  });
});

describe("rotation request builders", () => {
  it("builds rotateTo with refreshed target/offered, index+1 bound, and recipient = initiating account", () => {
    const orderedTokenIds = [10, TARGET_ID, 99]; // target at index 1 → maxRotations 2
    const prepared = freezeRotationContextFromFifo({
      account: ACCOUNT,
      targetId: TARGET_ID,
      offeredId: OFFERED_ID,
      orderedTokenIds,
      mirror: MIRROR,
      rotator: ROTATOR,
    });

    assert.equal(prepared.status, "ready");
    if (prepared.status !== "ready") return;

    assert.equal(prepared.context.recipient, ACCOUNT);
    assert.equal(prepared.context.maxRotations, 2n);
    assert.equal(prepared.context.targetId, BigInt(TARGET_ID));
    assert.equal(prepared.context.offeredId, BigInt(OFFERED_ID));
    assert.equal(prepared.context.chainId, base.id);

    const request = buildRotationRequest(prepared.context);
    assert.equal(request.address, ROTATOR);
    assert.equal(request.abi, fameBurnPoolRotatorAbi);
    assert.equal(request.functionName, "rotateTo");
    assert.equal(request.account, ACCOUNT);
    assert.equal(request.chainId, base.id);
    assert.deepEqual(request.args, [
      BigInt(OFFERED_ID),
      BigInt(TARGET_ID),
      2n,
      ACCOUNT,
    ]);
  });

  it("forces recipient to the initiating account even if a different recipient is supplied", () => {
    const context = freezeRotationContext({
      account: ACCOUNT,
      targetId: TARGET_ID,
      offeredId: OFFERED_ID,
      maxRotations: 3,
      mirror: MIRROR,
      rotator: ROTATOR,
      // Intentionally wrong — product freezes recipient to account.
      recipient: OTHER_ACCOUNT,
    });

    assert.equal(context.recipient, ACCOUNT);
    assert.notEqual(context.recipient, OTHER_ACCOUNT);
  });

  it("blocks freeze when the target is absent from the fresh FIFO snapshot", () => {
    const prepared = freezeRotationContextFromFifo({
      account: ACCOUNT,
      targetId: TARGET_ID,
      offeredId: OFFERED_ID,
      orderedTokenIds: [1, 2, 3],
      mirror: MIRROR,
      rotator: ROTATOR,
    });

    assert.equal(prepared.status, "target_absent");
    if (prepared.status !== "target_absent") return;
    assert.match(prepared.message, /no longer in the burn pool|not in/i);
  });

  it("derives maxRotations as zero-based index + 1", () => {
    assert.deepEqual(deriveMaxRotationsFromOrderedIds([5, 8, 12], 5), {
      status: "present",
      index: 0,
      maxRotations: 1,
    });
    assert.deepEqual(deriveMaxRotationsFromOrderedIds([5, 8, 12], 12), {
      status: "present",
      index: 2,
      maxRotations: 3,
    });
    assert.deepEqual(deriveMaxRotationsFromOrderedIds([5, 8, 12], 99), {
      status: "absent",
    });
  });
});

describe("frozen context invalidation", () => {
  const approval = freezeApprovalContext({
    account: ACCOUNT,
    offeredId: OFFERED_ID,
    mirror: MIRROR,
    rotator: ROTATOR,
  });

  const rotation = freezeRotationContext({
    account: ACCOUNT,
    targetId: TARGET_ID,
    offeredId: OFFERED_ID,
    maxRotations: 4,
    mirror: MIRROR,
    rotator: ROTATOR,
  });

  it("invalidates approval context on account, chain, offered ID, mirror, or rotator change", () => {
    assert.equal(
      isApprovalContextValid(approval, {
        account: ACCOUNT,
        chainId: base.id,
        offeredId: OFFERED_ID,
        mirror: MIRROR,
        rotator: ROTATOR,
      }),
      true,
    );

    assert.equal(
      isApprovalContextValid(approval, {
        account: OTHER_ACCOUNT,
        chainId: base.id,
        offeredId: OFFERED_ID,
        mirror: MIRROR,
        rotator: ROTATOR,
      }),
      false,
    );
    assert.equal(
      isApprovalContextValid(approval, {
        account: ACCOUNT,
        chainId: mainnet.id,
        offeredId: OFFERED_ID,
        mirror: MIRROR,
        rotator: ROTATOR,
      }),
      false,
    );
    assert.equal(
      isApprovalContextValid(approval, {
        account: ACCOUNT,
        chainId: base.id,
        offeredId: 99,
        mirror: MIRROR,
        rotator: ROTATOR,
      }),
      false,
    );
    assert.equal(
      isApprovalContextValid(approval, {
        account: ACCOUNT,
        chainId: base.id,
        offeredId: OFFERED_ID,
        mirror: OTHER_MIRROR,
        rotator: ROTATOR,
      }),
      false,
    );
    assert.equal(
      isApprovalContextValid(approval, {
        account: ACCOUNT,
        chainId: base.id,
        offeredId: OFFERED_ID,
        mirror: MIRROR,
        rotator: OTHER_ROTATOR,
      }),
      false,
    );
  });

  it("invalidates rotation context on account, chain, target, offered, bound, recipient, or identity change", () => {
    const liveBase = {
      account: ACCOUNT,
      chainId: base.id,
      targetId: TARGET_ID,
      offeredId: OFFERED_ID,
      maxRotations: 4,
      recipient: ACCOUNT,
      mirror: MIRROR,
      rotator: ROTATOR,
    };

    assert.equal(isRotationContextValid(rotation, liveBase), true);

    assert.equal(
      isRotationContextValid(rotation, { ...liveBase, account: OTHER_ACCOUNT }),
      false,
    );
    assert.equal(
      isRotationContextValid(rotation, { ...liveBase, chainId: mainnet.id }),
      false,
    );
    assert.equal(
      isRotationContextValid(rotation, { ...liveBase, targetId: 1 }),
      false,
    );
    assert.equal(
      isRotationContextValid(rotation, { ...liveBase, offeredId: 1 }),
      false,
    );
    assert.equal(
      isRotationContextValid(rotation, { ...liveBase, maxRotations: 5 }),
      false,
    );
    assert.equal(
      isRotationContextValid(rotation, {
        ...liveBase,
        recipient: OTHER_ACCOUNT,
      }),
      false,
    );
    assert.equal(
      isRotationContextValid(rotation, { ...liveBase, mirror: OTHER_MIRROR }),
      false,
    );
    assert.equal(
      isRotationContextValid(rotation, { ...liveBase, rotator: OTHER_ROTATOR }),
      false,
    );
  });
});

describe("authorization skip rules", () => {
  it("skips new approval when getApproved(offeredId) == rotator", () => {
    assert.equal(
      isRotatorAuthorizedForOffered({
        rotator: ROTATOR,
        getApproved: ROTATOR,
        isApprovedForAll: false,
      }),
      true,
    );
    assert.equal(
      needsRotatorApproval({
        rotator: ROTATOR,
        getApproved: ROTATOR,
        isApprovedForAll: false,
      }),
      false,
    );
  });

  it("skips new approval when isApprovedForAll(owner, rotator) is true", () => {
    assert.equal(
      isRotatorAuthorizedForOffered({
        rotator: ROTATOR,
        getApproved: ZERO,
        isApprovedForAll: true,
      }),
      true,
    );
    assert.equal(
      needsRotatorApproval({
        rotator: ROTATOR,
        getApproved: ZERO,
        isApprovedForAll: true,
      }),
      false,
    );
  });

  it("does not skip when only an unrelated spender is approved", () => {
    assert.equal(
      isRotatorAuthorizedForOffered({
        rotator: ROTATOR,
        getApproved: UNRELATED_SPENDER,
        isApprovedForAll: false,
      }),
      false,
    );
    assert.equal(
      needsRotatorApproval({
        rotator: ROTATOR,
        getApproved: UNRELATED_SPENDER,
        isApprovedForAll: false,
      }),
      true,
    );
  });

  it("does not skip when getApproved is zero and operator is false", () => {
    assert.equal(
      needsRotatorApproval({
        rotator: ROTATOR,
        getApproved: ZERO,
        isApprovedForAll: false,
      }),
      true,
    );
  });
});

describe("simulation readiness gates", () => {
  it("blocks simulation when offered ownership is lost", () => {
    const result = evaluateRotationSimulationReadiness({
      offeredOwner: OTHER_ACCOUNT,
      account: ACCOUNT,
      targetInPool: true,
      authorized: true,
      contextValid: true,
      identityCompatible: true,
    });
    assert.equal(result.ready, false);
    if (result.ready) return;
    assert.equal(result.reason, "offered_not_owned");
  });

  it("blocks simulation when the target disappears from the FIFO snapshot", () => {
    const result = evaluateRotationSimulationReadiness({
      offeredOwner: ACCOUNT,
      account: ACCOUNT,
      targetInPool: false,
      authorized: true,
      contextValid: true,
      identityCompatible: true,
    });
    assert.equal(result.ready, false);
    if (result.ready) return;
    assert.equal(result.reason, "target_absent");
  });

  it("blocks simulation when approval is lost between actions", () => {
    const result = evaluateRotationSimulationReadiness({
      offeredOwner: ACCOUNT,
      account: ACCOUNT,
      targetInPool: true,
      authorized: false,
      contextValid: true,
      identityCompatible: true,
    });
    assert.equal(result.ready, false);
    if (result.ready) return;
    assert.equal(result.reason, "approval_missing");
  });

  it("allows simulation only when ownership, target, approval, context, and identity all hold", () => {
    const result = evaluateRotationSimulationReadiness({
      offeredOwner: ACCOUNT,
      account: ACCOUNT,
      targetInPool: true,
      authorized: true,
      contextValid: true,
      identityCompatible: true,
    });
    assert.deepEqual(result, { ready: true });
  });
});

describe("exact simulated-request preservation", () => {
  it("write receives the exact approval request object returned by simulation (identity)", async () => {
    const context = freezeApprovalContext({
      account: ACCOUNT,
      offeredId: OFFERED_ID,
      mirror: MIRROR,
      rotator: ROTATOR,
    });
    const built = buildApprovalRequest(context);
    const simulated: FameRotatorApprovalRequest = Object.freeze({
      ...built,
      // Marker that would be lost if write rebuilt args from context.
      gas: 123_456n,
    });

    let written: FameRotatorApprovalRequest | null = null;
    const hash: Hash = `0x${"1".repeat(64)}`;

    const result = await simulateThenWriteExactRequest(built, {
      simulate: async (request) => {
        assert.equal(request, built);
        return simulated;
      },
      write: async (request) => {
        written = request;
        return hash;
      },
    });

    assert.equal(result.hash, hash);
    assert.equal(written, simulated);
    assert.notEqual(written, built);
  });

  it("write receives the exact rotation request object returned by simulation (identity)", async () => {
    const context = freezeRotationContext({
      account: ACCOUNT,
      targetId: TARGET_ID,
      offeredId: OFFERED_ID,
      maxRotations: 2,
      mirror: MIRROR,
      rotator: ROTATOR,
    });
    const built = buildRotationRequest(context);
    const simulated: FameRotatorRotationRequest = Object.freeze({
      ...built,
      gas: 999_001n,
    });

    let written: FameRotatorRotationRequest | null = null;
    const hash: Hash = `0x${"2".repeat(64)}`;

    await simulateThenWriteExactRequest(built, {
      simulate: async () => simulated,
      write: async (request) => {
        written = request;
        return hash;
      },
    });

    assert.equal(written, simulated);
  });
});

describe("contract error classification", () => {
  it("classifies ERC721 receiver rejection as recipient compatibility failure", () => {
    const byName = classifyRotatorRequestError({
      data: { errorName: "ERC721InvalidReceiver" },
    });
    assert.equal(byName.kind, "recipient_incompatible");
    assert.match(byName.message, /recipient|receiver/i);

    const byLegacy = classifyRotatorRequestError({
      data: { errorName: "TransferToNonERC721ReceiverImplementer" },
    });
    assert.equal(byLegacy.kind, "recipient_incompatible");
  });

  it("classifies TargetNotReached distinctly from recipient failures", () => {
    const result = classifyRotatorRequestError({
      data: { errorName: "TargetNotReached" },
    });
    assert.equal(result.kind, "target_not_reached");
    assert.match(result.message, /pool|target|bound/i);
  });

  it("does not mislabel unrelated reverts as recipient incompatibility", () => {
    const result = classifyRotatorRequestError(new Error("RPC unavailable"));
    assert.notEqual(result.kind, "recipient_incompatible");
  });
});
