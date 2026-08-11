import assert from "node:assert/strict";
import { describe, it } from "node:test";

process.env.SESSION_SECRET ||= "test-session-secret";

import { claimAuthorizationStatus } from "./claimAuthorization";

const address = "0x000000000000000000000000000000000000dEaD" as const;
const session = { address, chainId: 1, expiresAt: Date.now() + 60_000 };

describe("claim session authorization", () => {
  it("requires a signed-in session", () => {
    assert.equal(claimAuthorizationStatus(null, address), 401);
  });

  it("rejects a different wallet", () => {
    assert.equal(
      claimAuthorizationStatus(
        session,
        "0x0000000000000000000000000000000000000001",
      ),
      403,
    );
  });

  it("accepts checksum-equivalent address casing", () => {
    assert.equal(claimAuthorizationStatus(session, address.toLowerCase()), null);
  });
});
