import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { SiweAttemptCoordinator } from "./siweLifecycle";

describe("SiweAttemptCoordinator", () => {
  it("shares one in-flight attempt", async () => {
    const coordinator = new SiweAttemptCoordinator();
    let executions = 0;
    let release: ((value: boolean) => void) | undefined;

    const first = coordinator.run(
      () =>
        new Promise<boolean>((resolve) => {
          executions += 1;
          release = resolve;
        }),
    );
    const second = coordinator.run(async () => {
      executions += 1;
      return false;
    });

    assert.equal(first, second);
    assert.equal(coordinator.hasInFlightAttempt(), true);
    assert.equal(executions, 1);
    release?.(true);
    assert.equal(await first, true);
    assert.equal(coordinator.hasInFlightAttempt(), false);
  });

  it("invalidates stale attempts and permits a new one", async () => {
    const coordinator = new SiweAttemptCoordinator();
    let staleEpoch = 0;
    let release: ((value: boolean) => void) | undefined;

    const stale = coordinator.run(
      (epoch) =>
        new Promise<boolean>((resolve) => {
          staleEpoch = epoch;
          release = resolve;
        }),
    );
    coordinator.invalidate();

    assert.equal(coordinator.isCurrent(staleEpoch), false);
    assert.equal(await coordinator.run(async () => true), true);
    release?.(false);
    assert.equal(await stale, false);
  });
});
