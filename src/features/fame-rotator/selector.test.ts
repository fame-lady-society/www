import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  RotatorSelectorReadTimeoutError,
  getRotatorSelectorImagePath,
  withRotatorSelectorReadDeadline,
} from "./selector";

describe("withRotatorSelectorReadDeadline", () => {
  it("returns a successful pool read before its deadline", async () => {
    assert.equal(
      await withRotatorSelectorReadDeadline(Promise.resolve("pool"), 20),
      "pool",
    );
  });

  it("fails boundedly when an RPC read never resolves", async () => {
    const never = new Promise<never>(() => {});
    await assert.rejects(
      withRotatorSelectorReadDeadline(never, 1),
      RotatorSelectorReadTimeoutError,
    );
  });
});

describe("getRotatorSelectorImagePath", () => {
  it("defers artwork to the token-image route", () => {
    assert.equal(getRotatorSelectorImagePath(42), "/fame/token/image/42");
  });
});
