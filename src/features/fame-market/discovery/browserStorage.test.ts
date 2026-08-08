import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getBrowserGalleryCustodyHintStorage } from "./browserStorage";

const identity = {
  chainId: 8_453,
  manifestVersion: 1,
  marketplaceAddress: "0x1111111111111111111111111111111111111111",
  deploymentBlock: "0",
  firstTokenId: "1",
  lastTokenId: "888",
};

describe("browser gallery custody hint storage", () => {
  it("shares one deployment-scoped storage instance between callers", () => {
    assert.equal(
      getBrowserGalleryCustodyHintStorage(identity),
      getBrowserGalleryCustodyHintStorage(identity),
    );
  });
});
