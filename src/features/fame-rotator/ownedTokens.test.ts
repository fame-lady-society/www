import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Address } from "viem";
import {
  SOCIETY_TOKEN_ID_COUNT,
  SOCIETY_TOKEN_ID_MAX,
  SOCIETY_TOKEN_ID_MIN,
  buildOwnerAtChunks,
  isOwnedTokenScanCurrent,
  projectOwnedTokenScan,
  type OwnerAtChunkResult,
} from "./ownedTokens";

const ACCOUNT = "0x1111111111111111111111111111111111111111" as Address;
const OTHER = "0x2222222222222222222222222222222222222222" as Address;
const ZERO = "0x0000000000000000000000000000000000000000" as Address;
const BLOCK = 12_345_678n;

function fullCoverageChunks(
  owned: readonly number[],
  ownerMap?: Map<number, Address>,
): OwnerAtChunkResult[] {
  const chunks = buildOwnerAtChunks(100);
  return chunks.map((tokenIds) => ({
    tokenIds,
    owners: tokenIds.map((id) => {
      const mapped = ownerMap?.get(id);
      if (mapped !== undefined) return mapped;
      return owned.includes(id) ? ACCOUNT : OTHER;
    }),
  }));
}

describe("projectOwnedTokenScan", () => {
  it("completes with zero, one, and multiple owned IDs matching balanceOf", () => {
    const zero = projectOwnedTokenScan({
      account: ACCOUNT,
      blockNumber: BLOCK,
      balance: 0n,
      chunks: fullCoverageChunks([]),
    });
    assert.equal(zero.status, "complete");
    if (zero.status === "complete") {
      assert.deepEqual(zero.ownedIds, []);
      assert.equal(zero.balance, 0n);
      assert.equal(zero.blockNumber, BLOCK);
      assert.equal(zero.account, ACCOUNT);
    }

    const one = projectOwnedTokenScan({
      account: ACCOUNT,
      blockNumber: BLOCK,
      balance: 1n,
      chunks: fullCoverageChunks([12]),
    });
    assert.equal(one.status, "complete");
    if (one.status === "complete") {
      assert.deepEqual(one.ownedIds, [12]);
    }

    const multi = projectOwnedTokenScan({
      account: ACCOUNT,
      blockNumber: BLOCK,
      balance: 3n,
      chunks: fullCoverageChunks([3, 100, 888]),
    });
    assert.equal(multi.status, "complete");
    if (multi.status === "complete") {
      assert.deepEqual(multi.ownedIds, [3, 100, 888]);
    }
  });

  it("requires the same captured block and full 1..888 coverage", () => {
    assert.equal(
      projectOwnedTokenScan({
        account: ACCOUNT,
        blockNumber: null,
        balance: 0n,
        chunks: [],
      }).status,
      "incomplete",
    );

    const partial = projectOwnedTokenScan({
      account: ACCOUNT,
      blockNumber: BLOCK,
      balance: 0n,
      chunks: [
        {
          tokenIds: [1, 2, 3],
          owners: [OTHER, OTHER, OTHER],
        },
      ],
    });
    assert.equal(partial.status, "incomplete");
    assert.match(
      (partial as { reason: string }).reason,
      /covered 3 of 888|missing/i,
    );
  });

  it("fails closed on partial failures, length mismatch, wrong balance, and duplicates", () => {
    assert.equal(
      projectOwnedTokenScan({
        account: ACCOUNT,
        blockNumber: BLOCK,
        balance: 0n,
        chunks: [{ tokenIds: [1], owners: [OTHER], failed: true }],
      }).status,
      "incomplete",
    );

    assert.equal(
      projectOwnedTokenScan({
        account: ACCOUNT,
        blockNumber: BLOCK,
        balance: 0n,
        chunks: [{ tokenIds: [1, 2], owners: [OTHER] }],
      }).status,
      "incomplete",
    );

    assert.equal(
      projectOwnedTokenScan({
        account: ACCOUNT,
        blockNumber: BLOCK,
        balance: 0n,
        chunks: fullCoverageChunks([12]),
      }).status,
      "incomplete",
    );

    assert.equal(
      projectOwnedTokenScan({
        account: ACCOUNT,
        blockNumber: BLOCK,
        balance: 2n,
        chunks: fullCoverageChunks([12]),
      }).status,
      "incomplete",
    );

    const nullOwnerChunks = fullCoverageChunks([]);
    nullOwnerChunks[0] = {
      tokenIds: nullOwnerChunks[0].tokenIds,
      owners: nullOwnerChunks[0].tokenIds.map((id, i) =>
        i === 0 ? null : OTHER,
      ),
    };
    assert.equal(
      projectOwnedTokenScan({
        account: ACCOUNT,
        blockNumber: BLOCK,
        balance: 0n,
        chunks: nullOwnerChunks,
      }).status,
      "incomplete",
    );
  });

  it("rejects missing account and zero address", () => {
    assert.equal(
      projectOwnedTokenScan({
        account: null,
        blockNumber: BLOCK,
        balance: 0n,
        chunks: [],
      }).status,
      "error",
    );
    assert.equal(
      projectOwnedTokenScan({
        account: ZERO,
        blockNumber: BLOCK,
        balance: 0n,
        chunks: [],
      }).status,
      "error",
    );
  });
});

describe("isOwnedTokenScanCurrent", () => {
  it("discards results keyed to an old account or after disconnect", () => {
    const scan = projectOwnedTokenScan({
      account: ACCOUNT,
      blockNumber: BLOCK,
      balance: 1n,
      chunks: fullCoverageChunks([5]),
    });
    assert.equal(isOwnedTokenScanCurrent(scan, ACCOUNT, BLOCK), true);
    assert.equal(isOwnedTokenScanCurrent(scan, OTHER, BLOCK), false);
    assert.equal(isOwnedTokenScanCurrent(scan, null, BLOCK), false);
    assert.equal(isOwnedTokenScanCurrent(scan, ACCOUNT, 99n), false);
  });
});

describe("buildOwnerAtChunks", () => {
  it("covers every Society token ID exactly once", () => {
    const chunks = buildOwnerAtChunks(50);
    const flat = chunks.flat();
    assert.equal(flat.length, SOCIETY_TOKEN_ID_COUNT);
    assert.equal(flat[0], SOCIETY_TOKEN_ID_MIN);
    assert.equal(flat[flat.length - 1], SOCIETY_TOKEN_ID_MAX);
    assert.equal(new Set(flat).size, SOCIETY_TOKEN_ID_COUNT);
  });
});
