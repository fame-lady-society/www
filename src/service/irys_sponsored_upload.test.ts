import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  computeBufferedIrysPrice,
  ensureIrysBalance,
  type IrysSponsoredUploader,
} from "./irys_sponsored_upload";

function fakeUploader(opts: {
  price: bigint;
  balances: bigint[];
  onFund?: (amount: bigint) => void;
}): IrysSponsoredUploader {
  const balances = [...opts.balances];
  return {
    getPrice: async () => opts.price,
    getBalance: async () => balances.shift() ?? balances.at(-1) ?? 0n,
    fund: async (amount) => opts.onFund?.(amount),
    upload: async () => ({ id: "txid" }),
  };
}

describe("irys sponsored upload helpers", () => {
  it("computes a 10% buffered price", () => {
    assert.equal(computeBufferedIrysPrice(1000n), 1100n);
  });

  it("does not fund when the uploader has enough loaded balance", async () => {
    let funded = 0n;
    const result = await ensureIrysBalance({
      uploader: fakeUploader({
        price: 1000n,
        balances: [1200n],
        onFund: (amount) => {
          funded += amount;
        },
      }),
      bytes: 123,
      maxFundAmount: 2000n,
    });

    assert.equal(funded, 0n);
    assert.equal(result.loadedBalance, 1200n);
  });

  it("funds only the required buffered amount", async () => {
    let funded = 0n;
    const result = await ensureIrysBalance({
      uploader: fakeUploader({
        price: 1000n,
        balances: [500n, 1100n],
        onFund: (amount) => {
          funded += amount;
        },
      }),
      bytes: 123,
      maxFundAmount: 2000n,
    });

    assert.equal(funded, 600n);
    assert.equal(result.funded, 600n);
    assert.equal(result.loadedBalance, 1100n);
  });

  it("does not partially fund when sponsor balance is below the required amount", async () => {
    let funded = 0n;

    await assert.rejects(
      ensureIrysBalance({
        uploader: fakeUploader({
          price: 1000n,
          balances: [500n],
          onFund: (amount) => {
            funded += amount;
          },
        }),
        bytes: 123,
        maxFundAmount: 599n,
      }),
      /Insufficient sponsor balance/,
    );

    assert.equal(funded, 0n);
  });
});
