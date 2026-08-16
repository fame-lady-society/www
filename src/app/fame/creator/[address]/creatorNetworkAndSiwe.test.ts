import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("creator portal network and SIWE boundaries", () => {
  it("switches to Base before rendering Base-dependent creator tools", () => {
    const gate = source(
      "src/app/fame/creator/[address]/CreatorBaseNetworkGate.tsx",
    );
    const page = source("src/app/fame/creator/[address]/page.tsx");
    const grid = source("src/app/fame/creator/[address]/SelectableGrid.tsx");

    assert.match(gate, /useSwitchChain/);
    assert.match(gate, /switchChain\(\{ chainId: base\.id \}\)/);
    assert.match(gate, /requestedRef\.current = null/);
    assert.match(gate, /Switching to Base to load the Creator Portal/);
    assert.match(page, /<CreatorBaseNetworkGate>/);
    assert.match(grid, /useClient\(\{ chainId: base\.id \}\)/);
  });

  it("invalidates an SIWE session restored on a different wallet chain", () => {
    const siwe = source("src/context/SiweSession.tsx");

    assert.match(siwe, /if \(restored\.chainId !== chainId\)/);
    assert.match(
      siwe,
      /session\.chainId === chainId/,
      "a session is signed in only on its connected chain",
    );
    assert.match(
      siwe,
      /\[address, chainId, clearClientSession, enabled, isConnected, restoreSession\]/,
      "chain changes re-run SIWE restoration",
    );
  });
});
