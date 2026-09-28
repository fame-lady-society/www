import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import {
  decodeFunctionData,
  encodeFunctionData,
  getAddress,
  type Hash,
} from "viem";
import {
  fameApprovalRead,
  fameApprovalRevoke,
  riskyFameOperator,
} from "./fameApproval";
import { FameApprovalWarningView } from "./FameApprovalWarning";

const account = "0xF11Ce547ff948a03570B20Eac4a4d7b648693324";
const noop = () => {};
const render = (
  props: Partial<Parameters<typeof FameApprovalWarningView>[0]> = {},
) =>
  renderToStaticMarkup(
    <FameApprovalWarningView onRevoke={noop} onRetry={noop} {...props} />,
  );

describe("FAME operator approval warning", () => {
  it("reads the connected owner and exact operator on the Base Society mirror", () => {
    const request = fameApprovalRead(account);
    assert.equal(request.chainId, 8453);
    assert.equal(
      request.address.toLowerCase(),
      "0xbb5ed04dd7b207592429eb8d599d103ccad646c4",
    );
    assert.equal(request.functionName, "isApprovedForAll");
    assert.deepEqual(request.args, [account, riskyFameOperator]);
  });

  it("encodes the same revocation as the linked transaction, never an ERC20 approval", () => {
    const request = fameApprovalRevoke(account);
    assert.equal(request.account, account);
    assert.equal(request.chainId, 8453);
    assert.equal(request.address, fameApprovalRead(account).address);
    const data = encodeFunctionData(request);
    assert.equal(
      data,
      "0xa22cb4650000000000000000000000009a1d00bed7cd04bcda516d721a596eb22aac68340000000000000000000000000000000000000000000000000000000000000000",
    );
    assert.deepEqual(decodeFunctionData({ abi: request.abi, data }).args, [
      getAddress(riskyFameOperator),
      false,
    ]);
  });

  it("does not warn for an unapproved wallet or an unresolved read", () => {
    assert.equal(render({ approved: false }), "");
    assert.equal(render(), "");
  });

  it("shows a persistent warning and revoke action for approval", () => {
    const html = render({ approved: true });
    assert.match(html, /Revoke this approval or your FAME is at risk/);
    assert.match(html, /Revoke approval/);
    assert.doesNotMatch(html, /Close|Dismiss/);
  });

  it("keeps submitted transactions visible while approval remains and disables duplicate submissions", () => {
    const hash = `0x${"1".repeat(64)}` as Hash;
    const html = render({
      approved: true,
      hash,
      status: "Waiting for Base confirmation…",
    });
    assert.match(html, /Revoke this approval or your FAME is at risk/);
    assert.match(html, /<button[^>]*disabled/);
    assert.match(html, new RegExp(`https://basescan.org/tx/${hash}`));
  });

  it("hides a submitted warning as soon as the approval read is false", () => {
    const hash = `0x${"1".repeat(64)}` as Hash;
    assert.equal(
      render({ approved: false, hash, status: "Waiting for Base confirmation…" }),
      "",
    );
  });

  it("reports failed reads without claiming an approval exists", () => {
    const html = render({ readError: true });
    assert.match(html, /couldn’t check your FAME approval/);
    assert.match(html, /Retry approval check/);
    assert.doesNotMatch(html, /has permission|your FAME is at risk/);
  });
});
