import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { NextRequest, NextResponse } from "next/server";

process.env.SESSION_SECRET ||= "test-session-secret";

describe("SIWE cookie sessions", () => {
  it("fails closed when the session secret is missing", async () => {
    const { requireSessionSecret } = await import("./session-utils");

    assert.throws(() => requireSessionSecret(undefined), /SESSION_SECRET/);
    assert.throws(() => requireSessionSecret("  "), /SESSION_SECRET/);
  });

  it("accepts only an unexpired signed same-origin cookie", async () => {
    const { COOKIE_NAME, getSession, setSession } = await import(
      "./session-utils"
    );
    const address = "0x000000000000000000000000000000000000dEaD";
    const response = new NextResponse();
    setSession(response, address, 1, Date.now() + 60_000);
    const cookie = response.cookies.get(COOKIE_NAME)?.value;
    assert.ok(cookie);

    const restored = getSession(
      new NextRequest("http://localhost/protected", {
        headers: { cookie: `${COOKIE_NAME}=${cookie}` },
      }),
    );
    assert.equal(restored?.address, address);

    const tampered = `${cookie.slice(0, -1)}${cookie.endsWith("a") ? "b" : "a"}`;
    assert.equal(
      getSession(
        new NextRequest("http://localhost/protected", {
          headers: { cookie: `${COOKIE_NAME}=${tampered}` },
        }),
      ),
      null,
    );

    const expiredResponse = new NextResponse();
    setSession(expiredResponse, address, 1, Date.now() - 1);
    const expired = expiredResponse.cookies.get(COOKIE_NAME)?.value;
    assert.ok(expired);
    assert.equal(
      getSession(
        new NextRequest("http://localhost/protected", {
          headers: { cookie: `${COOKIE_NAME}=${expired}` },
        }),
      ),
      null,
    );
  });

  it("ignores legacy bearer credentials", async () => {
    const { getSession } = await import("./session-utils");
    const request = new NextRequest("http://localhost/protected", {
      headers: { authorization: "Bearer obsolete-browser-token" },
    });

    assert.equal(getSession(request), null);
  });
});
