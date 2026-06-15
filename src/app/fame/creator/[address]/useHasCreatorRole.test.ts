import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  decodeCreatorPortalRoles,
  formatCreatorRoleReadError,
} from "./useHasCreatorRole";

describe("decodeCreatorPortalRoles", () => {
  it("does not grant access while the role read has no data", () => {
    assert.deepEqual(decodeCreatorPortalRoles(), {
      isCreator: false,
      isBanisher: false,
      isArtPoolManager: false,
      hasAnyRole: false,
      raw: 0,
    });
  });

  it("recognizes the deployed CreatorArtistMagic role bits", () => {
    assert.deepEqual(decodeCreatorPortalRoles(2n), {
      isCreator: true,
      isBanisher: false,
      isArtPoolManager: false,
      hasAnyRole: true,
      raw: 2,
    });

    assert.deepEqual(decodeCreatorPortalRoles(4n), {
      isCreator: false,
      isBanisher: true,
      isArtPoolManager: false,
      hasAnyRole: true,
      raw: 4,
    });

    assert.deepEqual(decodeCreatorPortalRoles(8n), {
      isCreator: false,
      isBanisher: false,
      isArtPoolManager: true,
      hasAnyRole: true,
      raw: 8,
    });
  });

  it("preserves combined role masks from wallets with historical grants", () => {
    assert.deepEqual(decodeCreatorPortalRoles(3n), {
      isCreator: true,
      isBanisher: false,
      isArtPoolManager: false,
      hasAnyRole: true,
      raw: 3,
    });
  });

  it("formats role read errors without leaking full RPC URLs", () => {
    assert.equal(
      formatCreatorRoleReadError({
        shortMessage:
          "HTTP request failed. URL: https://example.rpc-provider.test/v2/secret-key",
      }),
      "HTTP request failed. URL: https://example.rpc-provider.test/...",
    );
  });
});
