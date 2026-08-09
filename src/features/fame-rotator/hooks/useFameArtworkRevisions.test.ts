import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { fameArtworkRevisionsQueryOptions } from "./useFameArtworkRevisions";

describe("rotator artwork revision query", () => {
  it("pins selector reads by block and forces current owned reads fresh", () => {
    const pinned = fameArtworkRevisionsQueryOptions([2, 1], "123");
    const current = fameArtworkRevisionsQueryOptions([2, 1]);

    assert.deepEqual(pinned.queryKey, ["fame-artwork-revisions", "123", "2,1"]);
    assert.equal(pinned.staleTime, Infinity);
    assert.equal(current.staleTime, 0);
    assert.equal(current.gcTime, 0);
    assert.equal(current.refetchOnMount, "always");
  });
});
