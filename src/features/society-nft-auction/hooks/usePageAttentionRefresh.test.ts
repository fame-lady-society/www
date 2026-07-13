import assert from "node:assert/strict";
import test from "node:test";
import { createPageAttentionRefreshGate } from "./usePageAttentionRefresh";

test("coalesces focus and visibility attention into one refresh", async () => {
  let nowMs = 10_000;
  let refreshes = 0;
  const gate = createPageAttentionRefreshGate(
    async () => {
      refreshes += 1;
    },
    { now: () => nowMs, dedupeMs: 1_000 },
  );

  await Promise.all([gate.request(), gate.request()]);
  assert.equal(refreshes, 1);

  nowMs += 999;
  await gate.request();
  assert.equal(refreshes, 1);

  nowMs += 1;
  await gate.request();
  assert.equal(refreshes, 2);
});

test("shares an in-flight attention refresh", async () => {
  let release: (() => void) | undefined;
  let refreshes = 0;
  const gate = createPageAttentionRefreshGate(async () => {
    refreshes += 1;
    await new Promise<void>((resolve) => {
      release = resolve;
    });
  });

  const first = gate.request();
  const second = gate.request();
  assert.equal(refreshes, 1);
  release?.();
  await Promise.all([first, second]);
  assert.equal(refreshes, 1);
});
