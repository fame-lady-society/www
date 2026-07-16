import assert from "node:assert/strict";
import test from "node:test";
import type { Address, Hex } from "viem";
import {
  bytecodeQueryReadState,
  contractQueryReadState,
  hasNonEmptyRuntimeCode,
  postFixSnapshotForBalances,
  projectSocietyNftReadiness,
  projectVerifiedRepair,
  skipNftForGenerationEnabled,
  type ReadState,
} from "./state";

const ACCOUNT = "0x1111111111111111111111111111111111111111" as Address;
const OTHER_ACCOUNT = "0x2222222222222222222222222222222222222222" as Address;

function success<T>(data: T): ReadState<T> {
  return { status: "success", data };
}

test("query snapshots preserve authoritative empty bytecode and false values", () => {
  assert.deepEqual(
    bytecodeQueryReadState(true, {
      data: undefined,
      isError: false,
      isSuccess: true,
    }),
    success("0x" as Hex),
  );
  assert.deepEqual(
    contractQueryReadState(true, {
      data: false,
      isError: false,
      isSuccess: true,
    }),
    success(false),
  );
});

test("deployed runtime code and EIP-7702 delegation code are non-empty", () => {
  const deployedCode = "0x6080604052" as Hex;
  const delegatedEoaCode =
    "0xef01001234567890123456789012345678901234567890" as Hex;

  assert.equal(hasNonEmptyRuntimeCode(deployedCode), true);
  assert.equal(hasNonEmptyRuntimeCode(delegatedEoaCode), true);
  assert.equal(hasNonEmptyRuntimeCode("0x"), false);
  assert.equal(hasNonEmptyRuntimeCode("0x000000"), false);
});

test("only authoritative non-empty code with skip mode enabled is affected", () => {
  const deployedCode = success("0x6080604052" as Hex);
  const delegatedEoaCode = success(
    "0xef01001234567890123456789012345678901234567890" as Hex,
  );

  assert.deepEqual(
    projectSocietyNftReadiness({ code: deployedCode, skipNft: success(true) }),
    { status: "affected" },
  );
  assert.deepEqual(
    projectSocietyNftReadiness({
      code: delegatedEoaCode,
      skipNft: success(true),
    }),
    { status: "affected" },
  );
  assert.deepEqual(
    projectSocietyNftReadiness({
      code: success("0x"),
      skipNft: success(true),
    }),
    { status: "unaffected" },
  );
  assert.deepEqual(
    projectSocietyNftReadiness({
      code: success("0x000000"),
      skipNft: success(true),
    }),
    { status: "unaffected" },
  );
  assert.deepEqual(
    projectSocietyNftReadiness({ code: deployedCode, skipNft: success(false) }),
    { status: "unaffected" },
  );
  assert.deepEqual(
    projectSocietyNftReadiness({
      code: success("0x"),
      skipNft: { status: "error" },
    }),
    { status: "unaffected" },
  );
  assert.deepEqual(
    projectSocietyNftReadiness({
      code: success("0x"),
      skipNft: { status: "loading" },
    }),
    { status: "unaffected" },
  );
});

test("partial, loading, failed, and disconnected reads remain non-authoritative", () => {
  const deployedCode = success("0x6080" as Hex);

  assert.deepEqual(
    projectSocietyNftReadiness({
      code: { status: "loading" },
      skipNft: success(true),
    }),
    { status: "checking" },
  );
  assert.deepEqual(
    projectSocietyNftReadiness({
      code: deployedCode,
      skipNft: { status: "loading" },
    }),
    { status: "checking" },
  );
  assert.deepEqual(
    projectSocietyNftReadiness({
      code: { status: "loading" },
      skipNft: success(false),
    }),
    { status: "checking" },
  );
  assert.deepEqual(
    projectSocietyNftReadiness({
      code: { status: "error" },
      skipNft: success(true),
    }),
    { status: "error" },
  );
  assert.deepEqual(
    projectSocietyNftReadiness({
      code: deployedCode,
      skipNft: { status: "error" },
    }),
    { status: "error" },
  );
  assert.deepEqual(
    projectSocietyNftReadiness({
      code: { status: "disconnected" },
      skipNft: { status: "disconnected" },
    }),
    { status: "disconnected" },
  );
});

test("a successful receipt without authoritative skip=false is never verified", () => {
  const baseInput = {
    receiptStatus: "success" as const,
    initiatingAccount: ACCOUNT,
    connectedAccount: ACCOUNT,
    balance: success(999_999n),
    unit: success(1_000_000n),
    nftBalance: success(0n),
  };

  assert.deepEqual(
    projectVerifiedRepair({ ...baseInput, skipNft: success(true) }),
    { status: "unresolved", reason: "skip_enabled" },
  );
  assert.deepEqual(
    projectVerifiedRepair({
      ...baseInput,
      skipNft: { status: "loading" },
    }),
    { status: "unresolved", reason: "readback" },
  );
  assert.deepEqual(
    projectVerifiedRepair({
      ...baseInput,
      skipNft: { status: "error" },
    }),
    { status: "error", reason: "readback" },
  );
  assert.deepEqual(
    projectVerifiedRepair({
      ...baseInput,
      connectedAccount: OTHER_ACCOUNT,
      skipNft: success(false),
    }),
    { status: "unresolved", reason: "account_changed" },
  );
});

test("reverted and failed receipts cannot produce verified readiness", () => {
  const readback = {
    initiatingAccount: ACCOUNT,
    connectedAccount: ACCOUNT,
    skipNft: success(false),
    balance: success(1_000_000n),
    unit: success(1_000_000n),
    nftBalance: success(0n),
  };

  assert.deepEqual(
    projectVerifiedRepair({ ...readback, receiptStatus: "reverted" }),
    { status: "error", reason: "receipt_reverted" },
  );
  assert.deepEqual(
    projectVerifiedRepair({ ...readback, receiptStatus: "error" }),
    { status: "error", reason: "receipt" },
  );
  assert.deepEqual(
    projectVerifiedRepair({ ...readback, receiptStatus: "pending" }),
    { status: "unresolved", reason: "receipt" },
  );
});

test("generation controls map directly to the inverse skipNFT setting", () => {
  assert.equal(skipNftForGenerationEnabled(true), false);
  assert.equal(skipNftForGenerationEnabled(false), true);
});

test("post-fix snapshots offer reconciliation only for an NFT deficit", () => {
  assert.deepEqual(postFixSnapshotForBalances(999_999n, 1_000_000n, 0n), {
    branch: "future",
    eligibleNftCount: 0n,
    nftDeficit: 0n,
  });
  assert.deepEqual(postFixSnapshotForBalances(1_000_000n, 1_000_000n, 0n), {
    branch: "catch_up",
    eligibleNftCount: 1n,
    nftDeficit: 1n,
  });
  assert.deepEqual(postFixSnapshotForBalances(2_000_000n, 1_000_000n, 1n), {
    branch: "catch_up",
    eligibleNftCount: 2n,
    nftDeficit: 1n,
  });
  assert.deepEqual(postFixSnapshotForBalances(1_000_000n, 1_000_000n, 1n), {
    branch: "current",
    eligibleNftCount: 1n,
    nftDeficit: 0n,
  });
  assert.equal(postFixSnapshotForBalances(1_000_000n, 0n, 0n), null);
});

test("verified repair includes the branch from the same authoritative snapshot", () => {
  const baseInput = {
    receiptStatus: "success" as const,
    initiatingAccount: ACCOUNT,
    connectedAccount: ACCOUNT,
    skipNft: success(false),
    unit: success(1_000_000n),
    nftBalance: success(0n),
  };

  assert.deepEqual(
    projectVerifiedRepair({ ...baseInput, balance: success(999_999n) }),
    {
      status: "verified",
      branch: "future",
      balance: 999_999n,
      unit: 1_000_000n,
      nftBalance: 0n,
      eligibleNftCount: 0n,
      nftDeficit: 0n,
    },
  );
  assert.deepEqual(
    projectVerifiedRepair({ ...baseInput, balance: success(1_000_000n) }),
    {
      status: "verified",
      branch: "catch_up",
      balance: 1_000_000n,
      unit: 1_000_000n,
      nftBalance: 0n,
      eligibleNftCount: 1n,
      nftDeficit: 1n,
    },
  );
});
