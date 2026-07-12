import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getSocietyNftAuctionConfig } from "./config";

const forkAuctionAddress = "0x6536A328419785212BD4DA43F4E5155af60dB7D2";

describe("Society NFT auction config", () => {
  it("accepts a valid configured auction address", () => {
    assert.deepEqual(getSocietyNftAuctionConfig(forkAuctionAddress), {
      status: "configured",
      address: forkAuctionAddress,
    });
  });

  it("rejects missing, blank, malformed, zero, and invalid-checksum addresses", () => {
    const invalidAddresses = [
      undefined,
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

  it("reads the public environment value without a fork-address fallback", () => {
    const envKey = "NEXT_PUBLIC_SOCIETY_NFT_AUCTION_ADDRESS";
    const original = process.env[envKey];
    delete process.env[envKey];

    try {
      assert.deepEqual(getSocietyNftAuctionConfig(), {
        status: "not_configured",
        address: null,
      });
    } finally {
      if (original === undefined) {
        delete process.env[envKey];
      } else {
        process.env[envKey] = original;
      }
    }
  });
});
