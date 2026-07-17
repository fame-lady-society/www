import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Address } from "viem";
import { BASE_SEPOLIA_TEST_GALLERY_CONFIG } from "./config/baseSepoliaTestGallery";
import {
  GALLERY_VISIBLE_TOKEN_BATCH_LIMIT,
  chunkGalleryTokenIds,
} from "./queryKeys";
import {
  createGalleryTokenReadBatcher,
  readGalleryAuthority,
  readGalleryCandidateStates,
  readGalleryGlobalState,
  type GalleryMulticallClient,
} from "./reads";

type CapturedMulticall = {
  blockNumber: bigint;
  contracts: readonly {
    functionName: string;
    args?: readonly unknown[];
  }[];
};

function successfulResult(result: unknown) {
  return { status: "success" as const, result };
}

function createClient(options?: {
  failFunction?: string;
  blockNumber?: bigint;
}) {
  const multicalls: CapturedMulticall[] = [];
  let blockReads = 0;
  const blockNumber = options?.blockNumber ?? 44_300_000n;
  const config = BASE_SEPOLIA_TEST_GALLERY_CONFIG;

  const client: GalleryMulticallClient = {
    async getBlockNumber() {
      blockReads += 1;
      return blockNumber + BigInt(blockReads - 1);
    },
    async multicall(input) {
      multicalls.push({
        blockNumber: input.blockNumber,
        contracts: input.contracts,
      });
      return input.contracts.map((contract) => {
        if (contract.functionName === options?.failFunction) {
          return {
            status: "failure" as const,
            error: new Error("read failed"),
          };
        }
        const tokenId = BigInt(
          (contract.args?.[0] as bigint | undefined) ?? 0n,
        );
        switch (contract.functionName) {
          case "fame":
            return successfulResult(config.addresses.fame);
          case "mirror":
            return successfulResult(config.addresses.mirror);
          case "creatorMagic":
            return successfulResult(config.addresses.creatorMagic);
          case "childRenderer":
            return successfulResult(config.addresses.renderer);
          case "feeRecipient":
            return successfulResult(config.addresses.feeRecipient);
          case "accruedProtocolFees":
            return successfulResult(1_000n);
          case "unit":
            return successfulResult(1_000_000n);
          case "balanceOf":
            return successfulResult(2n);
          case "listings":
            return successfulResult([tokenId * 10n, true]);
          case "ownerAt":
            return successfulResult(config.addresses.gallery);
          case "tokenURI":
            return successfulResult(`data:token/${tokenId}`);
          case "owner":
            return successfulResult(config.addresses.admin);
          case "roleOperator":
            return successfulResult(1n);
          case "rolesOf":
            return successfulResult(1n);
          default:
            throw new Error(`Unhandled mock read ${contract.functionName}`);
        }
      });
    },
  };

  return {
    client,
    multicalls,
    get blockReads() {
      return blockReads;
    },
  };
}

describe("gallery canonical reads", () => {
  it("pins every required global read to one captured block", async () => {
    const mock = createClient();
    const result = await readGalleryGlobalState(mock.client);

    assert.equal(result.status, "success");
    if (result.status !== "success") return;
    assert.equal(result.blockNumber, 44_300_000n);
    assert.deepEqual(result.data, {
      gallery: BASE_SEPOLIA_TEST_GALLERY_CONFIG.addresses.gallery,
      fame: BASE_SEPOLIA_TEST_GALLERY_CONFIG.addresses.fame,
      mirror: BASE_SEPOLIA_TEST_GALLERY_CONFIG.addresses.mirror,
      creatorMagic: BASE_SEPOLIA_TEST_GALLERY_CONFIG.addresses.creatorMagic,
      renderer: BASE_SEPOLIA_TEST_GALLERY_CONFIG.addresses.renderer,
      feeRecipient: BASE_SEPOLIA_TEST_GALLERY_CONFIG.addresses.feeRecipient,
      accruedProtocolFees: 1_000n,
      unit: 1_000_000n,
      inventory: 2n,
    });
    assert.equal(mock.multicalls.length, 1);
    assert.equal(mock.multicalls[0]?.blockNumber, result.blockNumber);
    assert.equal(mock.blockReads, 1);
  });

  it("keeps a failed required read distinct from verified state", async () => {
    const mock = createClient({ failFunction: "feeRecipient" });
    const result = await readGalleryGlobalState(mock.client);

    assert.deepEqual(result, {
      status: "failure",
      blockNumber: 44_300_000n,
      message: "Gallery global state is incomplete",
    });
  });

  it("coalesces visible token reads into batches of at most 24", async () => {
    const mock = createClient();
    const batcher = createGalleryTokenReadBatcher(mock.client);
    const tokenIds = Array.from({ length: 49 }, (_, index) =>
      BigInt(index + 1),
    );
    const results = await Promise.all(
      tokenIds.map((tokenId) => batcher.load(tokenId)),
    );

    assert.equal(
      results.every((result) => result.status === "success"),
      true,
    );
    assert.equal(mock.multicalls.length, chunkGalleryTokenIds(tokenIds).length);
    for (const multicall of mock.multicalls) {
      assert.ok(
        multicall.contracts.length <= GALLERY_VISIBLE_TOKEN_BATCH_LIMIT * 3,
      );
      assert.ok(
        multicall.contracts.every(
          (contract) => multicall.blockNumber >= 44_300_000n,
        ),
      );
    }
  });

  it("verifies discovery candidates without loading token metadata", async () => {
    const mock = createClient();
    const results = await readGalleryCandidateStates(mock.client, [1n, 2n]);

    assert.equal(results.get(1n)?.status, "success");
    assert.deepEqual(
      mock.multicalls[0]?.contracts.map((contract) => contract.functionName),
      ["listings", "ownerAt", "listings", "ownerAt"],
    );
  });

  it("classifies owner, operator, and denied authority from contract reads", async () => {
    const ownerClient = createClient().client;
    const owner = await readGalleryAuthority(
      ownerClient,
      BASE_SEPOLIA_TEST_GALLERY_CONFIG.addresses.admin,
    );
    assert.equal(owner.status, "success");
    if (owner.status === "success") {
      assert.equal(owner.data.authority, "owner");
    }

    const operatorAddress =
      "0x0000000000000000000000000000000000000001" as Address;
    const operator = await readGalleryAuthority(ownerClient, operatorAddress);
    assert.equal(operator.status, "success");
    if (operator.status === "success") {
      assert.equal(operator.data.authority, "operator");
    }
  });
});
