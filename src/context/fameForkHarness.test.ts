import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { base, sepolia } from "viem/chains";
import {
  resolveFameForkAccount,
  withFameForkRpc,
} from "./fameForkHarness";

const account = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

describe("FAME fork wallet harness", () => {
  it("only accepts a valid account in explicit fork mode", () => {
    assert.equal(resolveFameForkAccount({ enabled: false, account }), null);
    assert.equal(
      resolveFameForkAccount({ enabled: true, account: "invalid" }),
      null,
    );
    assert.equal(resolveFameForkAccount({ enabled: true, account }), account);
  });

  it("pins the Base chain default RPC used by the mock connector", () => {
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
