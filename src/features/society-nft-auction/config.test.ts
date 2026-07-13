import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getSocietyNftAuctionConfig } from "./config";

const baseAuctionAddress = "0x6536A328419785212BD4DA43F4E5155af60dB7D2";

describe("Society NFT auction config", () => {
  it("accepts a valid configured auction address", () => {
    assert.deepEqual(getSocietyNftAuctionConfig(baseAuctionAddress), {
      status: "configured",
      address: baseAuctionAddress,
    });
  });

  it("rejects missing, blank, malformed, zero, and invalid-checksum addresses", () => {
    const invalidAddresses = [
      "   ",
      "not-an-address",
      "0x0000000000000000000000000000000000000000",
      "0x6536A328419785212BD4DA43F4E5155af60dB7d2",
    ];

    for (const address of invalidAddresses) {
      assert.deepEqual(getSocietyNftAuctionConfig(address), {
        status: "not_configured",
        address: null,
      });
    }
  });

  it("uses the canonical Base auction address without environment configuration", () => {
    assert.deepEqual(getSocietyNftAuctionConfig(), {
      status: "configured",
      address: baseAuctionAddress,
    });
  });
});
