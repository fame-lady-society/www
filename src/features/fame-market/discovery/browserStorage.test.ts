import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getBrowserGalleryCustodyHintStorage } from "./browserStorage";

describe("browser gallery custody hint storage", () => {
  it("shares one deployment-scoped storage instance between callers", () => {
    assert.equal(
      getBrowserGalleryCustodyHintStorage(),
      getBrowserGalleryCustodyHintStorage(),
    );
  });
});
