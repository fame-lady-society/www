import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Address, Hash } from "viem";
import { BASE_SEPOLIA_TEST_GALLERY_CONFIG } from "../config/baseSepoliaTestGallery";
import {
  freezeGalleryBuyerTerms,
  resolveGalleryFulfillment,
  type GalleryFulfillmentReadSource,
  type GalleryFulfillmentTokenState,
} from "./resolveFulfillment";

const config = BASE_SEPOLIA_TEST_GALLERY_CONFIG;
const marketplace = config.addresses.gallery;
const buyer = "0x1111111111111111111111111111111111111111" as Address;
const elsewhere = "0x2222222222222222222222222222222222222222" as Address;
const zero = "0x0000000000000000000000000000000000000000" as Address;
const selectedArtwork =
  "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" as Hash;
const otherArtwork =
  "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" as Hash;

function tokenState(
  overrides: Partial<GalleryFulfillmentTokenState> = {},
): GalleryFulfillmentTokenState {
  return {
    owner: zero,
    artworkHash: selectedArtwork,
    inArtPool: false,
    inMintPool: false,
    inBurnPool: false,
    ...overrides,
  };
}

function mockSource({
  premium = 25n,
  tokens = new Map<bigint, GalleryFulfillmentTokenState>(),
  shellOwners = new Map<bigint, Address>(),
}: {
  premium?: bigint;
  tokens?: ReadonlyMap<bigint, GalleryFulfillmentTokenState>;
  shellOwners?: ReadonlyMap<bigint, Address>;
} = {}) {
  const calls: string[] = [];
  let nextBlock = 500n;
  const source: GalleryFulfillmentReadSource = {
    async captureBlockNumber() {
      calls.push("captureBlockNumber");
      const block = nextBlock;
      nextBlock += 1n;
      return block;
    },
    async readPremium(blockNumber) {
      calls.push(`premium:${blockNumber}`);
      return premium;
    },
    async readTokenState(tokenId, blockNumber) {
      calls.push(`token:${tokenId}:${blockNumber}`);
      const state = tokens.get(tokenId);
      if (!state) throw new Error(`Missing token ${tokenId}`);
      return state;
    },
    async readShellOwner(tokenId, blockNumber) {
      calls.push(`shell:${tokenId}:${blockNumber}`);
      return shellOwners.get(tokenId) ?? zero;
    },
  };
  return { source, calls };
}

function frozenTerms(
  displayedPremium = 25n,
  runtimeMarketplace: Address = marketplace,
) {
  return freezeGalleryBuyerTerms(
    {
      account: buyer,
      selectedTarget: {
        targetId: "pool:mint:7",
        tokenId: 7n,
      },
      artworkHash: selectedArtwork,
      unit: 1_000n,
      displayedPremium,
    },
    {
      chainId: config.chainId,
      marketplace: runtimeMarketplace,
    },
  );
}

describe("gallery fulfillment resolver", () => {
  it("freezes buyer-visible consent separately from execution routing", () => {
    const terms = frozenTerms();

    assert.deepEqual(terms, {
      chainId: config.chainId,
      account: buyer,
      recipient: buyer,
      selectedTarget: {
        targetId: "pool:mint:7",
        tokenId: 7n,
      },
      artworkHash: selectedArtwork,
      unit: 1_000n,
      maxPremium: 25n,
      maximumSpend: 1_025n,
      allowanceTarget: marketplace,
    });
    assert.equal(Object.isFrozen(terms), true);
    assert.equal(Object.isFrozen(terms.selectedTarget), true);
  });

  it("prefers a fresh held route", async () => {
    const { source } = mockSource({
      tokens: new Map([[7n, tokenState({ owner: marketplace })]]),
    });

    const resolved = await resolveGalleryFulfillment({
      terms: frozenTerms(),
      candidateTokenIds: [7n],
      knownShellTokenIds: [19n],
      source,
    });

    assert.deepEqual(resolved, { kind: "held", shellId: 7n });
  });

  for (const [poolKind, membership] of [
    ["mint", { inMintPool: true }],
    ["burn", { inBurnPool: true }],
  ] as const) {
    it(`resolves a fresh ${poolKind} pool route through a verified shell`, async () => {
      const { source } = mockSource({
        tokens: new Map([[7n, tokenState(membership)]]),
        shellOwners: new Map([[19n, marketplace]]),
      });

      const resolved = await resolveGalleryFulfillment({
        terms: frozenTerms(),
        candidateTokenIds: [7n],
        knownShellTokenIds: [19n],
        source,
      });

      assert.deepEqual(resolved, {
        kind: "pool",
        poolKind,
        shellId: 19n,
        sourceId: 7n,
      });
    });
  }

  it("verifies pool shells against the frozen runtime marketplace", async () => {
    const runtimeMarketplace =
      "0x3333333333333333333333333333333333333333" as Address;
    const { source } = mockSource({
      tokens: new Map([[7n, tokenState({ inMintPool: true })]]),
      shellOwners: new Map([[19n, runtimeMarketplace]]),
    });

    const resolved = await resolveGalleryFulfillment({
      terms: frozenTerms(25n, runtimeMarketplace),
      candidateTokenIds: [7n],
      knownShellTokenIds: [19n],
      source,
    });

    assert.deepEqual(resolved, {
      kind: "pool",
      poolKind: "mint",
      shellId: 19n,
      sourceId: 7n,
    });
  });

  it("allows held-to-pool and pool-to-held route changes without changing consent", async () => {
    const terms = frozenTerms();
    const heldToPool = mockSource({
      tokens: new Map([[7n, tokenState({ inMintPool: true })]]),
      shellOwners: new Map([[19n, marketplace]]),
    });
    const poolToHeld = mockSource({
      tokens: new Map([[7n, tokenState({ owner: marketplace })]]),
    });

    const first = await resolveGalleryFulfillment({
      terms,
      candidateTokenIds: [7n],
      knownShellTokenIds: [19n],
      source: heldToPool.source,
    });
    const second = await resolveGalleryFulfillment({
      terms,
      candidateTokenIds: [7n],
      knownShellTokenIds: [19n],
      source: poolToHeld.source,
    });

    assert.equal(first.kind, "pool");
    assert.equal(second.kind, "held");
  });

  it("tries another known shell and permits one explicit bounded refresh after exhaustion", async () => {
    const { source, calls } = mockSource({
      tokens: new Map([
        [7n, tokenState({ inBurnPool: true })],
        [20n, tokenState({ owner: marketplace, artworkHash: otherArtwork })],
      ]),
      shellOwners: new Map([
        [19n, elsewhere],
        [20n, marketplace],
      ]),
    });
    let refreshes = 0;

    const resolved = await resolveGalleryFulfillment({
      terms: frozenTerms(),
      candidateTokenIds: [7n],
      knownShellTokenIds: [18n, 19n],
      source,
      refreshShellTokenIds: async () => {
        refreshes += 1;
        return [20n];
      },
    });

    assert.deepEqual(resolved, {
      kind: "pool",
      poolKind: "burn",
      shellId: 20n,
      sourceId: 7n,
    });
    assert.equal(refreshes, 1);
    assert.equal(
      calls.filter((call) => call === "captureBlockNumber").length,
      2,
    );
  });

  it("accepts a lower current premium but rejects one above the frozen ceiling", async () => {
    const lower = mockSource({
      premium: 24n,
      tokens: new Map([[7n, tokenState({ owner: marketplace })]]),
    });
    const higher = mockSource({
      premium: 26n,
      tokens: new Map([[7n, tokenState({ owner: marketplace })]]),
    });

    const resolved = await resolveGalleryFulfillment({
      terms: frozenTerms(),
      candidateTokenIds: [7n],
      knownShellTokenIds: [],
      source: lower.source,
    });
    assert.deepEqual(resolved, { kind: "held", shellId: 7n });

    await assert.rejects(
      resolveGalleryFulfillment({
        terms: frozenTerms(),
        candidateTokenIds: [7n],
        knownShellTokenIds: [],
        source: higher.source,
      }),
      /price changed/i,
    );
  });

  for (const testCase of [
    {
      name: "changed artwork",
      state: tokenState({ artworkHash: otherArtwork, inMintPool: true }),
      message: /no longer available/i,
    },
    {
      name: "Art Pool membership",
      state: tokenState({ inArtPool: true, inMintPool: true }),
      message: /not eligible/i,
    },
    {
      name: "ambiguous Mint and Burn membership",
      state: tokenState({ inMintPool: true, inBurnPool: true }),
      message: /not eligible/i,
    },
    {
      name: "ineligible source",
      state: tokenState(),
      message: /not eligible/i,
    },
  ]) {
    it(`produces no request for ${testCase.name}`, async () => {
      const { source } = mockSource({
        tokens: new Map([[7n, testCase.state]]),
        shellOwners: new Map([[19n, marketplace]]),
      });

      await assert.rejects(
        resolveGalleryFulfillment({
          terms: frozenTerms(),
          candidateTokenIds: [7n],
          knownShellTokenIds: [19n],
          source,
        }),
        testCase.message,
      );
    });
  }

  it("uses any fresh canonical candidate carrying the selected artwork hash", async () => {
    const { source } = mockSource({
      tokens: new Map([
        [7n, tokenState({ artworkHash: otherArtwork })],
        [8n, tokenState({ owner: marketplace })],
      ]),
    });

    const resolved = await resolveGalleryFulfillment({
      terms: frozenTerms(),
      candidateTokenIds: [7n, 8n],
      knownShellTokenIds: [],
      source,
    });

    assert.deepEqual(resolved, { kind: "held", shellId: 8n });
  });

  it("uses explicit recovery to discover a new held route for the same artwork", async () => {
    const { source } = mockSource({
      tokens: new Map([
        [7n, tokenState({ artworkHash: otherArtwork })],
        [8n, tokenState({ owner: marketplace })],
      ]),
    });
    let refreshes = 0;

    const resolved = await resolveGalleryFulfillment({
      terms: frozenTerms(),
      candidateTokenIds: [7n],
      knownShellTokenIds: [],
      source,
      refreshShellTokenIds: async () => {
        refreshes += 1;
        return [8n];
      },
    });

    assert.deepEqual(resolved, { kind: "held", shellId: 8n });
    assert.equal(refreshes, 1);
  });

  it("produces no request when no known or refreshed shell remains", async () => {
    const { source } = mockSource({
      tokens: new Map([[7n, tokenState({ inMintPool: true })]]),
      shellOwners: new Map([[19n, elsewhere]]),
    });
    let refreshes = 0;

    await assert.rejects(
      resolveGalleryFulfillment({
        terms: frozenTerms(),
        candidateTokenIds: [7n],
        knownShellTokenIds: [19n],
        source,
        refreshShellTokenIds: async () => {
          refreshes += 1;
          return [];
        },
      }),
      /no available delivery shell/i,
    );
    assert.equal(refreshes, 1);
  });

  it("lets canonical read failures flow through unchanged", async () => {
    const readFailure = new Error("wagmi read failed");
    const source: GalleryFulfillmentReadSource = {
      async captureBlockNumber() {
        return 500n;
      },
      async readPremium() {
        return 25n;
      },
      async readTokenState() {
        throw readFailure;
      },
      async readShellOwner() {
        return marketplace;
      },
    };

    await assert.rejects(
      resolveGalleryFulfillment({
        terms: frozenTerms(),
        candidateTokenIds: [7n],
        knownShellTokenIds: [19n],
        source,
      }),
      (error) => error === readFailure,
    );
  });
});
