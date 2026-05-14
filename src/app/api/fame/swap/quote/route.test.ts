import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { NextRequest } from "next/server";
import { FAME, USDC } from "../../../../../features/fame-swap/tokens";
import { POST } from "./route";

function request(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost/api/fame/swap/quote", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("/api/fame/swap/quote", () => {
  it("rejects arbitrary router address overrides", async () => {
    const response = await POST(
      request({
        tokenIn: USDC,
        tokenOut: FAME,
        amountIn: "5000000",
        recipient: "0x0000000000000000000000000000000000000abc",
        routerAddress: "0x0000000000000000000000000000000000000123",
      }),
    );
    const json = await response.json();

    assert.equal(response.status, 400);
    assert.match(json.error, /routerAddress overrides/);
  });

  it("rejects unbounded raw amounts before liquidity reads", async () => {
    const response = await POST(
      request({
        tokenIn: USDC,
        tokenOut: FAME,
        amountIn: "1".repeat(79),
        recipient: "0x0000000000000000000000000000000000000abc",
      }),
    );
    const json = await response.json();

    assert.equal(response.status, 400);
    assert.match(json.error, /amountIn/);
  });

  it("does not fall back to deterministic caps when live liquidity quotes are unavailable", async () => {
    const previousRpc = process.env.NEXT_PUBLIC_BASE_RPC_URL_1;
    delete process.env.NEXT_PUBLIC_BASE_RPC_URL_1;
    try {
      const response = await POST(
        request({
          tokenIn: FAME,
          tokenOut: USDC,
          amountIn: "31597600141347829000",
          recipient: "0x0000000000000000000000000000000000000abc",
        }),
      );
      const json = await response.json();

      assert.equal(json.status, "quote_adapter_failure");
      assert.equal("approval" in json, false);
      assert.equal("swap" in json, false);
      assert.ok(Array.isArray(json.rejectedCandidates));
      assert.match(
        json.rejectedCandidates[0]?.message ?? "",
        /Base RPC is not configured/,
      );
    } finally {
      if (previousRpc === undefined) {
        delete process.env.NEXT_PUBLIC_BASE_RPC_URL_1;
      } else {
        process.env.NEXT_PUBLIC_BASE_RPC_URL_1 = previousRpc;
      }
    }
  });
});
