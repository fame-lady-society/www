import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";
import {
  createArtworkReleaseSingleFlight,
  reconcileSubmittedArtworkRelease,
  recoverContendedArtworkRelease,
  resolveArtworkReleaseFailure,
} from "./releaseArtworkState";

describe("creator artwork release", () => {
  it("allows only one release submission while the first is pending", async () => {
    let finishFirst!: () => void;
    const firstPending = new Promise<void>((resolve) => {
      finishFirst = resolve;
    });
    const runSingleFlight = createArtworkReleaseSingleFlight();
    let submissions = 0;

    const first = runSingleFlight(async () => {
      submissions += 1;
      await firstPending;
    });
    const overlapping = await runSingleFlight(async () => {
      submissions += 1;
    });

    assert.equal(overlapping, false);
    assert.equal(submissions, 1);

    finishFirst();
    assert.equal(await first, true);
    assert.equal(
      await runSingleFlight(async () => {
        submissions += 1;
      }),
      true,
    );
    assert.equal(submissions, 2);
  });

  it("keeps the uploaded metadata frozen when the boundary has not moved", async () => {
    let regenerated = false;
    const recovered = await recoverContendedArtworkRelease(
      {
        expectedTokenId: 651n,
        imageUri: "https://gateway.irys.xyz/image",
        metadataUri: "https://gateway.irys.xyz/metadata-651",
      },
      async () => 651n,
      async () => {
        regenerated = true;
        return "unused";
      },
    );
    assert.equal(recovered, null);
    assert.equal(regenerated, false);
  });

  it("reuses the image and regenerates metadata for a contended boundary", async () => {
    const imageUri = "https://gateway.irys.xyz/existing-image";
    const recovered = await recoverContendedArtworkRelease(
      {
        expectedTokenId: 651n,
        imageUri,
        metadataUri: "https://gateway.irys.xyz/metadata-651",
      },
      async () => 652n,
      async (input) => {
        assert.deepEqual(input, { expectedTokenId: 652n, imageUri });
        return "https://gateway.irys.xyz/metadata-652";
      },
    );
    assert.deepEqual(recovered, {
      expectedTokenId: 652n,
      imageUri,
      metadataUri: "https://gateway.irys.xyz/metadata-652",
    });
  });

  it("renders release before the suspended owned-token tools", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/app/fame/creator/[address]/page.tsx"),
      "utf8",
    );
    assert.ok(source.indexOf("<ReleaseArtwork") < source.indexOf("<Suspense"));
    assert.match(source, /Loading owned artwork tools/);
    assert.doesNotMatch(source, /getDN404Storage/);
  });

  it("uses CreatorArtistMagic as the creator portal pool authority", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/service/fame.ts"),
      "utf8",
    );
    const getFamePools = source.slice(
      source.indexOf("export async function getFamePools"),
    );
    assert.match(getFamePools, /readFamePoolMembership/);
    assert.match(getFamePools, /functionName: "getMintPoolStart"/);
    assert.doesNotMatch(getFamePools, /Mint-pool side still needs DN404/);
  });

  it("classifies confirmed, reverted, and unknown submitted transactions", async () => {
    assert.equal(
      await reconcileSubmittedArtworkRelease(async () => "success"),
      "success",
    );
    assert.equal(
      await reconcileSubmittedArtworkRelease(async () => "reverted"),
      "reverted",
    );
    assert.equal(
      await reconcileSubmittedArtworkRelease(async () => {
        throw new Error("receipt unavailable");
      }),
      "unknown",
    );
  });

  it("completes, recovers, or blocks the release workflow safely after failure", async () => {
    assert.equal(
      await resolveArtworkReleaseFailure(false, async () => "success"),
      "recover",
    );
    assert.equal(
      await resolveArtworkReleaseFailure(true, async () => "success"),
      "complete",
    );
    assert.equal(
      await resolveArtworkReleaseFailure(true, async () => "reverted"),
      "recover",
    );
    assert.equal(
      await resolveArtworkReleaseFailure(true, async () => {
        throw new Error("receipt unavailable");
      }),
      "block",
    );
  });

  it("reconciles a submitted hash before offering contention recovery", () => {
    const source = readFileSync(
      resolve(
        process.cwd(),
        "src/app/fame/creator/[address]/ReleaseArtwork.tsx",
      ),
      "utf8",
    );
    assert.ok(
      source.indexOf("if (submittedHash)") <
        source.indexOf("recoverIfContended(frozen)"),
    );
    assert.match(source, /getTransactionReceipt/);
    assert.match(
      source,
      /check the transaction before attempting another release/,
    );
  });
});
