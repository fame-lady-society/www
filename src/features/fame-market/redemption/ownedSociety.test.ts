import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Address } from "viem";
import {
  buildOwnedSocietyRanges,
  isOwnedSocietyProviderLimitError,
  projectOwnedSocietyIds,
  readOwnedSocietyIds,
  type OwnedSocietyRangeResult,
} from "./ownedSociety";

const ACCOUNT = "0x1111111111111111111111111111111111111111" as Address;
const CHECKOUT = "0x2222222222222222222222222222222222222222" as Address;
const MIRROR = "0x3333333333333333333333333333333333333333" as Address;
const BLOCK = 49_000_000n;

describe("owned Society projection", () => {
  it("accepts one complete sorted full-range result matching mirror balanceOf", () => {
    const projected = projectOwnedSocietyIds({
      account: ACCOUNT,
      blockNumber: BLOCK,
      balance: 3n,
      ranges: [{ start: 1n, endExclusive: 889n, tokenIds: [2n, 44n, 888n] }],
    });

    assert.equal(projected.status, "ready");
    if (projected.status === "ready") {
      assert.deepEqual(projected.tokenIds, [2n, 44n, 888n]);
      assert.equal(projected.blockNumber, BLOCK);
    }
  });

  it("fails closed for gaps, overlaps, unsorted IDs, duplicates, range violations, or count drift", () => {
    const validRanges: OwnedSocietyRangeResult[] = [
      { start: 1n, endExclusive: 445n, tokenIds: [2n, 44n] },
      { start: 445n, endExclusive: 889n, tokenIds: [888n] },
    ];
    const project = (
      ranges: readonly OwnedSocietyRangeResult[],
      balance = 3n,
    ) =>
      projectOwnedSocietyIds({
        account: ACCOUNT,
        blockNumber: BLOCK,
        balance,
        ranges,
      });

    assert.equal(project(validRanges).status, "ready");
    assert.equal(project([validRanges[0]]).status, "error");
    assert.equal(
      project([
        validRanges[0],
        { start: 444n, endExclusive: 889n, tokenIds: [888n] },
      ]).status,
      "error",
    );
    assert.equal(
      project([{ start: 1n, endExclusive: 889n, tokenIds: [44n, 2n] }], 2n)
        .status,
      "error",
    );
    assert.equal(
      project([{ start: 1n, endExclusive: 889n, tokenIds: [2n, 2n] }], 2n)
        .status,
      "error",
    );
    assert.equal(
      project([{ start: 1n, endExclusive: 445n, tokenIds: [888n] }], 1n).status,
      "error",
    );
    assert.equal(project(validRanges, 2n).status, "error");
  });

  it("tries the full range first and falls back to non-overlapping ranges at the same block only after failure", async () => {
    const reads: Array<{
      functionName: string;
      blockNumber?: bigint;
      args?: readonly unknown[];
    }> = [];
    const client = {
      getBlockNumber: async () => BLOCK,
      async readContract(request: {
        functionName: string;
        blockNumber?: bigint;
        args?: readonly unknown[];
      }) {
        reads.push(request);
        if (request.functionName === "balanceOf") return 3n;
        const [, start, endExclusive] = request.args ?? [];
        if (start === 1n && endExclusive === 889n) {
          throw new Error("eth_call response exceeds provider limit");
        }
        if (start === 1n) return [2n, 44n];
        if (endExclusive === 889n) return [888n];
        return [];
      },
    };

    const result = await readOwnedSocietyIds({
      client: client as never,
      account: ACCOUNT,
      checkout: CHECKOUT,
      mirror: MIRROR,
      fallbackRangeSize: 444n,
    });

    assert.equal(result.status, "ready");
    if (result.status === "ready") {
      assert.deepEqual(result.tokenIds, [2n, 44n, 888n]);
    }
    assert.ok(reads.every((read) => read.blockNumber === BLOCK));
    const ownershipReads = reads.filter(
      (read) => read.functionName === "ownedSocietyTokenIds",
    );
    assert.deepEqual(
      ownershipReads.map((read) => read.args?.slice(1)),
      [
        [1n, 889n],
        [1n, 445n],
        [445n, 889n],
      ],
    );
  });

  it("does not use fallback ranges when the full read succeeds", async () => {
    let ownershipReads = 0;
    const result = await readOwnedSocietyIds({
      client: {
        getBlockNumber: async () => BLOCK,
        readContract: async (request: { functionName: string }) => {
          if (request.functionName === "balanceOf") return 1n;
          ownershipReads += 1;
          return [77n];
        },
      } as never,
      account: ACCOUNT,
      checkout: CHECKOUT,
      mirror: MIRROR,
    });

    assert.equal(result.status, "ready");
    assert.equal(ownershipReads, 1);
  });

  it("does not hide unrelated RPC failures behind range fallback", async () => {
    let ownershipReads = 0;
    await assert.rejects(
      readOwnedSocietyIds({
        client: {
          getBlockNumber: async () => BLOCK,
          readContract: async (request: { functionName: string }) => {
            if (request.functionName === "balanceOf") return 1n;
            ownershipReads += 1;
            throw new Error("request timed out");
          },
        } as never,
        account: ACCOUNT,
        checkout: CHECKOUT,
        mirror: MIRROR,
      }),
      /request timed out/u,
    );
    assert.equal(ownershipReads, 1);
  });

  it("observes balance and ownership reads together", async () => {
    await assert.rejects(
      readOwnedSocietyIds({
        client: {
          getBlockNumber: async () => BLOCK,
          readContract: (request: { functionName: string }) => {
            if (request.functionName === "balanceOf") {
              return Promise.reject(new Error("balance read failed"));
            }
            return new Promise<readonly bigint[]>((resolve) =>
              setTimeout(() => resolve([77n]), 1),
            );
          },
        } as never,
        account: ACCOUNT,
        checkout: CHECKOUT,
        mirror: MIRROR,
      }),
      /balance read failed/u,
    );
  });

  it("recognizes only provider size or call-gas failures as range-fallback signals", () => {
    assert.equal(
      isOwnedSocietyProviderLimitError({
        shortMessage: "Returned data is too large",
      }),
      true,
    );
    assert.equal(
      isOwnedSocietyProviderLimitError({
        cause: new Error("gas required exceeds allowance"),
      }),
      true,
    );
    assert.equal(
      isOwnedSocietyProviderLimitError(new Error("rate limit exceeded")),
      false,
    );
    assert.equal(
      isOwnedSocietyProviderLimitError(new Error("execution reverted")),
      false,
    );
  });
});

describe("buildOwnedSocietyRanges", () => {
  it("covers [1, 889) exactly once", () => {
    const ranges = buildOwnedSocietyRanges(128n);
    assert.deepEqual(ranges[0], { start: 1n, endExclusive: 129n });
    assert.deepEqual(ranges.at(-1), { start: 769n, endExclusive: 889n });
    for (let index = 1; index < ranges.length; index += 1) {
      assert.equal(ranges[index - 1]?.endExclusive, ranges[index]?.start);
    }
  });
});
