import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  APPKIT_METADATA,
  appKitFeatures,
  BASE_BUILDER_DATA_SUFFIX,
  requireWalletConnectProjectId,
} from "./appKitOptions";

describe("Reown AppKit options", () => {
  it("fails fast when the project id is missing", () => {
    assert.throws(
      () => requireWalletConnectProjectId("  "),
      /NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID/,
    );
    assert.equal(requireWalletConnectProjectId(" project-id "), "project-id");
  });

  it("uses canonical metadata and disables unrelated product surfaces", () => {
    assert.equal(APPKIT_METADATA.url, "https://www.fameladysociety.com");
    assert.deepEqual(appKitFeatures, {
      swaps: false,
      onramp: false,
      email: false,
      socials: false,
      analytics: false,
      history: false,
      connectMethodsOrder: ["wallet"],
    });
  });

  it("preserves the Base builder attribution suffix", () => {
    assert.ok(BASE_BUILDER_DATA_SUFFIX.startsWith("0x"));
    assert.ok(BASE_BUILDER_DATA_SUFFIX.length > 2);
  });
});
