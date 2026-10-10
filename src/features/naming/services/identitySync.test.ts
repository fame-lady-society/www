import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  UserRejectedRequestError,
  zeroAddress,
  type Address,
  type Hash,
  type PublicClient,
} from "viem";
import { SOCIAL_PROVIDERS } from "../attestations";
import { readIdentityIndex } from "./identityIndex";
import {
  previewIdentityBurn,
  sameIdentityBurn,
  waitForIdentitySync,
  identitySyncError,
  SettledSyncError,
} from "./identitySync";

const NAMING = "0x1111111111111111111111111111111111111111" as Address;
const PRIMARY = "0x2222222222222222222222222222222222222222" as Address;
const SECOND_PRIMARY = "0x3333333333333333333333333333333333333333" as Address;
const VERIFIED_SECONDARY =
  "0x4444444444444444444444444444444444444444" as Address;
const OUTSIDER = "0x5555555555555555555555555555555555555555" as Address;
const GATE = "0x6666666666666666666666666666666666666666" as Address;
const HASH = `0x${"a".repeat(64)}` as Hash;
const REPLACEMENT = `0x${"b".repeat(64)}` as Hash;

function fixture({
  allVerified = false,
  burnedFirst = false,
  ownerError = false,
} = {}) {
  const calls: {
    functionName: string;
    blockNumber: bigint;
    args?: readonly unknown[];
  }[] = [];
  const simulations: {
    functionName: string;
    blockNumber: bigint;
    args: readonly unknown[];
  }[] = [];
  const identities = [
    burnedFirst ? ["", zeroAddress, 0n] : ["stale-name", PRIMARY, 101n],
    ["valid-name", SECOND_PRIMARY, 202n],
    ["", zeroAddress, 0n],
  ];
  const client = {
    async getBlockNumber(options: { cacheTime: number }) {
      assert.equal(options.cacheTime, 0);
      return 100n;
    },
    async readContract(request: {
      functionName: string;
      blockNumber: bigint;
      args?: readonly unknown[];
    }) {
      calls.push(request);
      assert.equal(
        request.blockNumber,
        100n,
        "all reads use the simulation's block",
      );
      switch (request.functionName) {
        case "nextTokenId":
          return 4n;
        case "gateNft":
          return GATE;
        case "getIdentity":
          return identities[Number(request.args![0]) - 1];
        case "addressToTokenId":
          return request.args![0] === PRIMARY ? 1n : 2n;
        case "ownerOf":
          if (ownerError) throw new Error("Ownership read unavailable.");
          return request.args![0] === 101n ? OUTSIDER : VERIFIED_SECONDARY;
        case "isVerified":
          return allVerified || request.args![1] === VERIFIED_SECONDARY;
        default:
          throw new Error(`Unexpected read: ${request.functionName}`);
      }
    },
    async multicall(request: {
      blockNumber: bigint;
      allowFailure: boolean;
      contracts: { functionName: string }[];
    }) {
      assert.equal(request.blockNumber, 100n);
      assert.equal(
        request.allowFailure,
        false,
        "failed reads must not become a partial preview",
      );
      return request.contracts[0].functionName === "getIdentity"
        ? identities
        : Array(3 * SOCIAL_PROVIDERS.length).fill("0x");
    },
    async simulateContract(request: {
      functionName: string;
      blockNumber: bigint;
      args: readonly unknown[];
    }) {
      simulations.push(request);
      assert.equal(request.blockNumber, 100n);
      assert.equal(request.functionName, "sync");
      return { result: undefined };
    },
  } as unknown as PublicClient;
  return { client, calls, simulations };
}

describe("identity sync preview", () => {
  it("simulates only the requested token and predicts its burn for an unverified gate NFT owner", async () => {
    const { client, calls, simulations } = fixture();
    const burn = await previewIdentityBurn(client, NAMING, 1n);
    assert.ok(burn);
    assert.equal(burn.name, "stale-name");
    assert.equal(burn.tokenId, 1n);
    assert.equal(burn.primaryTokenId, 101n);
    assert.equal(burn.tokenOwner, OUTSIDER);
    assert.equal(burn.gateNft, GATE);
    assert.equal(burn.blockNumber, 100n);
    assert.deepEqual(
      simulations.map((call) => call.args),
      [[PRIMARY]],
    );
    assert.deepEqual(
      calls
        .filter((call) => call.functionName === "getIdentity")
        .map((call) => call.args),
      [[1n]],
    );
    assert.equal(
      calls.some((call) => call.functionName === "nextTokenId"),
      false,
    );
  });

  it("still simulates the requested token when sync is a no-op", async () => {
    const { client, simulations } = fixture({ allVerified: true });
    assert.equal(await previewIdentityBurn(client, NAMING, 1n), null);
    assert.equal(simulations.length, 1);
  });

  it("does not burn when the gate NFT moved to a verified secondary address", async () => {
    const { client, simulations } = fixture();
    assert.equal(await previewIdentityBurn(client, NAMING, 2n), null);
    assert.deepEqual(
      simulations.map((call) => call.args),
      [[SECOND_PRIMARY]],
    );
  });

  it("does not simulate a token already burned", async () => {
    const { client, simulations } = fixture({ burnedFirst: true });
    assert.equal(await previewIdentityBurn(client, NAMING, 1n), null);
    assert.equal(simulations.length, 0);
  });

  it("fails the preview if ownership cannot be checked", async () => {
    const { client } = fixture({ ownerError: true });
    await assert.rejects(
      previewIdentityBurn(client, NAMING, 1n),
      /Ownership read unavailable/,
    );
  });

  it("refreshes the index without burned IDs or an inflated registered count", async () => {
    const { client } = fixture({ burnedFirst: true });
    const index = await readIdentityIndex(client, NAMING, 100n);
    assert.equal(index.totalCount, 1);
    assert.deepEqual(
      index.identities.map((identity) => identity.tokenId),
      [2n],
    );
  });

  it("rechecks from chain state and detects ownership changes before confirmation", async () => {
    const { client } = fixture();
    const current = await previewIdentityBurn(client, NAMING, 1n, PRIMARY);
    assert.ok(current);
    assert.equal(
      sameIdentityBurn(current, { ...current, tokenOwner: VERIFIED_SECONDARY }),
      false,
    );
    assert.equal(
      sameIdentityBurn(current, { ...current, primaryTokenId: 999n }),
      false,
    );
    assert.equal(
      sameIdentityBurn(current, { ...current, primaryAddress: SECOND_PRIMARY }),
      false,
    );
    assert.equal(
      sameIdentityBurn(current, { ...current, blockNumber: 101n }),
      true,
    );
    assert.equal(
      await previewIdentityBurn(
        fixture({ allVerified: true }).client,
        NAMING,
        1n,
        PRIMARY,
      ),
      null,
    );
    assert.equal(
      await previewIdentityBurn(
        fixture({ burnedFirst: true }).client,
        NAMING,
        1n,
        PRIMARY,
      ),
      null,
    );
  });

  it("propagates a sync simulation revert instead of offering a burn confirmation", async () => {
    const { client } = fixture();
    client.simulateContract = async () => {
      throw new Error("Sync reverted.");
    };
    await assert.rejects(
      previewIdentityBurn(client, NAMING, 1n),
      /Sync reverted/,
    );
  });
});

describe("identity sync receipts", () => {
  for (const reason of ["repriced", "cancelled", "replaced"] as const) {
    it(`handles a ${reason} replacement without mistaking a cancellation for sync success`, async () => {
      const hashes: Hash[] = [];
      const receipt = {
        status: "success",
        blockNumber: 100n,
        transactionHash: REPLACEMENT,
      };
      const client = {
        async waitForTransactionReceipt(request: {
          hash: Hash;
          onReplaced: (replacement: unknown) => void;
        }) {
          assert.equal(request.hash, HASH);
          request.onReplaced({ reason, transaction: { hash: REPLACEMENT } });
          return receipt;
        },
      } as unknown as PublicClient;
      const result = waitForIdentitySync(client, HASH, (hash) =>
        hashes.push(hash),
      );
      if (reason === "repriced") {
        assert.equal(await result, receipt);
        assert.deepEqual(hashes, [REPLACEMENT]);
      } else {
        await assert.rejects(result, SettledSyncError);
        assert.deepEqual(hashes, []);
      }
    });
  }

  it("treats a reverted receipt as an error", async () => {
    const client = {
      async waitForTransactionReceipt() {
        return { status: "reverted" };
      },
    } as unknown as PublicClient;
    await assert.rejects(
      waitForIdentitySync(client, HASH, () => undefined),
      /Sync transaction reverted/,
    );
  });

  it("keeps receipt transport errors distinct from a settled transaction failure", async () => {
    const client = {
      async waitForTransactionReceipt() {
        throw new Error("Receipt lookup timed out.");
      },
    } as unknown as PublicClient;
    await assert.rejects(
      waitForIdentitySync(client, HASH, () => undefined),
      (error: Error) => {
        assert.equal(error.message, "Receipt lookup timed out.");
        assert.equal(error instanceof SettledSyncError, false);
        return true;
      },
    );
  });

  it("shows a short wallet rejection message", () => {
    assert.equal(
      identitySyncError(new UserRejectedRequestError(new Error("Rejected"))),
      "Transaction declined in your wallet.",
    );
  });
});
