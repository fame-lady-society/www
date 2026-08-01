import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { base, sepolia } from "viem/chains";
import { withFameForkRpc } from "./fameForkHarness";

describe("FAME fork RPC harness", () => {
  it("pins the Base chain default RPC in fork mode", () => {
    const chains = withFameForkRpc(
      [base, sepolia],
      "http://127.0.0.1:8545",
    );

    assert.deepEqual(chains[0].rpcUrls.default.http, [
      "http://127.0.0.1:8545",
    ]);
    assert.equal(chains[1], sepolia);
  });
});
