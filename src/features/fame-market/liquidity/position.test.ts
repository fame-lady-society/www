import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  existingProviderPerSaleShare,
  providerPerSaleShareAfterDeposit,
  prospectiveProviderPerSaleShare,
} from "./position";

describe("gallery liquidity provider share", () => {
  it("quotes the exact current one-unit share using integer division", () => {
    assert.equal(prospectiveProviderPerSaleShare(100n, 3n), 25n);
    assert.equal(prospectiveProviderPerSaleShare(2n, 8n), 0n);
  });

  it("quotes an existing provider by credited units", () => {
    assert.equal(existingProviderPerSaleShare(100n, 3n, 10n), 30n);
    assert.equal(existingProviderPerSaleShare(100n, 0n, 10n), 0n);
    assert.equal(existingProviderPerSaleShare(100n, 3n, 0n), 0n);
  });

  it("shows the selected batch's resulting current per-sale share", () => {
    assert.equal(providerPerSaleShareAfterDeposit(100n, 0n, 3n, 2), 40n);
    assert.equal(providerPerSaleShareAfterDeposit(100n, 2n, 3n, 2), 80n);
    assert.equal(providerPerSaleShareAfterDeposit(100n, 0n, 3n, 0), 0n);
  });
});
