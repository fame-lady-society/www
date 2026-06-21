import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FAME, NATIVE_ETH, USDC, WETH, tokenForAddress } from "../../tokens";
import { solveFameSwapAmountAsync } from "../amountSolver";
import { famePoolEdges } from "../poolUniverse";
import { DEFAULT_FAME_SWAP_SLIPPAGE_BPS } from "../slippage";
import {
  BASE_SLIPSTREAM_QUOTER_V2,
  BASE_UNISWAP_V3_QUOTER_V2,
  BASE_UNISWAP_V4_QUOTER,
  createLiveLiquidityQuoteAdapter,
  type FameLiveQuoteClient,
} from "./liveAdapters";

const routerAddress = "0x0000000000000000000000000000000000000009";
const recipient = "0x0000000000000000000000000000000000000abc";
const deadline = 1_800_000_000n;
const Q96 = 79_228_162_514_264_337_593_543_950_336n;

function token(address: typeof FAME | typeof USDC | typeof NATIVE_ETH) {
  const result = tokenForAddress(address);
  assert.ok(result);
  return result;
}

describe("FAME live liquidity quote adapter", () => {
  it("quotes native WETH wrap legs without pool RPC reads", async () => {
    const edge = famePoolEdges().find(
      (candidate) =>
        candidate.poolId === "native-wrap-weth" &&
        candidate.tokenIn.toLowerCase() === NATIVE_ETH.toLowerCase(),
    );
    assert.ok(edge);
    let reads = 0;
    const adapter = await createLiveLiquidityQuoteAdapter({
      client: {
        async readContract() {
          reads += 1;
          throw new Error("native wrap should not read pool state");
        },
      },
      chainId: 8453,
      blockNumber: 45_884_844n,
    });

    const quote = await adapter.quoteEdge({
      edge,
      amountIn: 123n,
    });

    assert.equal(quote.status, "quoted");
    if (quote.status === "quoted") {
      assert.equal(quote.amountOut, 123n);
      assert.equal(quote.fee.status, "available");
      assert.equal(
        quote.protocolEvidence?.marketImpact.status,
        "not_applicable",
      );
    }
    assert.equal(reads, 0);
  });

  it("quotes a $5 USDC route from liquidity evidence without hard capacity caps", async () => {
    const client: FameLiveQuoteClient = {
      async readContract(request) {
        if (request.functionName === "getReserves") {
          return [
            1_000_000_000_000_000_000_000n,
            2_000_000_000_000_000_000_000n,
            0,
          ];
        }
        if (request.functionName !== "getAmountOut") {
          throw new Error(`Unexpected read ${request.functionName}.`);
        }

        const amountIn = request.args?.[0];
        assert.equal(typeof amountIn, "bigint");
        return (amountIn as bigint) * 2n;
      },
    };
    const adapter = await createLiveLiquidityQuoteAdapter({
      client,
      chainId: 8453,
      blockNumber: 45_884_844n,
    });

    const result = await solveFameSwapAmountAsync({
      tokenIn: token(USDC),
      tokenOut: token(FAME),
      amountIn: 5_000_000n,
      routerAddress,
      recipient,
      deadline,
      feePpm: 2_222n,
      slippageBps: DEFAULT_FAME_SWAP_SLIPPAGE_BPS,
      adapter,
    });

    assert.equal(result.status, "ready");
    if (result.status === "ready") {
      assert.equal(result.plan.quoteContext?.source, "live");
      assert.equal(result.plan.quoteContext?.blockNumber, 45_884_844n);
      assert.equal(
        result.rejectedCandidates.some(
          (candidate) => candidate.reason === "amount_exceeds_capacity",
        ),
        false,
      );
      assert.ok(
        result.plan.legQuotes.every((quote) =>
          /live .* pool getAmountOut/.test(quote.evidence),
        ),
      );
    }
  });

  it("fails a slow live read with an adapter diagnostic", async () => {
    const edge = famePoolEdges().find(
      (candidate) => candidate.poolId === "scale-equalizer-usdc-frxusd",
    );
    assert.ok(edge);
    const adapter = await createLiveLiquidityQuoteAdapter({
      client: {
        readContract: () => new Promise(() => {}),
      },
      chainId: 8453,
      blockNumber: 45_884_844n,
      readTimeoutMs: 1,
    });

    const quote = await adapter.quoteEdge({
      edge,
      amountIn: 5_000_000n,
    });

    assert.equal(quote.status, "failed");
    if (quote.status === "failed") {
      assert.equal(quote.reason, "adapter_failure");
      assert.match(quote.message, /timed out/);
    }
  });

  it("fails closed when block context cannot be captured", async () => {
    const edge = famePoolEdges().find(
      (candidate) => candidate.poolId === "scale-equalizer-usdc-frxusd",
    );
    assert.ok(edge);
    const adapter = await createLiveLiquidityQuoteAdapter({
      client: {
        getBlockNumber: () => new Promise(() => {}),
        async readContract() {
          throw new Error("should not read without block context");
        },
      },
      chainId: 8453,
      readTimeoutMs: 1,
    });

    const quote = await adapter.quoteEdge({
      edge,
      amountIn: 5_000_000n,
    });

    assert.equal(quote.status, "failed");
    if (quote.status === "failed") {
      assert.equal(quote.reason, "adapter_failure");
      assert.match(quote.message, /block context failed/);
    }
  });

  it("redacts RPC URLs from block context failures", async () => {
    const edge = famePoolEdges().find(
      (candidate) => candidate.poolId === "scale-equalizer-usdc-frxusd",
    );
    assert.ok(edge);
    const adapter = await createLiveLiquidityQuoteAdapter({
      client: {
        async getBlockNumber() {
          throw new Error(
            [
              "HTTP request failed.",
              "URL: https://example.invalid/base/secret-token",
              'Request body: {"method":"eth_blockNumber"}',
            ].join("\n"),
          );
        },
        async readContract() {
          throw new Error("should not read without block context");
        },
      },
      chainId: 8453,
      readTimeoutMs: 1,
    });

    const quote = await adapter.quoteEdge({
      edge,
      amountIn: 5_000_000n,
    });

    assert.equal(quote.status, "failed");
    if (quote.status === "failed") {
      assert.equal(quote.reason, "adapter_failure");
      assert.equal(
        quote.message,
        "Live quote block context failed: HTTP request failed.",
      );
      assert.doesNotMatch(quote.message, /https?:\/\//);
      assert.doesNotMatch(quote.message, /secret-token|Request body/);
    }
  });

  it("quotes volatile Solidly legs with reserve-based price impact", async () => {
    const edge = famePoolEdges().find(
      (candidate) => candidate.poolId === "scale-equalizer-weth-fame",
    );
    assert.ok(edge);
    if (edge.pool.venue !== "solidly" || edge.pool.stable) {
      throw new Error("Expected volatile Solidly edge.");
    }
    const pool = edge.pool;
    const adapter = await createLiveLiquidityQuoteAdapter({
      client: {
        async readContract(request) {
          assert.equal(request.address, pool.pool);
          assert.equal(request.blockNumber, 45_884_844n);
          if (request.functionName === "getAmountOut") {
            assert.deepEqual(request.args, [12_345n, edge.tokenIn]);
            return 67_890n;
          }
          if (request.functionName === "getReserves") {
            return [1_000_000n, 10_000_000n, 0];
          }
          throw new Error(`Unexpected read ${request.functionName}.`);
        },
      },
      chainId: 8453,
      blockNumber: 45_884_844n,
    });

    const quote = await adapter.quoteEdge({ edge, amountIn: 12_345n });

    assert.equal(quote.status, "quoted");
    if (quote.status === "quoted") {
      assert.equal(quote.amountOut, 67_890n);
      assert.match(quote.evidence, /pool getAmountOut/);
      assert.equal(quote.priceImpact?.method, "constant-product-reserves");
      assert.notEqual(quote.priceImpact.postSwapPriceX18, null);
    }
  });

  it("reuses request-scoped live state reads across quote amounts", async () => {
    const edge = famePoolEdges().find(
      (candidate) => candidate.poolId === "scale-equalizer-weth-fame",
    );
    assert.ok(edge);
    if (edge.pool.venue !== "solidly" || edge.pool.stable) {
      throw new Error("Expected volatile Solidly edge.");
    }
    const pool = edge.pool;
    let reserveReads = 0;
    let quoteReads = 0;

    const adapter = await createLiveLiquidityQuoteAdapter({
      client: {
        async readContract(request) {
          assert.equal(request.address, pool.pool);
          if (request.functionName === "getAmountOut") {
            quoteReads += 1;
            const amountIn = request.args?.[0];
            assert.equal(typeof amountIn, "bigint");
            return (amountIn as bigint) * 2n;
          }
          if (request.functionName === "getReserves") {
            reserveReads += 1;
            return [1_000_000n, 10_000_000n, 0];
          }
          throw new Error(`Unexpected read ${request.functionName}.`);
        },
      },
      chainId: 8453,
      blockNumber: 45_884_844n,
    });

    const first = await adapter.quoteEdge({ edge, amountIn: 12_345n });
    const second = await adapter.quoteEdge({ edge, amountIn: 67_890n });

    assert.equal(first.status, "quoted");
    assert.equal(second.status, "quoted");
    assert.equal(quoteReads, 2);
    assert.equal(reserveReads, 1);
  });

  it("does not invent reserve impact for stable Solidly legs", async () => {
    const edge = famePoolEdges().find(
      (candidate) => candidate.poolId === "scale-equalizer-usdc-frxusd",
    );
    assert.ok(edge);
    if (edge.pool.venue !== "solidly" || !edge.pool.stable) {
      throw new Error("Expected stable Solidly edge.");
    }
    const pool = edge.pool;

    const adapter = await createLiveLiquidityQuoteAdapter({
      client: {
        async readContract(request) {
          assert.equal(request.address, pool.pool);
          if (request.functionName !== "getAmountOut") {
            throw new Error(`Unexpected read ${request.functionName}.`);
          }
          return 67_890n;
        },
      },
      chainId: 8453,
      blockNumber: 45_884_844n,
    });

    const quote = await adapter.quoteEdge({ edge, amountIn: 12_345n });

    assert.equal(quote.status, "quoted");
    if (quote.status === "quoted") {
      assert.equal(quote.priceImpact, undefined);
    }
  });

  it("quotes Aerodrome V2 legs through pool getAmountOut with Aerodrome diagnostics", async () => {
    const edge = famePoolEdges().find(
      (candidate) =>
        candidate.poolId === "aerodrome-v2-usdc-weth" &&
        candidate.tokenIn.toLowerCase() === USDC.toLowerCase(),
    );
    assert.ok(edge);
    if (edge.pool.venue !== "aerodrome-v2" || edge.pool.stable) {
      throw new Error("Expected volatile Aerodrome V2 edge.");
    }
    assert.equal(edge.tokenOut, WETH);
    const pool = edge.pool;

    const adapter = await createLiveLiquidityQuoteAdapter({
      client: {
        async readContract(request) {
          assert.equal(request.address, pool.pool);
          assert.equal(request.blockNumber, 45_884_844n);
          if (request.functionName === "getAmountOut") {
            assert.deepEqual(request.args, [12_345n, edge.tokenIn]);
            return 67_890n;
          }
          if (request.functionName === "getReserves") {
            return [10_000_000n, 1_000_000n, 0];
          }
          throw new Error(`Unexpected read ${request.functionName}.`);
        },
      },
      chainId: 8453,
      blockNumber: 45_884_844n,
    });

    const quote = await adapter.quoteEdge({ edge, amountIn: 12_345n });

    assert.equal(quote.status, "quoted");
    if (quote.status === "quoted") {
      assert.equal(quote.amountOut, 67_890n);
      assert.match(quote.evidence, /Aerodrome V2 pool getAmountOut/);
      assert.equal(quote.priceImpact?.method, "constant-product-reserves");
      assert.equal(quote.protocolEvidence?.quote.status, "available");
      assert.match(
        quote.protocolEvidence?.activeLiquidity.reason ?? "",
        /Aerodrome V2 volatile pool/,
      );
    }
  });

  it("quotes Slipstream legs through the bounded live quoter", async () => {
    const edge = famePoolEdges().find(
      (candidate) => candidate.poolId === "slipstream-basedflick-fame",
    );
    assert.ok(edge);
    if (edge.pool.venue !== "aerodrome-slipstream") {
      throw new Error("Expected Slipstream edge.");
    }
    const pool = edge.pool;

    const adapter = await createLiveLiquidityQuoteAdapter({
      client: {
        async readContract(request) {
          if (request.functionName === "slot0") {
            assert.equal(request.address, pool.pool);
            return [Q96, 0, 0, 0, 0, true];
          }
          if (request.functionName === "liquidity") {
            assert.equal(request.address, pool.pool);
            assert.equal(request.blockNumber, 45_884_844n);
            return 123_456n;
          }
          assert.equal(request.address, BASE_SLIPSTREAM_QUOTER_V2);
          assert.equal(request.functionName, "quoteExactInputSingle");
          const [params] = request.args ?? [];
          assert.deepEqual(params, {
            tokenIn: edge.tokenIn,
            tokenOut: edge.tokenOut,
            amountIn: 12_345n,
            tickSpacing: 2000,
            sqrtPriceLimitX96: 0n,
          });
          assert.equal(request.blockNumber, 45_884_844n);
          return [67_890n, 1n, 2, 3n];
        },
      },
      chainId: 8453,
      blockNumber: 45_884_844n,
    });

    const quote = await adapter.quoteEdge({ edge, amountIn: 12_345n });

    assert.equal(quote.status, "quoted");
    if (quote.status === "quoted") {
      assert.equal(quote.amountOut, 67_890n);
      assert.match(quote.evidence, /Slipstream quoter/);
      assert.equal(quote.context?.source, "live");
      assert.equal(quote.priceImpact?.method, "quoter-price-after");
      assert.notEqual(quote.priceImpact.postSwapPriceX18, null);
      assert.equal(quote.protocolEvidence?.quote.status, "available");
      assert.equal(quote.protocolEvidence?.postPrice.status, "available");
      assert.equal(quote.protocolEvidence?.activeLiquidity.status, "available");
      assert.equal(quote.protocolEvidence?.activeLiquidity.value, "123456");
    }
  });

  it("does not expose depegged msUSD or msETH pool legs", () => {
    const depeggedPoolIds = new Set([
      "slipstream-msusd-usdc-a",
      "slipstream-weth-mseth",
      "slipstream2-msusd-mseth",
      "slipstream2-msusd-usdc-c",
    ]);

    assert.deepEqual(
      famePoolEdges()
        .map((edge) => edge.poolId)
        .filter((poolId) => depeggedPoolIds.has(poolId)),
      [],
    );
  });

  it("quotes Uniswap V3 legs through the Base QuoterV2", async () => {
    const edge = famePoolEdges().find(
      (candidate) => candidate.poolId === "uniswap-v3-zora-usdc",
    );
    assert.ok(edge);
    if (edge.pool.venue !== "uniswap-v3") {
      throw new Error("Expected Uniswap V3 edge.");
    }
    const pool = edge.pool;

    const adapter = await createLiveLiquidityQuoteAdapter({
      client: {
        async readContract(request) {
          if (request.functionName === "slot0") {
            assert.equal(request.address, pool.pool);
            return [Q96, 0, 0, 0, 0, 0, true];
          }
          assert.equal(request.address, BASE_UNISWAP_V3_QUOTER_V2);
          assert.equal(request.functionName, "quoteExactInputSingle");
          const [params] = request.args ?? [];
          assert.deepEqual(params, {
            tokenIn: edge.tokenIn,
            tokenOut: edge.tokenOut,
            amountIn: 12_345n,
            fee: 3000,
            sqrtPriceLimitX96: 0n,
          });
          return { amountOut: 67_890n };
        },
      },
      chainId: 8453,
      blockNumber: 45_884_844n,
    });

    const quote = await adapter.quoteEdge({ edge, amountIn: 12_345n });

    assert.equal(quote.status, "quoted");
    if (quote.status === "quoted") {
      assert.equal(quote.amountOut, 67_890n);
      assert.match(quote.evidence, /Uniswap V3 quoter/);
      assert.equal(quote.priceImpact?.method, "concentrated-liquidity-slot0");
      assert.equal(quote.protocolEvidence?.quote.status, "available");
      assert.equal(quote.protocolEvidence?.prePrice.status, "available");
    }
  });

  it("quotes Uniswap V4 legs with pool key, direction, and hook data", async () => {
    const edge = famePoolEdges().find(
      (candidate) =>
        candidate.poolId === "uniswap-v4-zora-eth" &&
        candidate.tokenOut === NATIVE_ETH,
    );
    assert.ok(edge);
    if (edge.pool.venue !== "uniswap-v4") {
      throw new Error("Expected Uniswap V4 edge.");
    }
    const pool = edge.pool;

    const adapter = await createLiveLiquidityQuoteAdapter({
      client: {
        async readContract(request) {
          if (request.functionName === "getSlot0") {
            assert.equal(request.address, pool.stateView);
            assert.deepEqual(request.args, [pool.poolId]);
            return [Q96, 0, 0, 3000];
          }
          if (request.functionName === "getLiquidity") {
            assert.equal(request.address, pool.stateView);
            assert.deepEqual(request.args, [pool.poolId]);
            return 123_456n;
          }
          assert.equal(request.address, BASE_UNISWAP_V4_QUOTER);
          assert.equal(request.functionName, "quoteExactInputSingle");
          const [params] = request.args ?? [];
          assert.deepEqual(params, {
            poolKey: {
              currency0: NATIVE_ETH,
              currency1: edge.tokenIn,
              fee: 3000,
              tickSpacing: 60,
              hooks: "0x0000000000000000000000000000000000000000",
            },
            zeroForOne: false,
            exactAmount: 12_345n,
            hookData: "0x",
          });
          return [67_890n, 3n];
        },
      },
      chainId: 8453,
      blockNumber: 45_884_844n,
    });

    const quote = await adapter.quoteEdge({ edge, amountIn: 12_345n });

    assert.equal(quote.status, "quoted");
    if (quote.status === "quoted") {
      assert.equal(quote.amountOut, 67_890n);
      assert.match(quote.evidence, /Uniswap V4 quoter/);
      assert.equal(quote.priceImpact?.method, "concentrated-liquidity-slot0");
      assert.equal(quote.priceImpact.postSwapPriceX18, null);
      assert.equal(quote.protocolEvidence?.quote.status, "available");
      assert.equal(quote.protocolEvidence?.prePrice.status, "available");
      assert.equal(quote.protocolEvidence?.postPrice.status, "unavailable");
      assert.equal(quote.protocolEvidence?.activeLiquidity.status, "available");
      assert.equal(quote.protocolEvidence?.activeLiquidity.value, "123456");
    }
  });

  it("keeps V4 output quotes when active liquidity evidence is unavailable", async () => {
    const edge = famePoolEdges().find(
      (candidate) =>
        candidate.poolId === "uniswap-v4-zora-eth" &&
        candidate.tokenOut === NATIVE_ETH,
    );
    assert.ok(edge);
    if (edge.pool.venue !== "uniswap-v4") {
      throw new Error("Expected Uniswap V4 edge.");
    }
    const pool = edge.pool;

    const adapter = await createLiveLiquidityQuoteAdapter({
      client: {
        async readContract(request) {
          if (request.functionName === "getSlot0") {
            return [Q96, 0, 0, 3000];
          }
          if (request.functionName === "getLiquidity") {
            throw new Error(
              "StateView failed.\nURL: https://example.invalid/secret",
            );
          }
          assert.equal(request.address, BASE_UNISWAP_V4_QUOTER);
          return [67_890n, 3n];
        },
      },
      chainId: 8453,
      blockNumber: 45_884_844n,
    });

    const quote = await adapter.quoteEdge({ edge, amountIn: 12_345n });

    assert.equal(quote.status, "quoted");
    if (quote.status === "quoted") {
      assert.equal(quote.amountOut, 67_890n);
      assert.equal(
        quote.protocolEvidence?.activeLiquidity.status,
        "unavailable",
      );
      assert.match(
        quote.protocolEvidence?.activeLiquidity.reason ?? "",
        /StateView failed/,
      );
      assert.doesNotMatch(
        quote.protocolEvidence?.activeLiquidity.reason ?? "",
        /https?:\/\//,
      );
    }
  });

  it("redacts verbose viem call diagnostics from adapter failures", async () => {
    const edge = famePoolEdges().find(
      (candidate) => candidate.poolId === "uniswap-v4-basedflick-zora",
    );
    assert.ok(edge);

    const adapter = await createLiveLiquidityQuoteAdapter({
      client: {
        async readContract() {
          throw new Error(
            [
              "Execution reverted.",
              "Raw Call Arguments:",
              "  data: 0x" + "a".repeat(192),
              "Docs: https://example.invalid",
            ].join("\n"),
          );
        },
      },
      chainId: 8453,
      blockNumber: 45_884_844n,
    });

    const quote = await adapter.quoteEdge({ edge, amountIn: 12_345n });

    assert.equal(quote.status, "failed");
    if (quote.status === "failed") {
      assert.equal(quote.reason, "adapter_failure");
      assert.equal(
        quote.message,
        "uniswap-v4-basedflick-zora live quote failed: Execution reverted.",
      );
      assert.doesNotMatch(quote.message, /Raw Call Arguments|0xaaa|https:\/\//);
    }
  });
});
