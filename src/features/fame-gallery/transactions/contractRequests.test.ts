import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Address, Hash } from "viem";
import { fameAbi, universalPoolArtMarketplaceAbi } from "../../../wagmi";
import { BASE_SEPOLIA_TEST_GALLERY_CONFIG } from "../config/baseSepoliaTestGallery";
import type {
  GalleryFrozenBuyerTerms,
  GalleryFulfillmentRoute,
} from "../types";
import {
  galleryAdminContractRequest,
  galleryApprovalContractRequest,
  galleryPurchaseContractRequest,
} from "./contractRequests";

const config = BASE_SEPOLIA_TEST_GALLERY_CONFIG;
const account = "0x1111111111111111111111111111111111111111" as Address;
const recipient = account;
const feeRecipient = "0x2222222222222222222222222222222222222222" as Address;
const runtimeMarketplace =
  "0x3333333333333333333333333333333333333333" as Address;
const artworkHash =
  "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" as Hash;

const terms: GalleryFrozenBuyerTerms = {
  chainId: config.chainId,
  account,
  recipient,
  selectedTarget: {
    targetId: "pool:mint:7",
    tokenId: 7n,
  },
  artworkHash,
  unit: 1_000n,
  maxPremium: 25n,
  maximumSpend: 1_025n,
  allowanceTarget: config.addresses.gallery,
};

function requestFacts(request: {
  address: Address;
  account: Address;
  chainId: number;
  functionName: string;
  args: readonly unknown[];
  value?: bigint;
}) {
  return {
    address: request.address,
    account: request.account,
    chainId: request.chainId,
    functionName: request.functionName,
    args: request.args,
    value: request.value ?? 0n,
  };
}

describe("gallery contract requests", () => {
  it("approves exactly the frozen unit plus displayed premium", () => {
    const request = galleryApprovalContractRequest(terms);
    assert.strictEqual(request.abi, fameAbi);
    assert.deepEqual(requestFacts(request), {
      address: config.addresses.fame,
      account,
      chainId: config.chainId,
      functionName: "approve",
      args: [config.addresses.gallery, 1_025n],
      value: 0n,
    });
  });

  it("uses frozen runtime marketplace identity for approval and purchase", () => {
    const runtimeTerms = {
      ...terms,
      allowanceTarget: runtimeMarketplace,
    };
    const approval = galleryApprovalContractRequest(runtimeTerms);
    const purchase = galleryPurchaseContractRequest(runtimeTerms, {
      kind: "held",
      shellId: 19n,
    });

    assert.equal(approval.args[0], runtimeMarketplace);
    assert.equal(purchase.address, runtimeMarketplace);
  });

  it("maps a held route to the exact successor request", () => {
    const route: GalleryFulfillmentRoute = {
      kind: "held",
      shellId: 19n,
    };

    const request = galleryPurchaseContractRequest(terms, route);
    assert.strictEqual(request.abi, universalPoolArtMarketplaceAbi);
    assert.deepEqual(requestFacts(request), {
      address: config.addresses.gallery,
      account,
      chainId: config.chainId,
      functionName: "purchaseHeld",
      args: [19n, artworkHash, 25n, 0n, recipient],
      value: 0n,
    });
  });

  for (const poolKind of ["mint", "burn"] as const) {
    it(`maps a ${poolKind} route to the exact successor request`, () => {
      const route: GalleryFulfillmentRoute = {
        kind: "pool",
        poolKind,
        shellId: 19n,
        sourceId: 7n,
      };

      const request = galleryPurchaseContractRequest(terms, route);
      assert.strictEqual(request.abi, universalPoolArtMarketplaceAbi);
      assert.deepEqual(requestFacts(request), {
        address: config.addresses.gallery,
        account,
        chainId: config.chainId,
        functionName: "purchasePool",
        args: [19n, 7n, artworkHash, 25n, 0n, recipient],
        value: 0n,
      });
    });
  }

  it("maps only the successor owner operations", () => {
    const cases = [
      {
        call: { kind: "set_premium", premium: 30n } as const,
        functionName: "setPremium",
        args: [30n],
      },
      {
        call: { kind: "set_fee_recipient", feeRecipient } as const,
        functionName: "setFeeRecipient",
        args: [feeRecipient],
      },
      {
        call: { kind: "pause" } as const,
        functionName: "pause",
        args: [],
      },
      {
        call: { kind: "unpause" } as const,
        functionName: "unpause",
        args: [],
      },
    ];

    for (const testCase of cases) {
      const request = galleryAdminContractRequest(testCase.call, account);
      assert.strictEqual(request.abi, universalPoolArtMarketplaceAbi);
      assert.deepEqual(requestFacts(request), {
        address: config.addresses.gallery,
        account,
        chainId: config.chainId,
        functionName: testCase.functionName,
        args: testCase.args,
        value: 0n,
      });
    }
  });
});
