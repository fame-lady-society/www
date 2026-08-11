import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { base } from "viem/chains";

import { ClaimRequestError, requestClaim } from "./useClaim";

const input = {
  address: "0x1111111111111111111111111111111111111111" as const,
  contractAddress: "0x2222222222222222222222222222222222222222" as const,
  tokenIds: [1, 2],
  chainId: base.id,
};

describe("claim request authentication", () => {
  it("rejects 401 and 403 responses instead of caching them as claim data", async () => {
    for (const status of [401, 403]) {
      await assert.rejects(
        requestClaim(
          input,
          async () =>
            new Response(JSON.stringify({ error: "unauthorized" }), {
              status,
            }),
        ),
        (error: unknown) =>
          error instanceof ClaimRequestError && error.status === status,
      );
    }
  });

  it("returns successful claim data and includes wallet identity in the request", async () => {
    const claims = { claims: [] };
    const result = await requestClaim(input, async (url, init) => {
      assert.equal(url, `/api/base/${input.contractAddress}/claim`);
      assert.deepEqual(JSON.parse(String(init?.body)), {
        address: input.address,
        tokenIds: input.tokenIds,
      });
      return Response.json(claims);
    });

    assert.deepEqual(result, claims);
  });
});
