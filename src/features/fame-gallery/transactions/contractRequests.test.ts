import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Address } from "viem";
import { BASE_SEPOLIA_TEST_GALLERY_CONFIG } from "../config/baseSepoliaTestGallery";
import type { GalleryPurchaseFingerprint } from "./purchaseQueue";
import {
  galleryAdminContractRequest,
  galleryApprovalContractRequest,
  galleryFillContractRequest,
} from "./contractRequests";

const config = BASE_SEPOLIA_TEST_GALLERY_CONFIG;
const account = "0x1111111111111111111111111111111111111111" as Address;
const recipient = "0x2222222222222222222222222222222222222222" as Address;

function requestFacts(request: {
  address: Address;
  account: Address;
  chainId: number;
  functionName: string;
  args: readonly unknown[];
}) {
  return {
    address: request.address,
    account: request.account,
    chainId: request.chainId,
    functionName: request.functionName,
    args: request.args,
  };
}

describe("gallery contract requests", () => {
  it("maps the frozen purchase to exact TEST approval and fill requests", () => {
    const fingerprint: GalleryPurchaseFingerprint = {
      chainId: config.chainId,
      account,
      recipient,
      tokenId: 7n,
      unit: 1_000n,
      premium: 25n,
      total: 1_025n,
      allowanceTarget: config.addresses.gallery,
      fillCalldata: "0x1234",
    };

    assert.deepEqual(
      requestFacts(galleryApprovalContractRequest(fingerprint)),
      {
        address: config.addresses.fame,
        account,
        chainId: config.chainId,
        functionName: "approve",
        args: [config.addresses.gallery, 1_025n],
      },
    );
    assert.deepEqual(requestFacts(galleryFillContractRequest(fingerprint)), {
      address: config.addresses.gallery,
      account,
      chainId: config.chainId,
      functionName: "fill",
      args: [7n, recipient],
    });
  });

  it("maps every admin action to the exact gallery request", () => {
    const cases = [
      {
        call: { kind: "list", tokenId: 1n, premium: 2n } as const,
        functionName: "list",
        args: [1n, 2n],
      },
      {
        call: { kind: "set_premium", tokenId: 3n, premium: 4n } as const,
        functionName: "setPremium",
        args: [3n, 4n],
      },
      {
        call: { kind: "unlist", tokenId: 5n } as const,
        functionName: "unlist",
        args: [5n],
      },
      {
        call: {
          kind: "rotate_mint",
          tokenId: 6n,
          poolTokenId: 7n,
        } as const,
        functionName: "rotateToMintPool",
        args: [6n, 7n],
      },
      {
        call: {
          kind: "rotate_burn",
          tokenId: 8n,
          poolTokenId: 9n,
        } as const,
        functionName: "rotateToBurnPool",
        args: [8n, 9n],
      },
      {
        call: {
          kind: "rotate_end_of_mint",
          tokenId: 10n,
          metadataUri: "data:application/json;base64,e30=",
        } as const,
        functionName: "rotateToEndOfMintPool",
        args: [10n, "data:application/json;base64,e30="],
      },
      {
        call: {
          kind: "withdraw_fees",
          recipient,
          amount: 11n,
        } as const,
        functionName: "withdrawAccruedFees",
        args: [recipient, 11n],
      },
    ];

    for (const testCase of cases) {
      assert.deepEqual(
        requestFacts(galleryAdminContractRequest(testCase.call, account)),
        {
          address: config.addresses.gallery,
          account,
          chainId: config.chainId,
          functionName: testCase.functionName,
          args: testCase.args,
        },
      );
    }
  });
});
