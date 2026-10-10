import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { toHex, zeroAddress, type Address, type PublicClient } from "viem";
import { readIdentityProfile } from "./identityProfile";

const NAMING = "0x1111111111111111111111111111111111111111" as Address;
const PRIMARY = "0x2222222222222222222222222222222222222222" as Address;
const RECEIPT_BLOCK = 123n;

function fixture({
  releasedName = false,
  burnedToken = false,
  failedRead = false,
} = {}) {
  const calls: string[] = [];
  const client = {
    async readContract(request: {
      functionName: string;
      args: readonly unknown[];
      blockNumber: bigint;
    }) {
      assert.equal(request.blockNumber, RECEIPT_BLOCK);
      calls.push(request.functionName);
      if (request.functionName === "resolveName") {
        assert.deepEqual(request.args, ["example"]);
        return releasedName ? 0n : 2n;
      }
      assert.deepEqual(request.args, [2n]);
      if (request.functionName === "getIdentity")
        return burnedToken
          ? ["", zeroAddress, 0n]
          : ["example", PRIMARY, 6457n];
      if (request.functionName === "getVerifiedAddresses") {
        if (failedRead) throw new Error("Profile read unavailable.");
        return [PRIMARY];
      }
      throw new Error(`Unexpected read: ${request.functionName}`);
    },
    async multicall(request: {
      blockNumber: bigint;
      allowFailure: boolean;
      contracts: { args: readonly unknown[] }[];
    }) {
      assert.equal(request.blockNumber, RECEIPT_BLOCK);
      assert.equal(request.allowFailure, false);
      assert.ok(request.contracts.every((contract) => contract.args[0] === 2n));
      return [
        toHex("Updated description"),
        toHex("https://example.com"),
        "0x",
        "0x",
      ];
    },
  } as unknown as PublicClient;
  return { client, calls };
}

describe("profile refresh after identity sync", () => {
  it("resolves the name and reads all profile fields at the receipt block", async () => {
    const { client } = fixture();
    const profile = await readIdentityProfile(
      client,
      NAMING,
      1,
      "example",
      RECEIPT_BLOCK,
    );
    assert.equal(profile.blockNumber, RECEIPT_BLOCK);
    assert.equal(profile.identity?.tokenId, 2n);
    assert.equal(profile.identity?.description, "Updated description");
    assert.equal(profile.identity?.website, "https://example.com");
    assert.deepEqual(profile.identity?.verifiedAddresses, [PRIMARY]);
  });

  it("removes a released name without reading stale identity or metadata", async () => {
    const { client, calls } = fixture({ releasedName: true });
    const profile = await readIdentityProfile(
      client,
      NAMING,
      1,
      "example",
      RECEIPT_BLOCK,
    );
    assert.equal(profile.identity, null);
    assert.deepEqual(calls, ["resolveName"]);
  });

  it("removes a burned token when the URL contains its token ID", async () => {
    const { client, calls } = fixture({ burnedToken: true });
    const profile = await readIdentityProfile(
      client,
      NAMING,
      1,
      "2",
      RECEIPT_BLOCK,
    );
    assert.equal(profile.identity, null);
    assert.deepEqual(calls, ["getIdentity"]);
  });

  it("surfaces a failed refresh instead of publishing an incomplete profile", async () => {
    await assert.rejects(
      readIdentityProfile(
        fixture({ failedRead: true }).client,
        NAMING,
        1,
        2n,
        RECEIPT_BLOCK,
      ),
      /Profile read unavailable/,
    );
  });
});
