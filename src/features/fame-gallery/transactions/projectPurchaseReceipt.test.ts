import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  encodeAbiParameters,
  encodeEventTopics,
  zeroAddress,
  type Address,
  type Hash,
  type Hex,
} from "viem";
import {
  fameMarketplaceCheckoutAbi,
  fameMirrorAbi,
  fameRouterAbi,
  universalPoolArtMarketplaceAbi,
} from "../../../wagmi";
import { projectGalleryPurchaseReceipt } from "./projectPurchaseReceipt";

const marketplace = "0x1111111111111111111111111111111111111111" as Address;
const mirror = "0x2222222222222222222222222222222222222222" as Address;
const fame = "0x3333333333333333333333333333333333333333" as Address;
const checkout = "0x4444444444444444444444444444444444444444" as Address;
const router = "0x5555555555555555555555555555555555555555" as Address;
const buyer = "0x6666666666666666666666666666666666666666" as Address;
const usdc = "0x7777777777777777777777777777777777777777" as Address;
const transactionHash = `0x${"aa".repeat(32)}` as Hash;
const artworkHash = `0x${"bb".repeat(32)}` as Hash;
const routeHash = `0x${"cc".repeat(32)}` as Hash;

function topics(value: ReturnType<typeof encodeEventTopics>) {
  return value as unknown as readonly Hex[];
}

function log(address: Address, topics: readonly Hex[], data: Hex = "0x") {
  return { address, topics, data };
}

function transfer(shellId: bigint) {
  return log(
    mirror,
    topics(
      encodeEventTopics({
        abi: fameMirrorAbi,
        eventName: "Transfer",
        args: { from: marketplace, to: buyer, id: shellId },
      }),
    ),
  );
}

function purchased({
  shellId,
  path,
  sourceId,
}: {
  shellId: bigint;
  path: 0 | 1 | 2;
  sourceId: bigint;
}) {
  return log(
    marketplace,
    topics(
      encodeEventTopics({
        abi: universalPoolArtMarketplaceAbi,
        eventName: "ArtworkPurchased",
        args: { buyer, recipient: buyer, shellId },
      }),
    ),
    encodeAbiParameters(
      [
        { type: "uint8" },
        { type: "uint256" },
        { type: "bytes32" },
        { type: "uint256" },
        { type: "uint256" },
        { type: "uint256" },
        { type: "uint256" },
      ],
      [path, sourceId, artworkHash, 1_000n, 30n, 4n, 5n],
    ),
  );
}

function metadataUpdate(tokenId: bigint) {
  return log(
    mirror,
    topics(
      encodeEventTopics({
        abi: fameMirrorAbi,
        eventName: "MetadataUpdate",
      }),
    ),
    encodeAbiParameters([{ type: "uint256" }], [tokenId]),
  );
}

function checkoutSettled(shellId: bigint) {
  return log(
    checkout,
    topics(
      encodeEventTopics({
        abi: fameMarketplaceCheckoutAbi,
        eventName: "CheckoutSettled",
        args: { buyer, inputAsset: usdc, shellId },
      }),
    ),
    encodeAbiParameters(
      [
        { type: "bytes32" },
        { type: "uint8" },
        { type: "uint256" },
        { type: "uint256" },
        { type: "uint256" },
        { type: "uint256" },
        { type: "uint256" },
      ],
      [routeHash, 1, 12_000_000n, 250_000n, 1_050n, 1_030n, 20n],
    ),
  );
}

function routeExecuted() {
  return log(
    router,
    topics(
      encodeEventTopics({
        abi: fameRouterAbi,
        eventName: "RouteExecuted",
        args: { payer: checkout, recipient: checkout, tokenOut: fame },
      }),
    ),
    encodeAbiParameters(
      [
        { type: "bytes32" },
        { type: "uint16" },
        { type: "address" },
        { type: "uint256" },
        { type: "uint256" },
        { type: "uint256" },
        { type: "uint256" },
      ],
      [routeHash, 1, usdc, 12_000_000n, 1_060n, 10n, 1_050n],
    ),
  );
}

function receipt(logs: ReturnType<typeof log>[]) {
  return {
    status: "success" as const,
    transactionHash,
    blockNumber: 123n,
    logs,
  };
}

const addresses = { marketplace, mirror, fame, checkout, router };

describe("gallery purchase receipt projection", () => {
  it("reconstructs a direct held purchase from its receipt", () => {
    const projection = projectGalleryPurchaseReceipt(
      receipt([
        transfer(7n),
        purchased({ shellId: 7n, path: 0, sourceId: 0n }),
      ]),
      addresses,
    );

    assert.equal(projection.path, "held");
    assert.equal(projection.shellId, 7n);
    assert.equal(projection.sourceId, null);
    assert.equal(projection.total, 1_030n);
    assert.equal(projection.checkout, null);
    assert.equal(projection.route, null);
    assert.deepEqual(projection.metadataUpdatedTokenIds, []);
  });

  it("reconstructs checkout economics and a mint-pool metadata swap", () => {
    const projection = projectGalleryPurchaseReceipt(
      receipt([
        routeExecuted(),
        metadataUpdate(8n),
        metadataUpdate(31n),
        transfer(8n),
        purchased({ shellId: 8n, path: 1, sourceId: 31n }),
        checkoutSettled(8n),
      ]),
      addresses,
    );

    assert.equal(projection.path, "mint");
    assert.equal(projection.sourceId, 31n);
    assert.deepEqual(projection.metadataUpdatedTokenIds, [8n, 31n]);
    assert.deepEqual(projection.checkout, {
      inputAsset: usdc,
      routeHash,
      inputAmount: 12_000_000n,
      inputRefund: 250_000n,
      routerFameOutput: 1_050n,
      marketplaceFameCharge: 1_030n,
      fameRefund: 20n,
    });
    assert.deepEqual(projection.route, {
      schemaVersion: 1,
      tokenIn: usdc,
      tokenOut: fame,
      amountIn: 12_000_000n,
      grossAmountOut: 1_060n,
      feeAmount: 10n,
      netAmountOut: 1_050n,
    });
  });

  it("rejects reverted, duplicated, and non-marketplace receipts", () => {
    const held = [
      transfer(7n),
      purchased({ shellId: 7n, path: 0, sourceId: 0n }),
    ];
    assert.throws(() =>
      projectGalleryPurchaseReceipt(
        { ...receipt(held), status: "reverted" },
        addresses,
      ),
    );
    assert.throws(() =>
      projectGalleryPurchaseReceipt(
        receipt([held[0], held[1], held[1]]),
        addresses,
      ),
    );
    assert.throws(() =>
      projectGalleryPurchaseReceipt(
        receipt([log(zeroAddress, ["0x01" as Hex])]),
        addresses,
      ),
    );
  });
});
