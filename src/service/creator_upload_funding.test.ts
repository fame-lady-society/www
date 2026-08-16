import assert from "node:assert/strict";
import { describe, it } from "node:test";

process.env.NEXT_PUBLIC_BASE_RPC_URL_1 ||= "http://127.0.0.1:1";

const { getCreatorUploadFundingSnapshot } = await import(
  "./creator_upload_funding"
);
const { estimateCreatorImagesRemaining } = await import(
  "../features/fame/creatorUploadFunding"
);

describe("creator upload funding estimates", () => {
  it("reserves the Base gas buffer before counting approximate uploads", () => {
    assert.equal(estimateCreatorImagesRemaining(21_000n * 20n + 30n, 10n), 3);
  });

  it("returns zero when the funding balance is below the gas reserve", () => {
    assert.equal(estimateCreatorImagesRemaining(21_000n * 20n, 10n), 0);
    assert.equal(estimateCreatorImagesRemaining(1_000n, 0n), 0);
  });

  it("includes already loaded Irys balance in the estimate", () => {
    assert.equal(estimateCreatorImagesRemaining(21_000n * 20n, 10n, 25n), 2);
  });

  it("does not serialize the signer secret", async () => {
    const previousPrivateKey = process.env.METADATA_PRIVATE_KEY;
    delete process.env.METADATA_PRIVATE_KEY;
    try {
      const snapshot = await getCreatorUploadFundingSnapshot();
      assert.equal(snapshot.sponsorAddress, null);
      assert.equal("privateKey" in snapshot, false);
    } finally {
      if (previousPrivateKey === undefined) {
        delete process.env.METADATA_PRIVATE_KEY;
      } else {
        process.env.METADATA_PRIVATE_KEY = previousPrivateKey;
      }
    }
  });
});
