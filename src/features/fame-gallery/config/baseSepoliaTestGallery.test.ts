import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  BASE_SEPOLIA_TEST_GALLERY_CONFIG,
  reduceGalleryCandidateTokenIds,
  validateBaseSepoliaTestGalleryManifest,
} from "./baseSepoliaTestGallery";
import { BASE_SEPOLIA_TEST_GALLERY_MANIFEST } from "./baseSepoliaTestGallery.generated";
import checkpointFixture from "../../../../scripts/fixtures/base-sepolia-test-gallery-checkpoint.json";
import {
  buildManifestFromCheckpointFixture,
  formatGeneratedManifest,
} from "../../../../scripts/generate-base-sepolia-test-gallery-manifest";
import { closedLoopGallerySwapAbi } from "../../../wagmi";

const EXPECTED_ADDRESSES = {
  fame: "0x2cF0408Ee86b337216dD0073ab257F84497067cA",
  mirror: "0x2907936013BDF568F98A98893AC1C746256A9cC5",
  renderer: "0x980f1c21b29d4e16ac3Fc49Fe9Aaf64b97C5A9De",
  creatorMagic: "0xa16C005203cD46cC1929cc8e494cF7945887951B",
  gallery: "0x7f9bA27F40686E548f613e679835158070901c47",
  admin: "0xD52E2A6bBcEba9673440e4D7843Db6713E9B6FD9",
  feeRecipient: "0xD52E2A6bBcEba9673440e4D7843Db6713E9B6FD9",
  smokeRecipient: "0x7307E109C747AaD76CBc0A09612b8350410D35ba",
} as const;

describe("Base Sepolia TEST gallery manifest", () => {
  it("exposes the deployed stack and deterministic discovery checkpoint", () => {
    assert.equal(BASE_SEPOLIA_TEST_GALLERY_CONFIG.chainId, 84_532);
    assert.deepEqual(
      BASE_SEPOLIA_TEST_GALLERY_CONFIG.addresses,
      EXPECTED_ADDRESSES,
    );
    assert.deepEqual(BASE_SEPOLIA_TEST_GALLERY_CONFIG.collection, {
      firstTokenId: 1,
      lastTokenId: 888,
    });
    assert.deepEqual(BASE_SEPOLIA_TEST_GALLERY_CONFIG.deployment, {
      blockNumber: 44_267_510n,
      blockHash:
        "0x1c7b8ca7765a7bdec064b0d63b662a26ccd568f4d58804135854ae120a0228ad",
    });
    assert.deepEqual(BASE_SEPOLIA_TEST_GALLERY_CONFIG.checkpoint, {
      blockNumber: 44_267_553n,
      blockHash:
        "0x59e6365e9843a3a4be266430f94a7a28ec39b3e103473d91db2c29d814a372cd",
      candidateTokenIds: [1],
    });
  });

  it("keeps every token seen in listing lifecycle history", () => {
    assert.deepEqual(
      reduceGalleryCandidateTokenIds(
        [
          { eventName: "Listed", tokenId: 2 },
          { eventName: "PremiumUpdated", tokenId: 1 },
          { eventName: "Unlisted", tokenId: 2 },
          { eventName: "Filled", tokenId: 1 },
          { eventName: "Listed", tokenId: 2 },
        ],
        { firstTokenId: 1, lastTokenId: 888 },
      ),
      [1, 2],
    );
  });

  it("reproduces the committed manifest from the offline checkpoint fixture", () => {
    const generated = buildManifestFromCheckpointFixture(checkpointFixture);

    assert.deepEqual(generated, BASE_SEPOLIA_TEST_GALLERY_MANIFEST);
    assert.match(
      formatGeneratedManifest(generated),
      /Source checkpoint: Base Sepolia block 44267553/,
    );
    assert.match(
      formatGeneratedManifest(generated),
      new RegExp(BASE_SEPOLIA_TEST_GALLERY_MANIFEST.checkpoint.blockHash),
    );
  });

  it("rejects identity, anchor, address, and candidate drift", () => {
    const invalidManifests = [
      { ...BASE_SEPOLIA_TEST_GALLERY_MANIFEST, chainId: 1 },
      {
        ...BASE_SEPOLIA_TEST_GALLERY_MANIFEST,
        addresses: {
          ...BASE_SEPOLIA_TEST_GALLERY_MANIFEST.addresses,
          gallery: EXPECTED_ADDRESSES.fame,
        },
      },
      {
        ...BASE_SEPOLIA_TEST_GALLERY_MANIFEST,
        deployment: {
          ...BASE_SEPOLIA_TEST_GALLERY_MANIFEST.deployment,
          blockHash: "0xdeadbeef",
        },
      },
      {
        ...BASE_SEPOLIA_TEST_GALLERY_MANIFEST,
        checkpoint: {
          ...BASE_SEPOLIA_TEST_GALLERY_MANIFEST.checkpoint,
          blockHash: "0xdeadbeef",
        },
      },
      {
        ...BASE_SEPOLIA_TEST_GALLERY_MANIFEST,
        addresses: {
          ...BASE_SEPOLIA_TEST_GALLERY_MANIFEST.addresses,
          renderer: "not-an-address",
        },
      },
      {
        ...BASE_SEPOLIA_TEST_GALLERY_MANIFEST,
        checkpoint: {
          ...BASE_SEPOLIA_TEST_GALLERY_MANIFEST.checkpoint,
          candidateTokenIds: [0],
        },
      },
      {
        ...BASE_SEPOLIA_TEST_GALLERY_MANIFEST,
        checkpoint: {
          ...BASE_SEPOLIA_TEST_GALLERY_MANIFEST.checkpoint,
          candidateTokenIds: [889],
        },
      },
    ];

    for (const manifest of invalidManifests) {
      assert.throws(() => validateBaseSepoliaTestGalleryManifest(manifest));
    }
  });

  it("generates the gallery reads, writes, events, and named errors", () => {
    const abiNames = new Set<string>(
      closedLoopGallerySwapAbi
        .filter((item) => "name" in item)
        .map((item) => item.name),
    );

    for (const name of [
      "fame",
      "mirror",
      "creatorMagic",
      "feeRecipient",
      "accruedProtocolFees",
      "listings",
      "owner",
      "rolesOf",
      "roleOperator",
      "list",
      "unlist",
      "setPremium",
      "fill",
      "rotateToMintPool",
      "rotateToBurnPool",
      "rotateToEndOfMintPool",
      "withdrawAccruedFees",
      "Listed",
      "Unlisted",
      "PremiumUpdated",
      "Filled",
      "MetadataRotated",
      "AccruedFeesWithdrawn",
      "ZeroAddress",
      "ZeroPremium",
      "PremiumTooLarge",
      "NotVaultOwner",
      "ListingInactive",
      "InventoryInvariantBroken",
      "SettlementInProgress",
      "TransferFailed",
    ]) {
      assert.ok(
        abiNames.has(name),
        `missing ${name} from generated gallery ABI`,
      );
    }
  });
});
