import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { calculateMarketCap } from "./marketCapCalculator";
import { marketCapShareValues, shareMarketCap } from "./marketCapShare";

const data = {
  currentMarketCapUsdc: "243700123456",
  currentMarketCapInput: { value: "243.7", unit: "K" as const },
  conversion: null,
};
const selected = calculateMarketCap("1", "M", data);
if (selected.status !== "available") throw new Error("Invalid fixture");
const calculation = selected;

describe("market cap sharing", () => {
  it("uses the exact snapshot for a blank input and the selected cap after editing", () => {
    const snapshot = calculateMarketCap("", "K", data);
    assert.equal(snapshot.status, "available");
    if (snapshot.status !== "available") return;
    assert.equal(marketCapShareValues(snapshot).marketCap, "$243,700.123456");
    assert.deepEqual(marketCapShareValues(calculation), {
      marketCap: "$1,000,000",
      society: "$1,126.13",
      eth: "ETH value unavailable",
      fame: "$0.001126",
    });
  });

  it("attaches the PNG before any async work, downloads when unsupported, and propagates cancellation", async () => {
    const originals = ["document", "navigator"].map(
      (key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)] as const,
    );
    let payload: ShareData | undefined;
    let downloaded = false;
    const labels: string[] = [];
    const context = {
      fillRect() {},
      fillText(value: string) {
        labels.push(value);
      },
    };
    const link = {
      click() {
        downloaded = true;
      },
      remove() {},
    };
    const navigatorMock = {
      canShare: () => true,
      share: (value: ShareData) => {
        payload = value;
        return Promise.resolve();
      },
    };
    try {
      Object.defineProperty(globalThis, "document", {
        configurable: true,
        value: {
          createElement: (tag: string) =>
            tag === "canvas"
              ? {
                  getContext: () => context,
                  toDataURL: () => "data:image/png;base64,iVBORw0KGgo=",
                }
              : link,
          body: { appendChild() {} },
        },
      });
      Object.defineProperty(globalThis, "navigator", {
        configurable: true,
        value: navigatorMock,
      });
      const pending = shareMarketCap(calculation);
      assert.ok(payload, "share must be invoked synchronously with the click");
      assert.deepEqual(Object.keys(payload), ["files"]);
      assert.equal(payload.files?.length, 1);
      assert.equal(payload.files?.[0].type, "image/png");
      assert.ok((payload.files?.[0].size ?? 0) > 0);
      assert.ok(labels.includes("$1,000,000"));
      assert.ok(labels.includes("$1,126.13"));
      assert.equal(await pending, "shared");
      assert.equal(downloaded, false);

      navigatorMock.canShare = () => false;
      assert.equal(await shareMarketCap(calculation), "downloaded");
      assert.equal(downloaded, true);

      downloaded = false;
      navigatorMock.canShare = () => true;
      navigatorMock.share = () =>
        Promise.reject(new DOMException("Cancelled", "AbortError"));
      await assert.rejects(shareMarketCap(calculation), { name: "AbortError" });
      assert.equal(downloaded, false);
    } finally {
      for (const [key, descriptor] of originals) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor);
        else Reflect.deleteProperty(globalThis, key);
      }
    }
  });
});
