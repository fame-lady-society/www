import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Address, Hash } from "viem";
import { fameAbi, universalPoolArtMarketplaceAbi } from "../../../wagmi";
import type {
  GalleryFrozenBuyerTerms,
  GalleryFulfillmentRoute,
} from "../types";
import {
  galleryApprovalContractRequest,
  galleryPurchaseContractRequest,
} from "./contractRequests";

const account = "0x1111111111111111111111111111111111111111" as Address;
const recipient = account;
const fame = "0x2222222222222222222222222222222222222222" as Address;
const runtimeMarketplace =
  "0x3333333333333333333333333333333333333333" as Address;
const artworkHash =
  "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" as Hash;

const terms: GalleryFrozenBuyerTerms = {
  chainId: 31_337,
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
  allowanceTarget: runtimeMarketplace,
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
    const request = galleryApprovalContractRequest(terms, fame);
    assert.strictEqual(request.abi, fameAbi);
    assert.deepEqual(requestFacts(request), {
      address: fame,
      account,
      chainId: 31_337,
      functionName: "approve",
      args: [runtimeMarketplace, 1_025n],
      value: 0n,
    });
  });

  it("uses frozen runtime marketplace identity for approval and purchase", () => {
    const runtimeTerms = {
      ...terms,
      allowanceTarget: runtimeMarketplace,
    };
    const approval = galleryApprovalContractRequest(runtimeTerms, fame);
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
      address: runtimeMarketplace,
      account,
      chainId: 31_337,
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
        address: runtimeMarketplace,
        account,
        chainId: 31_337,
        functionName: "purchasePool",
        args: [19n, 7n, artworkHash, 25n, 0n, recipient],
        value: 0n,
      });
    });
  }
});
