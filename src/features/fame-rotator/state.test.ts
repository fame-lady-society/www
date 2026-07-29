import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Address } from "viem";
import {
  projectOwnedTokenScan,
  buildOwnerAtChunks,
  type OwnedTokenScanResult,
} from "./ownedTokens";
import {
  projectFameRotatorPreflight,
  type ReadState,
} from "./state";

const ACCOUNT = "0x1111111111111111111111111111111111111111" as Address;
const OTHER = "0x2222222222222222222222222222222222222222" as Address;
const BLOCK = 99n;
const UNIT = 10n ** 18n;

function success<T>(data: T): ReadState<T> {
  return { status: "success", data };
}

function completeOwnership(ownedIds: number[]): OwnedTokenScanResult {
  const chunks = buildOwnerAtChunks(100).map((tokenIds) => ({
    tokenIds,
    owners: tokenIds.map((id) =>
      ownedIds.includes(id) ? ACCOUNT : OTHER,
    ) as Address[],
  }));
  return projectOwnedTokenScan({
    account: ACCOUNT,
    blockNumber: BLOCK,
    balance: BigInt(ownedIds.length),
    chunks,
  });
}

describe("projectFameRotatorPreflight", () => {
  it("is disconnected without a wallet", () => {
    const p = projectFameRotatorPreflight({
      isConnected: false,
      account: null,
      ownership: null,
      ownershipPending: false,
      fameBalance: null,
      unit: null,
      skipNft: null,
    });
    assert.equal(p.status, "disconnected");
    assert.equal(p.canSelectOffered, false);
  });

  it("shows checking while ownership is pending", () => {
    const p = projectFameRotatorPreflight({
      isConnected: true,
      account: ACCOUNT,
      ownership: null,
      ownershipPending: true,
      fameBalance: null,
      unit: null,
      skipNft: null,
    });
    assert.equal(p.status, "checking");
  });

  it("direct eligibility ignores FAME balance and skip mode when an NFT is owned", () => {
    const ownership = completeOwnership([12]);
    assert.equal(ownership.status, "complete");

    const p = projectFameRotatorPreflight({
      isConnected: true,
      account: ACCOUNT,
      ownership,
      ownershipPending: false,
      fameBalance: success(0n),
      unit: success(UNIT),
      skipNft: success(true),
    });
    assert.equal(p.status, "direct_eligible");
    assert.equal(p.canSelectOffered, true);
    assert.deepEqual(p.ownedIds, [12]);
  });

  it("no NFT + skip true yields skip repair before swap or reconciliation", () => {
    const ownership = completeOwnership([]);
    const p = projectFameRotatorPreflight({
      isConnected: true,
      account: ACCOUNT,
      ownership,
      ownershipPending: false,
      fameBalance: success(0n),
      unit: success(UNIT),
      skipNft: success(true),
    });
    assert.equal(p.status, "needs_skip_repair");
  });

  it("no NFT + skip false + balance below unit yields exact bigint shortfall", () => {
    const ownership = completeOwnership([]);
    const balance = UNIT / 2n;
    const p = projectFameRotatorPreflight({
      isConnected: true,
      account: ACCOUNT,
      ownership,
      ownershipPending: false,
      fameBalance: success(balance),
      unit: success(UNIT),
      skipNft: success(false),
    });
    assert.equal(p.status, "needs_fame");
    if (p.status === "needs_fame") {
      assert.equal(p.shortfall, UNIT - balance);
      assert.equal(p.unit, UNIT);
      assert.equal(p.balance, balance);
    }
  });

  it("no NFT + skip false + balance at or above unit yields reconciliation, not swap", () => {
    const ownership = completeOwnership([]);
    const p = projectFameRotatorPreflight({
      isConnected: true,
      account: ACCOUNT,
      ownership,
      ownershipPending: false,
      fameBalance: success(UNIT),
      unit: success(UNIT),
      skipNft: success(false),
    });
    assert.equal(p.status, "needs_reconciliation");
    assert.notEqual(p.status, "needs_fame");
  });

  it("zero or failed unit and failed balance/skip never produce actionable readiness", () => {
    const ownership = completeOwnership([]);

    assert.equal(
      projectFameRotatorPreflight({
        isConnected: true,
        account: ACCOUNT,
        ownership,
        ownershipPending: false,
        fameBalance: success(UNIT),
        unit: success(0n),
        skipNft: success(false),
      }).status,
      "read_failure",
    );

    assert.equal(
      projectFameRotatorPreflight({
        isConnected: true,
        account: ACCOUNT,
        ownership,
        ownershipPending: false,
        fameBalance: { status: "error" },
        unit: success(UNIT),
        skipNft: success(false),
      }).status,
      "read_failure",
    );

    assert.equal(
      projectFameRotatorPreflight({
        isConnected: true,
        account: ACCOUNT,
        ownership,
        ownershipPending: false,
        fameBalance: success(UNIT),
        unit: success(UNIT),
        skipNft: { status: "error" },
      }).status,
      "read_failure",
    );
  });

  it("incomplete inventory is retryable and not selectable", () => {
    const ownership: OwnedTokenScanResult = {
      status: "incomplete",
      account: ACCOUNT,
      blockNumber: BLOCK,
      balance: 1n,
      ownedIds: [],
      reason: "partial",
    };
    const p = projectFameRotatorPreflight({
      isConnected: true,
      account: ACCOUNT,
      ownership,
      ownershipPending: false,
      fameBalance: success(UNIT),
      unit: success(UNIT),
      skipNft: success(false),
    });
    assert.equal(p.status, "incomplete_inventory");
    assert.equal(p.canSelectOffered, false);
    if (p.status === "incomplete_inventory") {
      assert.equal(p.retryable, true);
    }
  });
});
