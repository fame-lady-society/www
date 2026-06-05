import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { base, mainnet } from "viem/chains";
import { needsConnectedChainSwitch } from "./connectedChain";

describe("connected wallet chain switching", () => {
  it("requires switching when a connected wallet is on Base for a mainnet target", () => {
    assert.equal(
      needsConnectedChainSwitch({
        isConnected: true,
        connectedChainId: base.id,
        targetChainId: mainnet.id,
      }),
      true,
    );
  });

  it("does not require switching when a connected wallet is already on the target", () => {
    assert.equal(
      needsConnectedChainSwitch({
        isConnected: true,
        connectedChainId: mainnet.id,
        targetChainId: mainnet.id,
      }),
      false,
    );
  });

  it("requires switching when a connected wallet has an unsupported or unavailable chain id", () => {
    assert.equal(
      needsConnectedChainSwitch({
        isConnected: true,
        connectedChainId: undefined,
        targetChainId: mainnet.id,
      }),
      true,
    );

    assert.equal(
      needsConnectedChainSwitch({
        isConnected: true,
        connectedChainId: 999_999,
        targetChainId: mainnet.id,
      }),
      true,
    );
  });

  it("does not request a switch for a disconnected wallet", () => {
    assert.equal(
      needsConnectedChainSwitch({
        isConnected: false,
        connectedChainId: base.id,
        targetChainId: mainnet.id,
      }),
      false,
    );

    assert.equal(
      needsConnectedChainSwitch({
        isConnected: false,
        connectedChainId: undefined,
        targetChainId: mainnet.id,
      }),
      false,
    );
  });
});
