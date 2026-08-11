import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { GalleryConnectionAttempt } from "./galleryConnectionAttempt";

describe("gallery wallet connection attempt", () => {
  it("executes once when the address arrives before modal close", () => {
    const attempt = new GalleryConnectionAttempt();
    attempt.begin();

    assert.equal(
      attempt.observe({
        connected: false,
        modalOpen: true,
        modalLoading: true,
      }),
      "wait",
    );
    assert.equal(
      attempt.observe({
        connected: true,
        modalOpen: true,
        modalLoading: false,
      }),
      "execute",
    );
    assert.equal(
      attempt.observe({
        connected: true,
        modalOpen: false,
        modalLoading: false,
      }),
      "wait",
    );
  });

  it("buffers modal close and executes when the address follows", () => {
    const attempt = new GalleryConnectionAttempt();
    attempt.begin();
    attempt.observe({ connected: false, modalOpen: true, modalLoading: false });

    assert.equal(
      attempt.observe({
        connected: false,
        modalOpen: false,
        modalLoading: false,
      }),
      "schedule_cancel",
    );
    assert.equal(attempt.settleAfterClose(true), "execute");
    assert.equal(attempt.settleAfterClose(true), "wait");
  });

  it("cancels once when the modal closes without a connection", () => {
    const attempt = new GalleryConnectionAttempt();
    attempt.begin();
    attempt.observe({ connected: false, modalOpen: true, modalLoading: false });
    attempt.observe({
      connected: false,
      modalOpen: false,
      modalLoading: false,
    });

    assert.equal(attempt.settleAfterClose(false), "cancel");
    assert.equal(attempt.settleAfterClose(false), "wait");
  });

  it("reset makes connector failure, navigation, and unmount terminal", () => {
    const attempt = new GalleryConnectionAttempt();
    attempt.begin();
    attempt.reset();

    assert.equal(attempt.isWaiting(), false);
    assert.equal(attempt.settleAfterClose(true), "wait");
  });
});
