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
const otherArtworkHash = `0x${"dd".repeat(32)}` as Hash;
const routeHash = `0x${"cc".repeat(32)}` as Hash;

const inputTuple = (input: {
  name: string;
  type: string;
  indexed?: boolean;
}) => ({
  name: input.name,
  type: input.type,
  indexed: input.indexed,
});

describe("generated marketplace receipt event ABIs", () => {
  it("exposes the finalized ArtworkPurchased tuple", () => {
    const event = universalPoolArtMarketplaceAbi.find(
      (entry) => entry.type === "event" && entry.name === "ArtworkPurchased",
    );
    assert.ok(event);
    assert.deepEqual(event.inputs.map(inputTuple), [
      { name: "buyer", type: "address", indexed: true },
      { name: "recipient", type: "address", indexed: true },
      { name: "shellId", type: "uint256", indexed: true },
      { name: "path", type: "uint8", indexed: false },
      { name: "sourceId", type: "uint256", indexed: false },
      { name: "artwork", type: "bytes32", indexed: false },
      { name: "unitAmount", type: "uint256", indexed: false },
      { name: "grossPremiumAmount", type: "uint256", indexed: false },
      { name: "inventoryBefore", type: "uint256", indexed: false },
      { name: "inventoryAfter", type: "uint256", indexed: false },
    ]);
  });

  it("exposes source and artwork facts in the finalized CheckoutSettled tuple", () => {
    const event = fameMarketplaceCheckoutAbi.find(
      (entry) => entry.type === "event" && entry.name === "CheckoutSettled",
    );
    assert.ok(event);
    assert.deepEqual(event.inputs.map(inputTuple), [
      { name: "buyer", type: "address", indexed: true },
      { name: "inputAsset", type: "address", indexed: true },
      { name: "shellId", type: "uint256", indexed: true },
      { name: "routeHash", type: "bytes32", indexed: false },
      { name: "fulfillmentPath", type: "uint8", indexed: false },
      { name: "sourceId", type: "uint256", indexed: false },
      { name: "artwork", type: "bytes32", indexed: false },
      { name: "inputAmount", type: "uint256", indexed: false },
      { name: "inputRefund", type: "uint256", indexed: false },
      { name: "routerFameOutput", type: "uint256", indexed: false },
      {
        name: "marketplaceFameCharge",
        type: "uint256",
        indexed: false,
      },
      { name: "fameRefund", type: "uint256", indexed: false },
    ]);
  });

  it("keeps submitted and executed route hashes distinct in SocietyRedeemed", () => {
    const event = fameMarketplaceCheckoutAbi.find(
      (entry) => entry.type === "event" && entry.name === "SocietyRedeemed",
    );
    assert.ok(event);
    assert.deepEqual(event.inputs.map(inputTuple), [
      { name: "caller", type: "address", indexed: true },
      { name: "outputAsset", type: "address", indexed: true },
      { name: "tokenIdsHash", type: "bytes32", indexed: true },
      { name: "tokenCount", type: "uint256", indexed: false },
      { name: "quotedFameInput", type: "uint256", indexed: false },
      { name: "actualFameInput", type: "uint256", indexed: false },
      { name: "submittedRouteHash", type: "bytes32", indexed: false },
      { name: "executedRouteHash", type: "bytes32", indexed: false },
      { name: "netAmountOut", type: "uint256", indexed: false },
    ]);
  });
});

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
  artwork = artworkHash,
  grossPremiumAmount = 30n,
}: {
  shellId: bigint;
  path: 0 | 1 | 2;
  sourceId: bigint;
  artwork?: Hash;
  grossPremiumAmount?: bigint;
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
      [path, sourceId, artwork, 1_000n, grossPremiumAmount, 4n, 5n],
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

function checkoutSettled({
  shellId,
  path = 1,
  sourceId = 31n,
  artwork = artworkHash,
  inputAmount = 12_000_000n,
  inputRefund = 250_000n,
  routerFameOutput = 1_050n,
  marketplaceFameCharge = 1_030n,
  fameRefund = 20n,
}: {
  shellId: bigint;
  path?: 0 | 1 | 2;
  sourceId?: bigint;
  artwork?: Hash;
  inputAmount?: bigint;
  inputRefund?: bigint;
  routerFameOutput?: bigint;
  marketplaceFameCharge?: bigint;
  fameRefund?: bigint;
}) {
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
        { type: "bytes32" },
        { type: "uint256" },
        { type: "uint256" },
        { type: "uint256" },
        { type: "uint256" },
        { type: "uint256" },
      ],
      [
        routeHash,
        path,
        sourceId,
        artwork,
        inputAmount,
        inputRefund,
        routerFameOutput,
        marketplaceFameCharge,
        fameRefund,
      ],
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
    assert.equal(projection.grossPremiumAmount, 30n);
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
        checkoutSettled({ shellId: 8n }),
      ]),
      addresses,
    );

    assert.equal(projection.path, "mint");
    assert.equal(projection.sourceId, 31n);
    assert.equal(projection.grossPremiumAmount, 30n);
    assert.equal(
      projection.checkout?.marketplaceFameCharge,
      projection.total,
    );
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

  it("accepts checkout boons that include ambient input and FAME balances", () => {
    const projection = projectGalleryPurchaseReceipt(
      receipt([
        routeExecuted(),
        transfer(8n),
        purchased({ shellId: 8n, path: 1, sourceId: 31n }),
        checkoutSettled({
          shellId: 8n,
          inputRefund: 17_250_000n,
          fameRefund: 25n,
        }),
      ]),
      addresses,
    );

    assert.equal(projection.checkout?.inputRefund, 17_250_000n);
    assert.equal(projection.checkout?.fameRefund, 25n);
    assert.equal(projection.checkout?.routerFameOutput, 1_050n);
    assert.equal(projection.checkout?.marketplaceFameCharge, 1_030n);
  });

  it("rejects checkout source mismatches for held and pool purchases", () => {
    const cases = [
      receipt([
        routeExecuted(),
        transfer(7n),
        purchased({ shellId: 7n, path: 0, sourceId: 0n }),
        checkoutSettled({ shellId: 7n, path: 0, sourceId: 1n }),
      ]),
      receipt([
        routeExecuted(),
        transfer(8n),
        purchased({ shellId: 8n, path: 1, sourceId: 31n }),
        checkoutSettled({ shellId: 8n, sourceId: 32n }),
      ]),
    ];

    for (const candidate of cases) {
      assert.throws(
        () => projectGalleryPurchaseReceipt(candidate, addresses),
        /does not match the marketplace purchase/,
      );
    }
  });

  it("rejects a checkout artwork mismatch", () => {
    assert.throws(
      () =>
        projectGalleryPurchaseReceipt(
          receipt([
            routeExecuted(),
            transfer(8n),
            purchased({ shellId: 8n, path: 1, sourceId: 31n }),
            checkoutSettled({ shellId: 8n, artwork: otherArtworkHash }),
          ]),
          addresses,
        ),
      /does not match the marketplace purchase/,
    );
  });

  it("rejects missing, duplicate, and malformed checkout settlements", () => {
    const validCheckout = checkoutSettled({ shellId: 8n });
    const purchaseLogs = [
      routeExecuted(),
      transfer(8n),
      purchased({ shellId: 8n, path: 1, sourceId: 31n }),
    ];
    const cases = [
      [purchaseLogs, /without a checkout settlement/],
      [
        [...purchaseLogs, validCheckout, validCheckout],
        /multiple checkout settlements/,
      ],
      [
        [...purchaseLogs, { ...validCheckout, data: "0x12" as Hex }],
        /malformed event/,
      ],
    ] as const;

    for (const [logs, expectedError] of cases) {
      assert.throws(() =>
        projectGalleryPurchaseReceipt(receipt([...logs]), addresses),
        expectedError,
      );
    }
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
