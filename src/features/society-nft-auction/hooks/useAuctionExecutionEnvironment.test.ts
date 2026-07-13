import assert from "node:assert/strict";
import test from "node:test";
import { encodeFunctionResult } from "viem";
import { societyNftAuctionAbi } from "../../../wagmi";
import {
  evaluateAuctionExecutionIdentity,
  readWalletAuctionIdentity,
  resolveAuctionExecutionEnvironment,
} from "./useAuctionExecutionEnvironment";

const auction = "0x6536A328419785212BD4DA43F4E5155af60dB7D2";
const societyNft = "0xBB5ED04dD7B207592429eb8d599d103CCad646c4";
const otherCollection = "0x00000000000000000000000000000000000000AA";

test("fails closed when the app fork and wallet provider do not share the auction", () => {
  const identity = evaluateAuctionExecutionIdentity({
    code: "0x",
    societyNft,
    expectedCode: "0x6001600055",
    expectedSocietyNft: societyNft,
  });

  assert.deepEqual(identity, {
    compatible: false,
    reason: "missing_code",
    message: "Your wallet provider cannot find this auction contract.",
  });
});

test("fails closed when the wallet contract points at another collection", () => {
  const identity = evaluateAuctionExecutionIdentity({
    code: "0x6001600055",
    societyNft: otherCollection,
    expectedCode: "0x6001600055",
    expectedSocietyNft: societyNft,
  });

  assert.equal(identity.compatible, false);
  assert.equal(identity.reason, "collection_mismatch");
});

test("accepts nonempty code with the expected Society NFT", () => {
  const identity = evaluateAuctionExecutionIdentity({
    code: "0x6001600055",
    societyNft,
    expectedCode: "0x6001600055",
    expectedSocietyNft: societyNft.toLowerCase(),
  });

  assert.deepEqual(identity, { compatible: true });
});

test("fails closed when runtime bytecode differs", () => {
  const identity = evaluateAuctionExecutionIdentity({
    code: "0x6002600055",
    societyNft,
    expectedCode: "0x6001600055",
    expectedSocietyNft: societyNft,
  });

  assert.equal(identity.compatible, false);
  assert.equal(identity.reason, "runtime_mismatch");
});

test("reads code and SOCIETY_NFT through the wallet provider", async () => {
  const calls: Array<{ method: string; params?: readonly unknown[] }> = [];
  const request = async (input: {
    method: string;
    params?: readonly unknown[];
  }) => {
    calls.push(input);
    if (input.method === "eth_getCode") return "0x6001600055";
    return encodeFunctionResult({
      abi: societyNftAuctionAbi,
      functionName: "SOCIETY_NFT",
      result: societyNft,
    });
  };

  const identity = await readWalletAuctionIdentity(request, auction);

  assert.equal(identity.code, "0x6001600055");
  assert.equal(identity.societyNft, societyNft);
  assert.deepEqual(
    calls.map((call) => call.method),
    ["eth_getCode", "eth_call"],
  );
  assert.deepEqual(calls[0].params, [auction, "latest"]);
});

test("does not call an empty wallet address as though it were the auction", async () => {
  const calls: string[] = [];
  const identity = await readWalletAuctionIdentity(async ({ method }) => {
    calls.push(method);
    return "0x";
  }, auction);

  assert.deepEqual(identity, { code: "0x", societyNft: null });
  assert.deepEqual(calls, ["eth_getCode"]);
});

test("wallet identity verification times out instead of hanging", async () => {
  await assert.rejects(
    readWalletAuctionIdentity(
      () => new Promise<never>(() => undefined),
      auction,
      1,
    ),
    /timed out/i,
  );
});

test("disconnected and wrong-chain states expose recovery without preflight", () => {
  assert.equal(
    resolveAuctionExecutionEnvironment({
      isConnected: false,
      connectedChainId: undefined,
      hasExpectedIdentity: true,
      identityPending: false,
      identity: null,
      identityError: null,
    }).status,
    "disconnected",
  );
  assert.equal(
    resolveAuctionExecutionEnvironment({
      isConnected: true,
      connectedChainId: 1,
      hasExpectedIdentity: true,
      identityPending: false,
      identity: null,
      identityError: null,
    }).status,
    "wrong_chain",
  );
});

test("wallet provider failures are retryable environment errors", () => {
  const result = resolveAuctionExecutionEnvironment({
    isConnected: true,
    connectedChainId: 8453,
    hasExpectedIdentity: true,
    identityPending: false,
    identity: null,
    identityError: new Error("RPC unavailable"),
  });

  assert.equal(result.status, "error");
  assert.equal(result.canExecute, false);
});
