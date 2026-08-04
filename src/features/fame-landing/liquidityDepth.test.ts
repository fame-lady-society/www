import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { executableDepth, mapBounded } from "./liquidityDepth";

describe("FAME landing executable depth", () => {
  it("chooses the highest candidate within two percent and labels a qualifying cap", () => {
    const result = executableDepth(
      { input: 100n, output: 100n },
      [{ input: 100n, output: 99n }, { input: 200n, output: 196n }, { input: 300n, output: 291n }],
      0,
      0,
    );
    assert.deepEqual(result, { amount: 196n, atLeast: false });
  });

  it("does not invent a depth when the reference or first quote is unavailable", () => {
    assert.equal(executableDepth(null, [], 6, 18), null);
    assert.equal(executableDepth({ input: 1n, output: 1n }, [{ input: 1n, output: 0n }], 6, 18), null);
  });

  it("bounds ladder work while retaining candidate order", async () => {
    let active = 0;
    let peak = 0;
    const result = await mapBounded([1, 2, 3, 4], 2, async (value) => {
      active += 1;
      peak = Math.max(peak, active);
      await Promise.resolve();
      active -= 1;
      return value * 10;
    });
    assert.deepEqual(result, [10, 20, 30, 40]);
    assert.equal(peak, 2);
  });
});
