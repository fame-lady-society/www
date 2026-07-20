import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Address, Hash } from "viem";
import type { VerifiedRepairProjection } from "@/features/society-nft-readiness/state";
import {
  acquisitionInvalidateKey,
  fameRotatorAcquisitionBranch,
  nextAcquisitionInvalidateKey,
  shouldInvalidateAfterReconciliation,
  shouldInvalidateAfterSkipRepair,
  shouldOfferBuyMore,
} from "./useFameRotatorAcquisition";
import { projectFameRotatorPreflight } from "../state";
import type { OwnedTokenScanResult } from "../ownedTokens";

const ACCOUNT = "0x0000000000000000000000000000000000000aAa" as Address;
const HASH = `0x${"1".repeat(64)}` as Hash;
const HASH_2 = `0x${"2".repeat(64)}` as Hash;

const emptyComplete: OwnedTokenScanResult = {
  status: "complete",
  account: ACCOUNT,
  blockNumber: 1n,
  balance: 0n,
  ownedIds: [],
};

function needsFamePreflight(shortfall: bigint) {
  const unit = 1_000_000n * 10n ** 18n;
  return projectFameRotatorPreflight({
    isConnected: true,
    account: ACCOUNT,
    ownership: emptyComplete,
    ownershipPending: false,
    fameBalance: { status: "success", data: unit - shortfall },
    unit: { status: "success", data: unit },
    skipNft: { status: "success", data: false },
  });
}

describe("fameRotatorAcquisitionBranch", () => {
  it("maps skip repair, buy fame, and reconciliation without approval/rotation coupling", () => {
    assert.equal(
      fameRotatorAcquisitionBranch({ status: "needs_skip_repair" }),
      "skip_repair",
    );
    assert.equal(
      fameRotatorAcquisitionBranch({ status: "needs_fame" }),
      "buy_fame",
    );
    assert.equal(
      fameRotatorAcquisitionBranch({ status: "needs_reconciliation" }),
      "reconciliation",
    );
    assert.equal(
      fameRotatorAcquisitionBranch({ status: "direct_eligible" }),
      "hidden",
    );
    assert.equal(
      fameRotatorAcquisitionBranch({ status: "checking" }),
      "hidden",
    );
  });

  it("offers buy more only for needs_fame", () => {
    assert.equal(shouldOfferBuyMore({ status: "needs_fame" }), true);
    assert.equal(shouldOfferBuyMore({ status: "needs_reconciliation" }), false);
    assert.equal(shouldOfferBuyMore({ status: "needs_skip_repair" }), false);
    assert.equal(shouldOfferBuyMore({ status: "direct_eligible" }), false);
  });
});

describe("skip repair invalidation gate", () => {
  const verified: Extract<VerifiedRepairProjection, { status: "verified" }> = {
    status: "verified",
    branch: "future",
    balance: 0n,
    unit: 1n,
    nftBalance: 0n,
    eligibleNftCount: 0n,
    nftDeficit: 0n,
  };

  it("requires confirmed transaction and getSkipNFT-false verification before advancing", () => {
    assert.equal(
      shouldInvalidateAfterSkipRepair({
        preflightStatus: "needs_skip_repair",
        transactionStatus: "confirmed",
        verifiedRepair: verified,
        transactionHash: HASH,
      }),
      true,
    );

    // Receipt alone without verified repair is not enough.
    assert.equal(
      shouldInvalidateAfterSkipRepair({
        preflightStatus: "needs_skip_repair",
        transactionStatus: "confirming",
        verifiedRepair: { status: "unresolved" },
        transactionHash: HASH,
      }),
      false,
    );

    // Skip still enabled / unverified must not advance.
    assert.equal(
      shouldInvalidateAfterSkipRepair({
        preflightStatus: "needs_skip_repair",
        transactionStatus: "confirmed",
        verifiedRepair: { status: "unresolved" },
        transactionHash: HASH,
      }),
      false,
    );

    // Wrong preflight branch.
    assert.equal(
      shouldInvalidateAfterSkipRepair({
        preflightStatus: "needs_fame",
        transactionStatus: "confirmed",
        verifiedRepair: verified,
        transactionHash: HASH,
      }),
      false,
    );
  });
});

describe("reconciliation invalidation", () => {
  it("invalidates only after confirmed reconciliation", () => {
    assert.equal(
      shouldInvalidateAfterReconciliation({
        preflightStatus: "needs_reconciliation",
        transactionStatus: "confirmed",
        transactionHash: HASH,
      }),
      true,
    );
    assert.equal(
      shouldInvalidateAfterReconciliation({
        preflightStatus: "needs_reconciliation",
        transactionStatus: "confirming",
        transactionHash: HASH,
      }),
      false,
    );
    assert.equal(
      shouldInvalidateAfterReconciliation({
        preflightStatus: "needs_fame",
        transactionStatus: "confirmed",
        transactionHash: HASH,
      }),
      false,
    );
  });
});

describe("acquisition invalidate one-shot keys", () => {
  it("fires once per key and stays independent of rotation/approval keys", () => {
    const swapKey = acquisitionInvalidateKey("swap", HASH, ACCOUNT);
    const repairKey = acquisitionInvalidateKey("repair", HASH, ACCOUNT);
    assert.notEqual(swapKey, repairKey);
    assert.match(swapKey, /^swap:/);
    assert.doesNotMatch(swapKey, /approval|rotation/i);

    const first = nextAcquisitionInvalidateKey(null, swapKey);
    assert.equal(first, swapKey);
    assert.equal(nextAcquisitionInvalidateKey(first, swapKey), null);

    const second = nextAcquisitionInvalidateKey(first, HASH_2);
    assert.equal(second, HASH_2);
  });
});

describe("remaining shortfall after partial purchase path", () => {
  it("recomputes remaining shortfall from parent-invalidated preflight data", () => {
    const unit = 1_000_000n * 10n ** 18n;
    const initial = needsFamePreflight(unit);
    assert.equal(initial.status, "needs_fame");
    if (initial.status !== "needs_fame") return;
    assert.equal(initial.shortfall, unit);

    // After a confirmed swap still short of one unit, parent invalidates and
    // projects a smaller shortfall — acquisition does not assert eligibility.
    const remaining = unit / 2n;
    const after = needsFamePreflight(remaining);
    assert.equal(after.status, "needs_fame");
    if (after.status !== "needs_fame") return;
    assert.equal(after.shortfall, remaining);
    assert.equal(shouldOfferBuyMore(after), true);
    assert.equal(fameRotatorAcquisitionBranch(after), "buy_fame");
  });
});
