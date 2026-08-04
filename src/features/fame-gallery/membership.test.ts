import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { base } from "viem/chains";
import { creatorArtistMagicAddress, fameFromNetwork } from "@/features/fame/contract";
import { readFameGalleryMembership } from "./membership";

describe("FAME Gallery membership", () => {
  it("pins two-way renderer identity and filters the inclusive Art Pool before public IDs", async () => {
    const calls: Record<string, unknown>[] = [];
    const snapshot = await readFameGalleryMembership({
      getBlockNumber: async () => 123n,
      readContract: async (args) => {
        calls.push(args);
        switch (args.functionName) {
          case "fame": return fameFromNetwork(base.id);
          case "renderer": return creatorArtistMagicAddress(base.id);
          case "artPoolStartIndex": return 10n;
          case "artPoolEndIndex": return 12n;
          default: throw new Error("unexpected read");
        }
      },
    }, () => 1000);
    assert.equal(snapshot.visibleTokenIds.includes(10), false);
    assert.equal(snapshot.visibleTokenIds.includes(12), false);
    assert.equal(snapshot.visibleTokenIds.includes(9), true);
    assert.equal(snapshot.visibleTokenIds.includes(13), true);
    assert.equal(calls.every((call) => call.blockNumber === 123n), true);
    assert.equal(calls.some((call) => call.functionName === "artPoolNext"), false);
  });

  it("fails closed when either configured relationship is not active", async () => {
    await assert.rejects(() => readFameGalleryMembership({
      getBlockNumber: async () => 123n,
      readContract: async (args) => args.functionName === "fame"
        ? "0x0000000000000000000000000000000000000001"
        : creatorArtistMagicAddress(base.id),
    }));
  });
});
