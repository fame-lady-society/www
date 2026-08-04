import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  encodeAbiParameters,
  encodeEventTopics,
  type Address,
  type Hash,
  type Hex,
} from "viem";
import { fameMirrorAbi, universalPoolArtMarketplaceAbi } from "../../../wagmi";
import type {
  GalleryFrozenBuyerTerms,
  GalleryFulfillmentRoute,
} from "../types";
import {
  verifyGalleryPurchase,
  type GalleryPurchaseReceipt,
  type GalleryReceiptLog,
} from "./verifyPurchase";

const marketplace = "0x1111111111111111111111111111111111111111" as Address;
const mirror = "0x2222222222222222222222222222222222222222" as Address;
const buyer = "0x3333333333333333333333333333333333333333" as Address;
const recipient = "0x4444444444444444444444444444444444444444" as Address;
const stranger = "0x5555555555555555555555555555555555555555" as Address;
const transactionHash = `0x${"a".repeat(64)}` as Hash;
const artworkHash = `0x${"b".repeat(64)}` as Hash;
const otherArtworkHash = `0x${"c".repeat(64)}` as Hash;

const terms: GalleryFrozenBuyerTerms = {
  chainId: 84_532,
  account: buyer,
  recipient,
  selectedTarget: {
    targetId: "mint:31",
    tokenId: 31n,
  },
  artworkHash,
  unit: 1_000n,
  maxPremium: 75n,
  maximumSpend: 1_075n,
  allowanceTarget: marketplace,
};

const heldRoute: GalleryFulfillmentRoute = {
  kind: "held",
  shellId: 7n,
};
const mintRoute: GalleryFulfillmentRoute = {
  kind: "pool",
  poolKind: "mint",
  shellId: 8n,
  sourceId: 31n,
};
const burnRoute: GalleryFulfillmentRoute = {
  kind: "pool",
  poolKind: "burn",
  shellId: 9n,
  sourceId: 41n,
};

function exactTopics(
  topics: ReturnType<typeof encodeEventTopics>,
): readonly Hex[] {
  return topics as unknown as readonly Hex[];
}

function mirrorTransferTopic() {
  return exactTopics(
    encodeEventTopics({
      abi: fameMirrorAbi,
      eventName: "Transfer",
    }),
  )[0] as Hex;
}

function rawLog({
  address,
  topics,
  data = "0x",
  logIndex,
}: {
  address: Address;
  topics: readonly Hex[];
  data?: Hex;
  logIndex: number;
}): GalleryReceiptLog {
  return {
    address,
    topics,
    data,
    logIndex,
  };
}

function purchased({
  route,
  emitter = marketplace,
  eventBuyer = buyer,
  eventRecipient = recipient,
  eventArtwork = artworkHash,
  unit = 1_000n,
  premium = 50n,
  inventoryBefore = 10n,
  inventoryAfter = 10n,
  logIndex = 2,
}: {
  route: GalleryFulfillmentRoute;
  emitter?: Address;
  eventBuyer?: Address;
  eventRecipient?: Address;
  eventArtwork?: Hash;
  unit?: bigint;
  premium?: bigint;
  inventoryBefore?: bigint;
  inventoryAfter?: bigint;
  logIndex?: number;
}) {
  const path = route.kind === "held" ? 0 : route.poolKind === "mint" ? 1 : 2;
  const sourceId = route.kind === "held" ? 0n : route.sourceId;

  return rawLog({
    address: emitter,
    topics: exactTopics(
      encodeEventTopics({
        abi: universalPoolArtMarketplaceAbi,
        eventName: "ArtworkPurchased",
        args: {
          buyer: eventBuyer,
          recipient: eventRecipient,
          shellId: route.shellId,
        },
      }),
    ),
    data: encodeAbiParameters(
      [
        { type: "uint8", name: "path" },
        { type: "uint256", name: "sourceId" },
        { type: "bytes32", name: "artwork" },
        { type: "uint256", name: "unitAmount" },
        { type: "uint256", name: "premiumAmount" },
        { type: "uint256", name: "inventoryBefore" },
        { type: "uint256", name: "inventoryAfter" },
      ],
      [
        path,
        sourceId,
        eventArtwork,
        unit,
        premium,
        inventoryBefore,
        inventoryAfter,
      ],
    ),
    logIndex,
  });
}

function transfer({
  route,
  emitter = mirror,
  from = marketplace,
  to = recipient,
  id = route.shellId,
  logIndex = 1,
}: {
  route: GalleryFulfillmentRoute;
  emitter?: Address;
  from?: Address;
  to?: Address;
  id?: bigint;
  logIndex?: number;
}) {
  return rawLog({
    address: emitter,
    topics: exactTopics(
      encodeEventTopics({
        abi: fameMirrorAbi,
        eventName: "Transfer",
        args: { from, to, id },
      }),
    ),
    logIndex,
  });
}

function receipt(
  route: GalleryFulfillmentRoute,
  logs: readonly GalleryReceiptLog[] = [
    transfer({ route }),
    purchased({ route }),
  ],
): GalleryPurchaseReceipt {
  return {
    status: "success",
    blockNumber: 101n,
    transactionHash,
    logs,
  };
}

function dependencies({
  route,
  owner = recipient,
  artwork = artworkHash,
}: {
  route: GalleryFulfillmentRoute;
  owner?: Address;
  artwork?: Hash;
}) {
  return {
    async readOwnerAt(shellId: bigint) {
      assert.equal(shellId, route.shellId);
      return owner;
    },
    async readArtworkHash(shellId: bigint) {
      assert.equal(shellId, route.shellId);
      return artwork;
    },
  };
}

describe("successor gallery purchase verification", () => {
  for (const [name, route, affectedTokenIds] of [
    ["held", heldRoute, [heldRoute.shellId]],
    ["mint", mintRoute, [mintRoute.shellId, mintRoute.sourceId]],
    ["burn", burnRoute, [burnRoute.shellId, burnRoute.sourceId]],
  ] as const) {
    it(`verifies a strict ${name} receipt`, async () => {
      const result = await verifyGalleryPurchase({
        receipt: receipt(route),
        expectedHash: transactionHash,
        terms,
        route,
        addresses: { marketplace, mirror },
        dependencies: dependencies({ route }),
      });

      assert.equal(result.status, "verified");
      if (result.status !== "verified") return;
      assert.deepEqual(result.acquisition, {
        transactionHash,
        receiptBlockNumber: 101n,
        deliveredShellId: route.shellId,
        artworkHash,
        unit: 1_000n,
        premium: 50n,
        total: 1_050n,
        recipient,
        affectedTokenIds,
      });
    });
  }

  it("rejects incomplete, reverted, or hash-mismatched receipts", async () => {
    const cases: GalleryPurchaseReceipt[] = [
      { ...receipt(heldRoute), status: "reverted" },
      { ...receipt(heldRoute), blockNumber: undefined },
      { ...receipt(heldRoute), transactionHash: undefined },
      { ...receipt(heldRoute), logs: undefined },
    ];

    for (const candidate of cases) {
      const result = await verifyGalleryPurchase({
        receipt: candidate,
        expectedHash: transactionHash,
        terms,
        route: heldRoute,
        addresses: { marketplace, mirror },
        dependencies: dependencies({ route: heldRoute }),
      });
      assert.equal(result.status, "confirmed_unverified");
    }

    const wrongHash = await verifyGalleryPurchase({
      receipt: receipt(heldRoute),
      expectedHash: otherArtworkHash,
      terms,
      route: heldRoute,
      addresses: { marketplace, mirror },
      dependencies: dependencies({ route: heldRoute }),
    });
    assert.equal(wrongHash.status, "confirmed_unverified");
  });

  it("rejects wrong emitters, malformed logs, and missing or duplicate events", async () => {
    const malformedPurchase = {
      ...purchased({ route: heldRoute }),
      data: "0x12" as Hex,
    };
    const cases = [
      [
        transfer({ route: heldRoute }),
        purchased({ route: heldRoute, emitter: stranger }),
      ],
      [
        transfer({ route: heldRoute, emitter: stranger }),
        purchased({ route: heldRoute }),
      ],
      [transfer({ route: heldRoute }), malformedPurchase],
      [
        { ...transfer({ route: heldRoute }), topics: [mirrorTransferTopic()] },
        purchased({ route: heldRoute }),
      ],
      [transfer({ route: heldRoute })],
      [purchased({ route: heldRoute })],
      [
        transfer({ route: heldRoute }),
        purchased({ route: heldRoute }),
        purchased({ route: heldRoute, logIndex: 3 }),
      ],
      [
        transfer({ route: heldRoute }),
        transfer({ route: heldRoute, logIndex: 2 }),
        purchased({ route: heldRoute, logIndex: 3 }),
      ],
    ];

    for (const logs of cases) {
      const result = await verifyGalleryPurchase({
        receipt: receipt(heldRoute, logs),
        expectedHash: transactionHash,
        terms,
        route: heldRoute,
        addresses: { marketplace, mirror },
        dependencies: dependencies({ route: heldRoute }),
      });
      assert.equal(result.status, "confirmed_unverified");
    }
  });

  it("rejects mismatched buyer, recipient, route, artwork, and settlement", async () => {
    const cases = [
      purchased({ route: mintRoute, eventBuyer: stranger }),
      purchased({ route: mintRoute, eventRecipient: stranger }),
      purchased({ route: { kind: "held", shellId: 88n } }),
      purchased({ route: mintRoute, eventArtwork: otherArtworkHash }),
      purchased({ route: mintRoute, unit: 999n }),
      purchased({ route: mintRoute, premium: 76n }),
      purchased({
        route: mintRoute,
        inventoryBefore: 11n,
        inventoryAfter: 10n,
      }),
    ];

    for (const event of cases) {
      const result = await verifyGalleryPurchase({
        receipt: receipt(mintRoute, [transfer({ route: mintRoute }), event]),
        expectedHash: transactionHash,
        terms,
        route: mintRoute,
        addresses: { marketplace, mirror },
        dependencies: dependencies({ route: mintRoute }),
      });
      assert.equal(result.status, "confirmed_unverified");
    }
  });

  it("requires the exact submitted pool path and source", async () => {
    const wrongPath = purchased({
      route: { ...burnRoute, poolKind: "mint" },
    });
    const wrongSource = purchased({
      route: { ...burnRoute, sourceId: burnRoute.sourceId + 1n },
    });

    for (const event of [wrongPath, wrongSource]) {
      const result = await verifyGalleryPurchase({
        receipt: receipt(burnRoute, [transfer({ route: burnRoute }), event]),
        expectedHash: transactionHash,
        terms,
        route: burnRoute,
        addresses: { marketplace, mirror },
        dependencies: dependencies({ route: burnRoute }),
      });
      assert.equal(result.status, "confirmed_unverified");
    }
  });

  it("requires the exact marketplace-to-recipient shell transfer", async () => {
    const cases = [
      transfer({ route: heldRoute, from: stranger }),
      transfer({ route: heldRoute, to: stranger }),
      transfer({ route: heldRoute, id: heldRoute.shellId + 1n }),
    ];

    for (const event of cases) {
      const result = await verifyGalleryPurchase({
        receipt: receipt(heldRoute, [event, purchased({ route: heldRoute })]),
        expectedHash: transactionHash,
        terms,
        route: heldRoute,
        addresses: { marketplace, mirror },
        dependencies: dependencies({ route: heldRoute }),
      });
      assert.equal(result.status, "confirmed_unverified");
    }
  });

  it("rejects current owner and artwork mismatches", async () => {
    for (const [deps, observedOwner, observedArtwork] of [
      [
        dependencies({ route: heldRoute, owner: stranger }),
        stranger,
        artworkHash,
      ],
      [
        dependencies({ route: heldRoute, artwork: otherArtworkHash }),
        recipient,
        otherArtworkHash,
      ],
    ] as const) {
      const result = await verifyGalleryPurchase({
        receipt: receipt(heldRoute),
        expectedHash: transactionHash,
        terms,
        route: heldRoute,
        addresses: { marketplace, mirror },
        dependencies: deps,
      });
      assert.equal(result.status, "confirmed_unverified");
      if (result.status !== "confirmed_unverified") continue;
      assert.ok(result.cause instanceof Error);
      assert.equal(
        (result.cause as Error & { expectedOwner: Address }).expectedOwner,
        recipient,
      );
      assert.equal(
        (result.cause as Error & { expectedArtwork: Hash }).expectedArtwork,
        artworkHash,
      );
      assert.equal(
        (result.cause as Error & { observedOwner: Address }).observedOwner,
        observedOwner,
      );
      assert.equal(
        (result.cause as Error & { observedArtwork: Hash }).observedArtwork,
        observedArtwork,
      );
    }
  });

  it("does not turn current-state read failures into a verified result", async () => {
    const currentStateReadFailure = new Error("current state read unavailable");
    const result = await verifyGalleryPurchase({
      receipt: receipt(heldRoute),
      expectedHash: transactionHash,
      terms,
      route: heldRoute,
      addresses: { marketplace, mirror },
      dependencies: {
        async readOwnerAt() {
          throw currentStateReadFailure;
        },
        async readArtworkHash() {
          return artworkHash;
        },
      },
    });

    assert.equal(result.status, "confirmed_unverified");
    assert.equal(
      result.status === "confirmed_unverified" && result.reason,
      "Current purchase state could not be verified.",
    );
    assert.strictEqual(
      result.status === "confirmed_unverified" && result.cause,
      currentStateReadFailure,
    );
  });
});
