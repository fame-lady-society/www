import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createGalleryCustodyCacheIdentity,
  createGalleryCustodyHintCache,
  parseGalleryCustodyHintCache,
  serializeGalleryCustodyHintCache,
} from "./cache";

const identity = createGalleryCustodyCacheIdentity();

describe("gallery custody hint cache", () => {
  it("restores bounded, ascending held-ID hints for the exact deployment", () => {
    const cache = createGalleryCustodyHintCache([1n, 888n], 123);

    assert.deepEqual(
      parseGalleryCustodyHintCache(
        serializeGalleryCustodyHintCache(cache),
        identity,
      ),
      cache,
    );
  });

  it("rejects deployment drift, duplicates, and out-of-range IDs", () => {
    const valid = createGalleryCustodyHintCache([1n, 2n], 123);
    const serialized = JSON.parse(
      serializeGalleryCustodyHintCache(valid),
    ) as Record<string, unknown>;

    assert.equal(
      parseGalleryCustodyHintCache(
        JSON.stringify({
          ...serialized,
          identity: { ...identity, deploymentBlock: "1" },
        }),
        identity,
      ),
      null,
    );

    for (const heldTokenIds of [["1", "1"], ["0"], ["889"], ["2", "1"]]) {
      assert.equal(
        parseGalleryCustodyHintCache(
          JSON.stringify({ ...serialized, heldTokenIds }),
          identity,
        ),
        null,
      );
    }
  });
});
