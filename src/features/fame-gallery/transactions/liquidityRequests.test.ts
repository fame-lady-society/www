import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  galleryLiquidityContractRequest,
  galleryLiquidityDepositApprovalRequest,
  galleryLiquidityDepositRequest,
  galleryLiquidityFameApprovalRequest,
  galleryLiquidityRandomWithdrawalRequest,
  galleryLiquiditySelectedWithdrawalRequest,
} from "./liquidityRequests";

const account = "0x1111111111111111111111111111111111111111" as const;
const mirror = "0x2222222222222222222222222222222222222222" as const;
const fame = "0x3333333333333333333333333333333333333333" as const;
const marketplace = "0x4444444444444444444444444444444444444444" as const;

describe("gallery liquidity transaction requests", () => {
  it("constructs normal operator approval and one atomic batch deposit", () => {
    const approval = galleryLiquidityDepositApprovalRequest(
      account,
      8_453,
      mirror,
      marketplace,
    );
    assert.equal(approval.address, mirror);
    assert.equal(approval.account, account);
    assert.equal(approval.chainId, 8_453);
    assert.equal(approval.functionName, "setApprovalForAll");
    assert.deepEqual(approval.args, [marketplace, true]);

    const request = galleryLiquidityDepositRequest(
      account,
      8_453,
      marketplace,
      [9n, 3n, 7n],
    );
    assert.equal(request.functionName, "depositInventoryBatch");
    assert.deepEqual(request.args, [[3n, 7n, 9n]]);
    assert.equal("value" in request, false);
  });

  it("rejects empty, oversized, duplicate, and out-of-range deposits", () => {
    assert.throws(
      () => galleryLiquidityDepositRequest(account, 8_453, marketplace, []),
      /between 1 and 8/i,
    );
    assert.throws(
      () =>
        galleryLiquidityDepositRequest(
          account,
          8_453,
          marketplace,
          Array.from({ length: 9 }, (_, index) => BigInt(index + 1)),
        ),
      /between 1 and 8/i,
    );
    assert.throws(
      () =>
        galleryLiquidityDepositRequest(account, 8_453, marketplace, [2n, 2n]),
      /unique/i,
    );
    assert.throws(
      () => galleryLiquidityDepositRequest(account, 8_453, marketplace, [0n]),
      /between 1 and 888/i,
    );
  });

  it("constructs free and premium-paid provider exits without a router", () => {
    const random = galleryLiquidityRandomWithdrawalRequest(
      account,
      8_453,
      marketplace,
    );
    assert.equal(random.functionName, "withdrawInventory");
    assert.deepEqual(random.args, []);

    const approval = galleryLiquidityFameApprovalRequest(
      account,
      8_453,
      fame,
      marketplace,
      25n,
    );
    assert.equal(approval.functionName, "approve");
    assert.deepEqual(approval.args, [marketplace, 25n]);

    const selected = galleryLiquiditySelectedWithdrawalRequest(
      account,
      8_453,
      marketplace,
      42n,
      25n,
    );
    assert.equal(selected.functionName, "withdrawInventorySelected");
    assert.deepEqual(selected.args, [42n, 25n]);
    assert.equal("value" in selected, false);
  });

  it("dispatches every liquidity call to its ABI-backed contract request", () => {
    const addresses = { mirror, fame, marketplace };
    const requests = [
      galleryLiquidityContractRequest(
        { kind: "deposit_approval" },
        account,
        8_453,
        addresses,
      ),
      galleryLiquidityContractRequest(
        { kind: "deposit", tokenIds: [2n] },
        account,
        8_453,
        addresses,
      ),
      galleryLiquidityContractRequest(
        { kind: "selected_withdrawal_approval", amount: 25n },
        account,
        8_453,
        addresses,
      ),
      galleryLiquidityContractRequest(
        { kind: "random_withdrawal" },
        account,
        8_453,
        addresses,
      ),
      galleryLiquidityContractRequest(
        { kind: "selected_withdrawal", tokenId: 2n, maxPremium: 25n },
        account,
        8_453,
        addresses,
      ),
    ];

    assert.deepEqual(
      requests.map(({ functionName }) => functionName),
      [
        "setApprovalForAll",
        "depositInventoryBatch",
        "approve",
        "withdrawInventory",
        "withdrawInventorySelected",
      ],
    );
  });
});
