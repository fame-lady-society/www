import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { NextRequest, NextResponse } from "next/server";

describe("/siwe", () => {
  it("returns the signed auth token when restoring an existing SIWE session", async () => {
    process.env.SESSION_SECRET ||= "test-session-secret";
    process.env.NEXT_PUBLIC_SEPOLIA_RPC_JSON ||= JSON.stringify([
      "http://localhost:8545",
    ]);
    process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_JSON ||= JSON.stringify([
      "http://localhost:8545",
    ]);

    const { GET } = await import("./route");
    const { COOKIE_NAME, setSession } = await import("./session-utils");

    const sessionResponse = new NextResponse();
    const address = "0x000000000000000000000000000000000000dEaD";
    const chainId = 1;
    const expiresAt = Date.now() + 60_000;
    const token = setSession(
      sessionResponse,
      address as `0x${string}`,
      chainId,
      expiresAt,
    );
    const cookie = sessionResponse.cookies.get(COOKIE_NAME);
    assert.ok(cookie?.value);

    const response = await GET(
      new NextRequest("http://localhost/siwe", {
        headers: {
          cookie: `${COOKIE_NAME}=${cookie.value}`,
        },
      }),
    );

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      address,
      chainId,
      expiresAt,
      token,
    });
  });
});
