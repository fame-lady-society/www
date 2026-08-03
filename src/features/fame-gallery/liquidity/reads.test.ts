import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Address } from "viem";
import {
  readLiquidityInventory,
  readLiquidityProviderPosition,
  readWalletOwnedSociety,
  type GalleryLiquidityReadClient,
} from "./reads";

const marketplace = "0x1111111111111111111111111111111111111111" as Address;
const mirror = "0x2222222222222222222222222222222222222222" as Address;
const creatorMagic = "0x3333333333333333333333333333333333333333" as Address;
const fame = "0x4444444444444444444444444444444444444444" as Address;
const account = "0x5555555555555555555555555555555555555555" as Address;
const other = "0x6666666666666666666666666666666666666666" as Address;
const addresses = { marketplace, mirror, creatorMagic, fame };

function success(result: unknown) {
  return { status: "success" as const, result };
}

function client(input: {
  owners: ReadonlyMap<bigint, Address>;
  balance?: bigint;
  providerPosition?: readonly [bigint, bigint];
  calls?: string[];
  throwTokenUri?: boolean;
}): GalleryLiquidityReadClient {
  return {
    async getBlockNumber() {
      return 9_999n;
    },
    async readContract(read) {
      if (read.functionName === "balanceOf") return input.balance ?? 0n;
      if (read.functionName === "providerPosition") {
        return input.providerPosition ?? ([0n, 0n] as const);
      }
      throw new Error(`Unexpected read ${read.functionName}`);
    },
    async multicall(read) {
      if (
        input.throwTokenUri &&
        read.contracts.some((contract) => contract.functionName === "tokenURI")
      ) {
        throw new Error("metadata rpc unavailable");
      }
      return read.contracts.map((contract) => {
        input.calls?.push(contract.functionName);
        const tokenId = contract.args?.[0] as bigint;
        if (contract.functionName === "ownerAt") {
          return success(input.owners.get(tokenId) ?? other);
        }
        if (contract.functionName === "artworkHash") {
          return success(`0x${tokenId.toString(16).padStart(64, "0")}`);
        }
        if (contract.functionName === "tokenURI") {
          return success(`data:token/${tokenId.toString()}`);
        }
        throw new Error(`Unexpected multicall ${contract.functionName}`);
      });
    },
  };
}

describe("gallery liquidity reads", () => {
  it("discovers wallet Society ownership without the checkout contract", async () => {
    const result = await readWalletOwnedSociety(
      client({
        owners: new Map([
          [1n, account],
          [2n, other],
          [3n, account],
        ]),
        balance: 2n,
      }),
      9_998n,
      account,
      [1n, 2n, 3n],
      addresses,
    );

    assert.equal(result.status, "success");
    if (result.status !== "success") return;
    assert.deepEqual(result.data, [
      { tokenId: 1n, tokenUri: "data:token/1" },
      { tokenId: 3n, tokenUri: "data:token/3" },
    ]);
  });

  it("fails closed when the owner scan does not reconcile with balanceOf", async () => {
    const result = await readWalletOwnedSociety(
      client({ owners: new Map([[1n, account]]), balance: 2n }),
      9_998n,
      account,
      [1n, 2n, 3n],
      addresses,
    );
    assert.deepEqual(result, {
      status: "failure",
      blockNumber: 9_998n,
      message: "Society ownership scan found 1 token but balanceOf is 2.",
    });
  });

  it("keeps verified wallet ownership when token metadata is unavailable", async () => {
    const result = await readWalletOwnedSociety(
      client({
        owners: new Map([
          [1n, account],
          [2n, other],
          [3n, account],
        ]),
        balance: 2n,
        throwTokenUri: true,
      }),
      9_998n,
      account,
      [1n, 2n, 3n],
      addresses,
    );

    assert.equal(result.status, "success");
    if (result.status !== "success") return;
    assert.deepEqual(result.data, [
      { tokenId: 1n, tokenUri: null },
      { tokenId: 3n, tokenUri: null },
    ]);
  });

  it("returns every currently marketplace-owned Society with artwork data", async () => {
    const calls: string[] = [];
    const result = await readLiquidityInventory(
      client({
        owners: new Map([
          [1n, marketplace],
          [2n, other],
          [3n, marketplace],
        ]),
        calls,
      }),
      9_998n,
      [1n, 2n, 3n],
      addresses,
    );
    assert.equal(result.status, "success");
    if (result.status !== "success") return;
    assert.deepEqual(
      result.data.map(({ tokenId, tokenUri }) => ({ tokenId, tokenUri })),
      [
        { tokenId: 1n, tokenUri: "data:token/1" },
        { tokenId: 3n, tokenUri: "data:token/3" },
      ],
    );
    assert.equal(calls.includes("artworkHash"), false);
  });

  it("reads the connected wallet provider position at the pinned block", async () => {
    const result = await readLiquidityProviderPosition(
      client({ owners: new Map(), providerPosition: [4n, 2n] }),
      9_998n,
      account,
      addresses,
    );
    assert.deepEqual(result, {
      status: "success",
      blockNumber: 9_998n,
      data: { account, unitCount: 4n, indexPlusOne: 2n },
    });
  });
});
