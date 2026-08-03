import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Address, Hash } from "viem";
import { BASE_SEPOLIA_TEST_GALLERY_CONFIG } from "./config/baseSepoliaTestGallery";
import {
  GALLERY_POOL_SCAN_BATCH_SIZE,
  GALLERY_POOL_SCAN_CONCURRENCY,
  readGalleryAccountState,
  readGalleryAuthority,
  readGalleryGlobalState,
  readGalleryPoolState,
  readGalleryTokenStates,
  type GalleryMulticallClient,
} from "./reads";

type CapturedMulticall = {
  blockNumber: bigint;
  contracts: readonly {
    functionName: string;
    args?: readonly unknown[];
  }[];
};

const owner = "0x0000000000000000000000000000000000000001" as Address;
const feeRecipient = "0x0000000000000000000000000000000000000002" as Address;
const other = "0x0000000000000000000000000000000000000003" as Address;
const artwork = `0x${"ab".repeat(32)}` as Hash;

function success(result: unknown) {
  return { status: "success" as const, result };
}

function createClient(
  resultFor: (
    functionName: string,
    tokenId: bigint | null,
  ) => ReturnType<typeof success> | { status: "failure"; error: Error },
) {
  const multicalls: CapturedMulticall[] = [];
  const client: GalleryMulticallClient = {
    async getBlockNumber() {
      return 44_400_000n;
    },
    async multicall(input) {
      multicalls.push(input);
      return input.contracts.map((contract) =>
        resultFor(
          contract.functionName,
          typeof contract.args?.[0] === "bigint" ? contract.args[0] : null,
        ),
      );
    },
  };
  return { client, multicalls };
}

function standardResult(functionName: string, tokenId: bigint | null) {
  const config = BASE_SEPOLIA_TEST_GALLERY_CONFIG;
  switch (functionName) {
    case "fame":
      return success(config.addresses.fame);
    case "mirror":
      return success(config.addresses.mirror);
    case "creatorMagic":
      return success(config.addresses.creatorMagic);
    case "owner":
      return success(owner);
    case "paused":
      return success(false);
    case "premium":
      return success(25n);
    case "communityFee":
      return success(10n);
    case "providerFee":
      return success(15n);
    case "totalProviderUnits":
      return success(6n);
    case "activeProviderCount":
      return success(4n);
    case "activeProviderCap":
      return success(88n);
    case "feeRecipient":
      return success(feeRecipient);
    case "inventory":
      return success(2n);
    case "unit":
      return success(1_000_000n);
    case "isTokenInMintPool":
      return success(tokenId === 2n);
    case "isTokenInBurnedPool":
      return success(tokenId === 3n);
    case "artworkHash":
      return success(artwork);
    case "tokenURI":
      return success(`data:token/${tokenId}`);
    case "ownerAt":
      return success(tokenId === 2n ? config.addresses.gallery : feeRecipient);
    case "balanceOf":
      return success(8_000_000n);
    case "allowance":
      return success(2_000_000n);
    default:
      throw new Error(`Unhandled mock read ${functionName}`);
  }
}

describe("successor gallery canonical reads", () => {
  it("pins all global successor fields to the supplied block", async () => {
    const mock = createClient(standardResult);
    const result = await readGalleryGlobalState(mock.client, 44_399_999n);

    assert.deepEqual(result, {
      status: "success",
      blockNumber: 44_399_999n,
      data: {
        marketplace: BASE_SEPOLIA_TEST_GALLERY_CONFIG.addresses.gallery,
        fame: BASE_SEPOLIA_TEST_GALLERY_CONFIG.addresses.fame,
        mirror: BASE_SEPOLIA_TEST_GALLERY_CONFIG.addresses.mirror,
        creatorMagic: BASE_SEPOLIA_TEST_GALLERY_CONFIG.addresses.creatorMagic,
        owner,
        paused: false,
        premium: 25n,
        communityFee: 10n,
        providerFee: 15n,
        totalProviderUnits: 6n,
        activeProviderCount: 4n,
        activeProviderCap: 88n,
        feeRecipient,
        inventory: 2n,
        unit: 1_000_000n,
      },
    });
    assert.equal(mock.multicalls.length, 1);
    assert.equal(mock.multicalls[0]?.blockNumber, 44_399_999n);
    assert.deepEqual(
      mock.multicalls[0]?.contracts.map(({ functionName }) => functionName),
      [
        "fame",
        "mirror",
        "creatorMagic",
        "owner",
        "paused",
        "premium",
        "communityFee",
        "providerFee",
        "totalProviderUnits",
        "activeProviderCount",
        "activeProviderCap",
        "feeRecipient",
        "inventory",
        "unit",
      ],
    );
  });

  it("loads combined Mint and Burn membership before hydrating eligible artwork", async () => {
    const mock = createClient(standardResult);
    const result = await readGalleryPoolState(mock.client, 500n, [1n, 2n, 3n]);

    assert.equal(result.status, "success");
    if (result.status !== "success") return;
    assert.deepEqual(
      result.data.targets.map(({ targetId, kind, tokenId }) => ({
        targetId,
        kind,
        tokenId,
      })),
      [
        { targetId: "pool:mint:2", kind: "mint", tokenId: 2n },
        { targetId: "pool:burn:3", kind: "burn", tokenId: 3n },
      ],
    );
    assert.equal(result.data.targets[0]?.artworkHash, artwork);
    assert.equal(result.data.targets[0]?.tokenUri, "data:token/2");
    assert.ok(mock.multicalls.every((call) => call.blockNumber === 500n));
    assert.deepEqual(
      mock.multicalls
        .flatMap((call) => call.contracts)
        .filter(({ functionName }) =>
          ["artworkHash", "tokenURI"].includes(functionName),
        )
        .map(({ args }) => args?.[0]),
      [2n, 2n, 3n, 3n],
    );
  });

  it("returns an empty combined pool without artwork hydration", async () => {
    const mock = createClient((functionName, tokenId) => {
      if (
        functionName === "isTokenInMintPool" ||
        functionName === "isTokenInBurnedPool"
      ) {
        return success(false);
      }
      return standardResult(functionName, tokenId);
    });
    const result = await readGalleryPoolState(mock.client, 501n, [1n, 2n]);

    assert.equal(result.status, "success");
    if (result.status !== "success") return;
    assert.deepEqual(result.data.targets, []);
    assert.equal(
      mock.multicalls
        .flatMap((call) => call.contracts)
        .some(({ functionName }) => functionName === "artworkHash"),
      false,
    );
  });

  it("keeps eligible targets when one artwork presentation read fails", async () => {
    const mock = createClient((functionName, tokenId) => {
      if (functionName === "tokenURI" && tokenId === 3n) {
        return { status: "failure", error: new Error("bad metadata") };
      }
      return standardResult(functionName, tokenId);
    });
    const result = await readGalleryPoolState(mock.client, 502n, [2n, 3n]);

    assert.equal(result.status, "success");
    if (result.status !== "success") return;
    assert.equal(result.data.targets.length, 2);
    assert.deepEqual(result.data.targets[1], {
      targetId: "pool:burn:3",
      kind: "burn",
      tokenId: 3n,
      artworkHash: artwork,
      tokenUri: null,
      artworkError: "Artwork metadata is unavailable",
    });
  });

  it("isolates ownerAt failure per custody ID", async () => {
    const mock = createClient((functionName, tokenId) => {
      if (functionName === "ownerAt" && tokenId === 2n) {
        return { status: "failure", error: new Error("missing") };
      }
      return standardResult(functionName, tokenId);
    });
    const states = await readGalleryTokenStates(mock.client, 503n, [
      1n,
      2n,
      3n,
    ]);

    assert.equal(states.get(1n)?.status, "success");
    assert.deepEqual(states.get(2n), {
      status: "failure",
      blockNumber: 503n,
      message: "Gallery token 2 ownership is unavailable",
    });
    assert.equal(states.get(3n)?.status, "success");
  });

  it("distinguishes owner, non-owner, and owner-read failure", async () => {
    const mock = createClient(standardResult);
    const owned = await readGalleryAuthority(mock.client, 600n, owner);
    const denied = await readGalleryAuthority(mock.client, 600n, other);
    assert.equal(owned.status, "success");
    assert.equal(owned.status === "success" && owned.data.authority, "owner");
    assert.equal(denied.status, "success");
    assert.equal(
      denied.status === "success" && denied.data.authority,
      "denied",
    );

    const failed = createClient((functionName, tokenId) =>
      functionName === "owner"
        ? { status: "failure", error: new Error("rpc") }
        : standardResult(functionName, tokenId),
    );
    assert.deepEqual(await readGalleryAuthority(failed.client, 601n, owner), {
      status: "failure",
      blockNumber: 601n,
      message: "Gallery owner is unavailable",
    });
  });

  it("pins buyer balance and marketplace allowance to one account block", async () => {
    const mock = createClient(standardResult);
    const result = await readGalleryAccountState(mock.client, 650n, other);

    assert.deepEqual(result, {
      status: "success",
      blockNumber: 650n,
      data: {
        account: other,
        balance: 8_000_000n,
        allowance: 2_000_000n,
      },
    });
    assert.equal(mock.multicalls.length, 1);
    assert.equal(mock.multicalls[0]?.blockNumber, 650n);
    assert.deepEqual(
      mock.multicalls[0]?.contracts.map(({ functionName }) => functionName),
      ["balanceOf", "allowance"],
    );
  });

  it("uses the complete fixed 1-888 domain by default", async () => {
    const mock = createClient((functionName, tokenId) => {
      if (
        functionName === "isTokenInMintPool" ||
        functionName === "isTokenInBurnedPool"
      ) {
        return success(false);
      }
      return standardResult(functionName, tokenId);
    });
    const result = await readGalleryPoolState(mock.client, 675n);

    assert.equal(result.status, "success");
    const membership = mock.multicalls.flatMap((call) => call.contracts);
    assert.equal(membership[0]?.args?.[0], 1n);
    assert.equal(membership.at(-1)?.args?.[0], 888n);
    assert.equal(membership.length, 888 * 2);
    assert.ok(mock.multicalls.every((call) => call.blockNumber === 675n));
  });

  it("keeps 64-ID pool batches at concurrency two", async () => {
    let active = 0;
    let maximum = 0;
    const client: GalleryMulticallClient = {
      async getBlockNumber() {
        return 1n;
      },
      async multicall(input) {
        active += 1;
        maximum = Math.max(maximum, active);
        await Promise.resolve();
        active -= 1;
        return input.contracts.map(() => success(false));
      },
    };
    const ids = Array.from({ length: 130 }, (_, index) => BigInt(index + 1));
    const result = await readGalleryPoolState(client, 700n, ids);

    assert.equal(result.status, "success");
    assert.ok(maximum <= GALLERY_POOL_SCAN_CONCURRENCY);
    assert.ok(maximum > 1);
    assert.equal(GALLERY_POOL_SCAN_BATCH_SIZE, 64);
  });
});
