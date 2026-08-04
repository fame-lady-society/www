import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  FAME_COLLECTION_TOKEN_COUNT,
  fameCollectionTokenIds,
  visibleFameCollectionTokenIds,
} from "./collection";

describe("FAME collection domain", () => {
  it("enumerates the neutral complete collection in ascending order", () => {
    const tokenIds = fameCollectionTokenIds();
    assert.equal(tokenIds.length, FAME_COLLECTION_TOKEN_COUNT);
    assert.equal(tokenIds[0], 1);
    assert.equal(tokenIds.at(-1), 888);
    assert.equal(new Set(tokenIds).size, FAME_COLLECTION_TOKEN_COUNT);
  });

  it("removes only a validated inclusive Art Pool before public derivation", () => {
    const visible = visibleFameCollectionTokenIds(10, 12);
    assert.equal(visible.includes(9), true);
    assert.equal(visible.includes(10), false);
    assert.equal(visible.includes(11), false);
    assert.equal(visible.includes(12), false);
    assert.equal(visible.includes(13), true);
    assert.equal(visible.length, FAME_COLLECTION_TOKEN_COUNT - 3);
  });

  it("rejects invalid bounds instead of guessing an exclusion", () => {
    assert.throws(() => visibleFameCollectionTokenIds(0, 1));
    assert.throws(() => visibleFameCollectionTokenIds(3, 2));
    assert.throws(() => visibleFameCollectionTokenIds(1, 889));
  });
});
