import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  FAME_SELECTED_CL_ACTIVATION_CANDIDATE,
  FAME_SELECTED_LIVE_ROUTE_DEPENDENCY,
  assertReviewedPoolActivationCoverage,
  famePoolActivationReport,
} from "./poolActivation";

describe("FAME pool activation report", () => {
  it("accounts for every upstream pool exactly once", () => {
    const report = famePoolActivationReport();
    const poolIds = report.upstreamPools.map((pool) => pool.poolId);

    assert.equal(report.upstreamPoolCount, 26);
    assert.equal(report.upstreamPools.length, report.upstreamPoolCount);
    assert.equal(new Set(poolIds).size, report.upstreamPoolCount);
    assert.equal(
      Object.values(report.statusCounts).reduce(
        (total, count) => total + count,
        0,
      ),
      report.upstreamPoolCount,
    );
  });

  it("fails closed when upstream pools and reviewed activation rows diverge", () => {
    assert.throws(
      () =>
        assertReviewedPoolActivationCoverage(["known", "new-pool"], ["known"]),
      /Missing reviewed activation status for upstream pool new-pool/,
    );
    assert.throws(
      () => assertReviewedPoolActivationCoverage(["known"], ["known", "stale"]),
      /unknown upstream pool stale/,
    );
  });

  it("keeps producer representation separate from quote activation", () => {
    const report = famePoolActivationReport();
    const unrepresented = [
      "slipstream-spx-weth",
      "slipstream-usdc-weth-migrating-50",
      "slipstream-msusd-usdc-a",
      "slipstream-weth-mseth",
      "slipstream2-msusd-mseth",
      "slipstream2-msusd-usdc-c",
    ];

    for (const poolId of unrepresented) {
      const pool = report.upstreamPools.find(
        (entry) => entry.poolId === poolId,
      );
      assert.ok(pool, poolId);
      assert.equal(pool.producerRegistryPresence, "producer-unrepresented");
      assert.equal(pool.producerRegistryEntry, null);
    }
  });

  it("keeps the migrating Slipstream pool visible as blocked", () => {
    const report = famePoolActivationReport();
    const blocked = report.upstreamPools.find(
      (entry) => entry.poolId === "slipstream-usdc-weth-migrating-50",
    );

    assert.equal(blocked?.activationStatus, "blocked");
    assert.equal(blocked?.consumerQuoteCapability, "none");
    assert.match(blocked?.reason ?? "", /migrating pool/i);
  });

  it("marks the selected pool compact quote active with its live V4 dependency", () => {
    const report = famePoolActivationReport();
    const candidate = report.upstreamPools.find(
      (entry) => entry.poolId === FAME_SELECTED_CL_ACTIVATION_CANDIDATE,
    );

    assert.equal(candidate?.activationStatus, "cl-compact-quote-active");
    assert.equal(candidate?.selectedCandidate, true);
    assert.equal(candidate?.consumerQuoteCapability, "cl-compact-quote");
    assert.deepEqual(candidate?.liveRouteDependencies, [
      FAME_SELECTED_LIVE_ROUTE_DEPENDENCY,
    ]);
    assert.ok((candidate?.selectedRouteArtifactIds.length ?? 0) > 0);
    assert.ok(
      candidate?.routeReferences.every((reference) =>
        reference.routePoolOrder.includes(FAME_SELECTED_LIVE_ROUTE_DEPENDENCY),
      ),
    );
  });

  it("derives consumer quote capability from reviewed activation status", () => {
    const report = famePoolActivationReport();

    for (const pool of report.upstreamPools) {
      if (pool.activationStatus === "reserve-compact-quote-active") {
        assert.equal(pool.consumerQuoteCapability, "reserve-compact-quote");
      } else if (pool.activationStatus === "cl-compact-quote-active") {
        assert.equal(pool.consumerQuoteCapability, "cl-compact-quote");
      } else {
        assert.equal(pool.consumerQuoteCapability, "none", pool.poolId);
      }
    }
  });

  it("keeps the basedflick/ZORA V4 dependency unsupported for compact quotes", () => {
    const report = famePoolActivationReport();
    const v4Dependency = report.upstreamPools.find(
      (entry) => entry.poolId === FAME_SELECTED_LIVE_ROUTE_DEPENDENCY,
    );

    assert.equal(v4Dependency?.activationStatus, "unsupported");
    assert.equal(v4Dependency?.consumerQuoteCapability, "none");
    assert.equal(v4Dependency?.liveRouteDependency, true);
    assert.match(v4Dependency?.reason ?? "", /V4 compact quote support/i);
  });

  it("reports producer-only entries without counting them as upstream pools", () => {
    const report = famePoolActivationReport();

    assert.ok(
      report.producerOnlyPools.some(
        (entry) => entry.poolId === "native-wrap-weth",
      ),
    );
    assert.ok(
      !report.upstreamPools.some(
        (entry) => entry.poolId === "native-wrap-weth",
      ),
    );
  });
});
