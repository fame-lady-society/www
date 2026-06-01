import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatFamePoolActivationReportJson } from "./fame-swap-pool-activation-report";

describe("FAME pool activation report script", () => {
  it("formats the activation report as reviewable JSON", () => {
    const parsed = JSON.parse(formatFamePoolActivationReportJson()) as {
      status?: string;
      upstreamPoolCount?: number;
      upstreamPools?: unknown[];
      producerOnlyPools?: unknown[];
    };

    assert.equal(parsed.status, "generated-reviewed-activation");
    assert.equal(parsed.upstreamPoolCount, 26);
    assert.equal(parsed.upstreamPools?.length, 26);
    assert.ok((parsed.producerOnlyPools?.length ?? 0) > 0);
  });
});
