import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { NextRequest, NextResponse } from "next/server";
import { privateKeyToAccount } from "viem/accounts";

process.env.SESSION_SECRET ||= "test-session-secret";
process.env.NEXT_PUBLIC_SEPOLIA_RPC_JSON ||= JSON.stringify([
  "http://localhost:8545",
]);
process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_JSON ||= JSON.stringify([
  "http://localhost:8545",
]);
process.env.NEXT_PUBLIC_MAINNET_RPC_URL_1 ||= "http://127.0.0.1:1";

async function createVerificationRequest({
  chainId = 1,
  domain = "localhost",
  uri = "http://localhost",
  origin = "http://localhost",
  address = "0x000000000000000000000000000000000000dEaD",
  expirationTime,
  issuedAt,
  signature = "0x01",
}: {
  chainId?: number;
  domain?: string;
  uri?: string;
  origin?: string;
  address?: string;
  expirationTime?: string;
  issuedAt?: string;
  signature?: string;
} = {}) {
  const { createNonceCookieBinding, signNonce, NONCE_COOKIE_NAME } =
    await import("./nonce-utils");
  const { SiweMessage } = await import("siwe");
  const nonce = signNonce("nonce", Date.now());
  const message = new SiweMessage({
    domain,
    address,
    statement: "Sign In With Ethereum to prove you control this wallet.",
    uri,
    version: "1",
    chainId,
    nonce,
    expirationTime,
    issuedAt,
  }).prepareMessage();
  return {
    message,
    request: new NextRequest("http://localhost/siwe", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: `${NONCE_COOKIE_NAME}=${createNonceCookieBinding(nonce)}`,
        host: "localhost",
        origin,
      },
      body: JSON.stringify({ message, signature }),
    }),
  };
}

describe("/siwe", () => {
  it("restores an existing cookie session without exposing its credential", async () => {
    const { GET } = await import("./route");
    const { COOKIE_NAME, setSession } = await import("./session-utils");

    const sessionResponse = new NextResponse();
    const address = "0x000000000000000000000000000000000000dEaD";
    const chainId = 1;
    const expiresAt = Date.now() + 60_000;
    setSession(sessionResponse, address as `0x${string}`, chainId, expiresAt);
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
    });
  });

  it("issues a nonce bound to an HTTP-only cookie", async () => {
    const { PUT } = await import("./route");
    const { NONCE_COOKIE_NAME } = await import("./nonce-utils");

    const response = await PUT();
    const body = (await response.json()) as { nonce: string };
    const cookie = response.cookies.get(NONCE_COOKIE_NAME);

    assert.equal(response.status, 200);
    assert.notEqual(cookie?.value, body.nonce);
    assert.equal(cookie?.httpOnly, true);
    assert.equal(cookie?.path, "/siwe");
  });

  it("rejects a valid signed nonce without its matching browser cookie", async () => {
    const { POST } = await import("./route");
    const { signNonce, NONCE_COOKIE_NAME } = await import("./nonce-utils");
    const { SiweMessage } = await import("siwe");
    const nonce = signNonce("nonce", Date.now());
    const message = new SiweMessage({
      domain: "localhost",
      address: "0x000000000000000000000000000000000000dEaD",
      statement: "Sign In With Ethereum to prove you control this wallet.",
      uri: "http://localhost",
      version: "1",
      chainId: 1,
      nonce,
    }).prepareMessage();

    const response = await POST(
      new NextRequest("http://localhost/siwe", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          host: "localhost",
          origin: "http://localhost",
        },
        body: JSON.stringify({ message, signature: "0x01" }),
      }),
    );

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: "Invalid nonce" });
    assert.equal(response.cookies.get(NONCE_COOKIE_NAME), undefined);
  });

  it("rejects domain, URI, origin, unsupported-chain, expiry, and future-time mismatches", async () => {
    const { POST } = await import("./route");
    const { NONCE_COOKIE_NAME } = await import("./nonce-utils");
    const cases = [
      await createVerificationRequest({ domain: "example.com" }),
      await createVerificationRequest({ uri: "https://example.com" }),
      await createVerificationRequest({ origin: "https://example.com" }),
      await createVerificationRequest({ chainId: 137 }),
      await createVerificationRequest({
        expirationTime: new Date(Date.now() - 1_000).toISOString(),
      }),
      await createVerificationRequest({
        issuedAt: new Date(Date.now() + 60_000).toISOString(),
      }),
    ];

    for (const { request } of cases) {
      const response = await POST(request);
      assert.equal(response.status, 400);
      assert.equal(response.cookies.get(NONCE_COOKIE_NAME)?.value, "");
    }
  });

  it("issues a cookie-only session for a valid EOA signature", async () => {
    const { POST } = await import("./route");
    const { COOKIE_NAME } = await import("./session-utils");
    const account = privateKeyToAccount(
      `0x${"11".repeat(32)}` as `0x${string}`,
    );
    const { request } = await createVerificationRequest({
      address: account.address,
    });
    const body = JSON.parse(await request.text()) as { message: string };
    const signedForRequest = await account.signMessage({
      message: body.message,
    });
    const signedRequest = new NextRequest("http://localhost/siwe", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: request.headers.get("cookie")!,
        host: "localhost",
        origin: "http://localhost",
      },
      body: JSON.stringify({
        message: body.message,
        signature: signedForRequest,
      }),
    });

    const response = await POST(signedRequest);
    const responseBody = (await response.json()) as Record<string, unknown>;
    assert.equal(response.status, 200);
    assert.equal(responseBody.address, account.address);
    assert.equal("token" in responseBody, false);
    assert.ok(response.cookies.get(COOKIE_NAME)?.value);
  });

  it("delegates contract-wallet signatures to the chain public client", async () => {
    const { POST } = await import("./route");
    const { siweMainnetClient } = await import("./public-client");
    const originalVerifyMessage = siweMainnetClient.verifyMessage;
    let calls = 0;
    Object.assign(siweMainnetClient, {
      verifyMessage: async () => {
        calls += 1;
        return true;
      },
    });

    try {
      const { request } = await createVerificationRequest({
        address: "0x1111111111111111111111111111111111111111",
        signature: `0x${"22".repeat(65)}`,
      });
      const response = await POST(request);

      assert.equal(response.status, 200);
      assert.equal(calls, 1);
    } finally {
      Object.assign(siweMainnetClient, {
        verifyMessage: originalVerifyMessage,
      });
    }
  });

  it("returns 503 when contract-wallet verification RPC is unavailable", async () => {
    const { POST } = await import("./route");
    const { siweMainnetClient } = await import("./public-client");
    const originalVerifyMessage = siweMainnetClient.verifyMessage;
    Object.assign(siweMainnetClient, {
      verifyMessage: async () => {
        throw new Error("RPC unavailable");
      },
    });

    try {
      const { request } = await createVerificationRequest({
        address: "0x1111111111111111111111111111111111111111",
        signature: `0x${"22".repeat(65)}`,
      });
      const response = await POST(request);

      assert.equal(response.status, 503);
      assert.deepEqual(await response.json(), {
        error:
          "Contract-wallet signature verification is temporarily unavailable",
      });
    } finally {
      Object.assign(siweMainnetClient, {
        verifyMessage: originalVerifyMessage,
      });
    }
  });

  it("preserves newer session and nonce cookies during stale cleanup", async () => {
    const { DELETE } = await import("./route");
    const { createNonceCookieBinding, NONCE_COOKIE_NAME, signNonce } =
      await import("./nonce-utils");
    const { COOKIE_NAME, setSession } = await import("./session-utils");
    const oldAddress = "0x1111111111111111111111111111111111111111";
    const newAddress = "0x2222222222222222222222222222222222222222";
    const oldNonce = signNonce("old", Date.now());
    const newNonce = signNonce("new", Date.now());
    const sessionResponse = new NextResponse();
    setSession(sessionResponse, newAddress, 1);
    const sessionCookie = sessionResponse.cookies.get(COOKIE_NAME)?.value;
    assert.ok(sessionCookie);

    const response = await DELETE(
      new NextRequest("http://localhost/siwe", {
        method: "DELETE",
        headers: {
          "content-type": "application/json",
          cookie: [
            `${COOKIE_NAME}=${sessionCookie}`,
            `${NONCE_COOKIE_NAME}=${createNonceCookieBinding(newNonce)}`,
          ].join("; "),
        },
        body: JSON.stringify({
          address: oldAddress,
          nonce: oldNonce,
          expiresAt: Date.now() - 1,
        }),
      }),
    );

    assert.equal(response.status, 200);
    assert.equal(response.cookies.get(COOKIE_NAME), undefined);
    assert.equal(response.cookies.get(NONCE_COOKIE_NAME), undefined);
  });

  it("clears only the exact session returned to a stale client response", async () => {
    const { DELETE } = await import("./route");
    const { COOKIE_NAME, setSession } = await import("./session-utils");
    const address = "0x1111111111111111111111111111111111111111";
    const currentExpiry = Date.now() + 120_000;
    const sessionResponse = new NextResponse();
    setSession(sessionResponse, address, 1, currentExpiry);
    const sessionCookie = sessionResponse.cookies.get(COOKIE_NAME)?.value;
    assert.ok(sessionCookie);

    const staleResponse = await DELETE(
      new NextRequest("http://localhost/siwe", {
        method: "DELETE",
        headers: {
          "content-type": "application/json",
          cookie: `${COOKIE_NAME}=${sessionCookie}`,
        },
        body: JSON.stringify({
          address,
          expiresAt: currentExpiry - 1_000,
        }),
      }),
    );
    assert.equal(staleResponse.cookies.get(COOKIE_NAME), undefined);

    const exactResponse = await DELETE(
      new NextRequest("http://localhost/siwe", {
        method: "DELETE",
        headers: {
          "content-type": "application/json",
          cookie: `${COOKIE_NAME}=${sessionCookie}`,
        },
        body: JSON.stringify({ address, expiresAt: currentExpiry }),
      }),
    );
    assert.equal(exactResponse.cookies.get(COOKIE_NAME)?.value, "");
  });

  it("does not clear a newer nonce cookie when an older verification arrives", async () => {
    const { POST } = await import("./route");
    const { createNonceCookieBinding, NONCE_COOKIE_NAME, signNonce } =
      await import("./nonce-utils");
    const oldAttempt = await createVerificationRequest();
    const oldBody = await oldAttempt.request.text();
    const newNonce = signNonce("new", Date.now());
    const response = await POST(
      new NextRequest("http://localhost/siwe", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: `${NONCE_COOKIE_NAME}=${createNonceCookieBinding(newNonce)}`,
          host: "localhost",
          origin: "http://localhost",
        },
        body: oldBody,
      }),
    );

    assert.equal(response.status, 400);
    assert.equal(response.cookies.get(NONCE_COOKIE_NAME), undefined);
  });

  it("clears both SIWE cookies on sign-out", async () => {
    const { DELETE } = await import("./route");
    const { COOKIE_NAME } = await import("./session-utils");
    const { NONCE_COOKIE_NAME } = await import("./nonce-utils");

    const response = await DELETE(
      new NextRequest("http://localhost/siwe", { method: "DELETE" }),
    );

    assert.equal(response.cookies.get(COOKIE_NAME)?.value, "");
    assert.equal(response.cookies.get(NONCE_COOKIE_NAME)?.value, "");
  });
});
