import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { maxUint256, type Address, type Hash } from "viem";
import {
  createGalleryAdminSubmissionGate,
  executeGalleryAdminAction,
  parseGalleryPremium,
  parseGalleryRendererSeed,
  parseGalleryTokenId,
  parseUnsignedTestAmount,
  type GalleryAdminDependencies,
  type GalleryAdminEvent,
} from "./adminAction";

const account = "0x1111111111111111111111111111111111111111" as Address;
const hash = `0x${"a".repeat(64)}` as Hash;

describe("gallery admin actions", () => {
  it("parses bounded plain-decimal token, seed, premium, and withdrawal inputs", () => {
    assert.equal(parseGalleryTokenId("888"), 888n);
    assert.equal(parseGalleryRendererSeed("0"), 0n);
    assert.equal(parseGalleryRendererSeed(maxUint256.toString()), maxUint256);
    assert.equal(parseGalleryPremium("1.25"), 1_250_000_000_000_000_000n);
    assert.equal(
      parseUnsignedTestAmount("0", { allowZero: true, maximum: 10n }),
      0n,
    );

    for (const value of ["", "-1", "1e3", "1.2.3", "1.".padEnd(82, "0")]) {
      assert.throws(() => parseUnsignedTestAmount(value, { allowZero: true }));
    }
    assert.throws(() => parseGalleryPremium("0"));
    assert.throws(() => parseGalleryPremium("1.0000000000000000001"));
    assert.throws(() =>
      parseGalleryPremium(((1n << 96n) / 10n ** 18n + 1n).toString()),
    );
    assert.throws(() => parseGalleryTokenId("0"));
    assert.throws(() => parseGalleryTokenId("889"));
    assert.throws(() => parseGalleryRendererSeed("-1"));
    assert.throws(() => parseGalleryRendererSeed(`${maxUint256}0`));
  });

  it("simulates the exact gallery call before one wallet request", async () => {
    const events: GalleryAdminEvent[] = [];
    const calls: string[] = [];
    const dependencies: GalleryAdminDependencies = {
      dispatch(event) {
        events.push(event);
      },
      getWalletContext() {
        return { account, chainId: 84_532 };
      },
      async switchChain() {
        calls.push("switch");
      },
      async simulate(call) {
        calls.push(`simulate ${call.kind}`);
        return call;
      },
      async write() {
        calls.push("write");
        return hash;
      },
      async waitForReceipt() {
        calls.push("wait");
        return { status: "success" };
      },
      async refresh(call) {
        calls.push(`refresh ${call.kind}`);
      },
    };

    const result = await executeGalleryAdminAction(
      { kind: "list", tokenId: 7n, premium: 10n },
      84_532,
      dependencies,
    );

    assert.deepEqual(result, { status: "confirmed", hash });
    assert.deepEqual(calls, ["simulate list", "write", "wait", "refresh list"]);
    assert.equal(events.at(-1)?.type, "confirmed");
  });

  it("keeps a mined action confirmed when canonical refresh fails", async () => {
    const events: GalleryAdminEvent[] = [];
    const refreshFailure = new Error("RPC unavailable");
    const dependencies: GalleryAdminDependencies = {
      dispatch(event) {
        events.push(event);
      },
      getWalletContext() {
        return { account, chainId: 84_532 };
      },
      async switchChain() {},
      async simulate() {
        return null;
      },
      async write() {
        return hash;
      },
      async waitForReceipt() {
        return { status: "success" };
      },
      async refresh() {
        throw refreshFailure;
      },
    };

    const result = await executeGalleryAdminAction(
      { kind: "unlist", tokenId: 7n },
      84_532,
      dependencies,
    );

    assert.deepEqual(result, {
      status: "confirmed_refreshing",
      hash,
      cause: refreshFailure,
    });
    assert.equal(events.at(-1)?.type, "confirmed_refreshing");
  });

  it("serializes rapid admin submissions", async () => {
    const gate = createGalleryAdminSubmissionGate();
    let release!: () => void;
    const first = gate.run(
      () =>
        new Promise<string>((resolve) => {
          release = () => resolve("done");
        }),
    );
    assert.deepEqual(await gate.run(async () => "second"), {
      status: "blocked",
    });
    release();
    assert.equal(await first, "done");
  });
});
