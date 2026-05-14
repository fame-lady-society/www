import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  fameSwapWidgetState,
  type FameSwapWidgetStateInput,
} from "./state";

const baseInput: FameSwapWidgetStateInput = {
  connected: true,
  onBase: true,
  amountEntered: true,
  quoteStatus: "ready",
  quoteExpired: false,
  approvalRequired: false,
  submitting: false,
  confirmed: false,
  reverted: false,
  compact: false,
};

describe("FAME swap widget state", () => {
  it("maps disconnected and wrong-chain setup states", () => {
    const disconnected = fameSwapWidgetState({
      ...baseInput,
      connected: false,
    });
    assert.equal(disconnected.kind, "disconnected");
    assert.equal(disconnected.ctaLabel, "Connect wallet");

    const wrongChain = fameSwapWidgetState({
      ...baseInput,
      onBase: false,
    });
    assert.equal(wrongChain.kind, "wrong_chain");
    assert.equal(wrongChain.ctaLabel, "Switch to Base");
  });

  it("blocks expired quotes while preserving recovery copy", () => {
    const state = fameSwapWidgetState({
      ...baseInput,
      quoteExpired: true,
    });

    assert.equal(state.kind, "quote_expired");
    assert.equal(state.ctaDisabled, true);
    assert.match(state.recoveryAction, /fresh route/i);
  });

  it("shows fallback and diagnostics only for unavailable live execution", () => {
    const notLiveReady = fameSwapWidgetState({
      ...baseInput,
      quoteStatus: "not_live_ready",
    });
    assert.equal(notLiveReady.kind, "not_live_ready");
    assert.equal(notLiveReady.fallbackVisible, true);
    assert.equal(notLiveReady.diagnosticsVisible, true);

    const ready = fameSwapWidgetState(baseInput);
    assert.equal(ready.kind, "ready");
    assert.equal(ready.fallbackVisible, false);
  });

  it("keeps compact critical blocked states visible", () => {
    const state = fameSwapWidgetState({
      ...baseInput,
      quoteStatus: "stale_artifact",
      compact: true,
    });

    assert.equal(state.kind, "stale_artifact");
    assert.equal(state.fallbackVisible, true);
    assert.equal(state.diagnosticsVisible, true);
  });

  it("blocks amount-aware solver failure states before approval", () => {
    for (const quoteStatus of [
      "no_safe_route",
      "quote_adapter_failure",
      "simulation_failure",
    ] as const) {
      const state = fameSwapWidgetState({
        ...baseInput,
        quoteStatus,
      });

      assert.equal(state.kind, quoteStatus);
      assert.equal(state.ctaDisabled, true);
      assert.equal(state.diagnosticsVisible, true);
    }
  });

  it("clears executable actions while a fresh quote is loading", () => {
    const state = fameSwapWidgetState({
      ...baseInput,
      quoteLoading: true,
      quoteStatus: null,
    });

    assert.equal(state.kind, "quote_loading");
    assert.equal(state.ctaDisabled, true);
    assert.equal(state.diagnosticsVisible, false);
  });

  it("prioritizes terminal transaction states", () => {
    const confirmed = fameSwapWidgetState({
      ...baseInput,
      confirmed: true,
      reverted: true,
    });
    assert.equal(confirmed.kind, "confirmed");

    const submitting = fameSwapWidgetState({
      ...baseInput,
      submitting: true,
    });
    assert.equal(submitting.kind, "submitting");
    assert.equal(submitting.amountDisabled, true);

    const reverted = fameSwapWidgetState({
      ...baseInput,
      reverted: true,
    });
    assert.equal(reverted.kind, "reverted");
    assert.equal(reverted.ctaDisabled, true);
  });
});
