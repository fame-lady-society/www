import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createLatestRequestGuard,
  isUsableSubmittedMetadataRefresh,
  matchesSubmittedMetadataUrl,
  parsePendingMetadataUpdate,
} from "./creatorMetadataUpdateState";
import {
  createTransactionSingleFlight,
  reconcileSubmittedTransaction,
} from "./submittedTransactionState";
import { isReleasedCreatorUpdateToken } from "@/features/fame/creatorMetadata";

describe("creator metadata update state", () => {
  it("accepts only released collection token IDs", () => {
    assert.equal(isReleasedCreatorUpdateToken(1, 650), true);
    assert.equal(isReleasedCreatorUpdateToken(649, 650), true);
    assert.equal(isReleasedCreatorUpdateToken(0, 650), false);
    assert.equal(isReleasedCreatorUpdateToken(650, 650), false);
    assert.equal(isReleasedCreatorUpdateToken(889, 900), false);
    assert.equal(isReleasedCreatorUpdateToken(1.5, 650), false);
  });

  it("prevents overlapping submissions", async () => {
    let release!: () => void;
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    const singleFlight = createTransactionSingleFlight();
    let calls = 0;
    const first = singleFlight(async () => {
      calls += 1;
      await pending;
    });
    assert.equal(
      await singleFlight(async () => {
        calls += 1;
      }),
      false,
    );
    release();
    assert.equal(await first, true);
    assert.equal(calls, 1);
  });

  it("invalidates out-of-order token lookup responses", () => {
    const requests = createLatestRequestGuard();
    const first = requests.begin();
    const second = requests.begin();
    assert.equal(requests.isCurrent(first), false);
    assert.equal(requests.isCurrent(second), true);
    requests.invalidate();
    assert.equal(requests.isCurrent(second), false);
  });

  it("accepts a refreshed preview only for the submitted metadata URL", () => {
    assert.equal(
      matchesSubmittedMetadataUrl(
        { tokenUri: "https://gateway.irys.xyz/new" },
        "https://gateway.irys.xyz/new",
      ),
      true,
    );
    assert.equal(
      matchesSubmittedMetadataUrl(
        { tokenUri: "https://gateway.irys.xyz/old" },
        "https://gateway.irys.xyz/new",
      ),
      false,
    );
    assert.equal(
      matchesSubmittedMetadataUrl(null, "https://gateway.irys.xyz/new"),
      false,
    );
  });

  it("keeps a confirmed refresh pending until the new metadata resolves", () => {
    const revision = { tokenUri: "https://gateway.irys.xyz/new" };
    assert.equal(
      isUsableSubmittedMetadataRefresh(
        { revision, metadata: { status: "ready" } },
        revision.tokenUri,
      ),
      true,
    );
    assert.equal(
      isUsableSubmittedMetadataRefresh(
        { revision, metadata: { status: "failure" } },
        revision.tokenUri,
      ),
      false,
    );
  });

  it("distinguishes successful, reverted, and unknown receipts", async () => {
    assert.equal(
      await reconcileSubmittedTransaction(async () => "success"),
      "success",
    );
    assert.equal(
      await reconcileSubmittedTransaction(async () => "reverted"),
      "reverted",
    );
    assert.equal(
      await reconcileSubmittedTransaction(async () => {
        throw new Error("receipt unavailable");
      }),
      "unknown",
    );
  });

  it("restores only a pending update for the same account", () => {
    const pending = {
      account: "0x0000000000000000000000000000000000000001",
      tokenId: 123,
      metadataUrl: "https://gateway.irys.xyz/metadata",
      hash: `0x${"a".repeat(64)}`,
      submittedAt: 1_700_000_000_000,
    } as const;
    assert.deepEqual(
      parsePendingMetadataUpdate(JSON.stringify(pending), pending.account),
      pending,
    );
    assert.equal(
      parsePendingMetadataUpdate(
        JSON.stringify(pending),
        "0x0000000000000000000000000000000000000002",
      ),
      null,
    );
    assert.equal(parsePendingMetadataUpdate("not-json", pending.account), null);
  });
});
