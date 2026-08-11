import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { base, mainnet, sepolia } from "viem/chains";

import { resolveCustomizeNetworkPolicy } from "./networkPolicy";

describe("customize network policy", () => {
  it("keeps the Mainnet route authoritative when the wallet is on Base", () => {
    assert.deepEqual(resolveCustomizeNetworkPolicy("mainnet", base.id), {
      targetChainId: mainnet.id,
      shouldOfferSwitch: true,
    });
  });

  it("keeps the Sepolia route authoritative when the wallet is on Mainnet", () => {
    assert.deepEqual(resolveCustomizeNetworkPolicy("sepolia", mainnet.id), {
      targetChainId: sepolia.id,
      shouldOfferSwitch: true,
    });
  });

  it("does not request a switch before connection or on the matching chain", () => {
    assert.equal(
      resolveCustomizeNetworkPolicy("mainnet", undefined).shouldOfferSwitch,
      false,
    );
    assert.equal(
      resolveCustomizeNetworkPolicy("mainnet", mainnet.id).shouldOfferSwitch,
      false,
    );
  });
});
