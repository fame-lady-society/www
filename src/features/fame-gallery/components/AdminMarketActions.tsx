"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  decodeEventLog,
  isAddress,
  isAddressEqual,
  type Address,
  type Hex,
} from "viem";
import { usePublicClient } from "wagmi";
import { TransactionsModal } from "@/components/TransactionsModal";
import { displaySafeErrorMessage } from "@/features/fame-swap/solver/diagnostics";
import {
  closedLoopGallerySwapAbi,
  fameMirrorAbi,
} from "../../../wagmi";
import { BASE_SEPOLIA_TEST_GALLERY_CONFIG } from "../config/baseSepoliaTestGallery";
import {
  scanGalleryRecoveryInventory,
  type GalleryRecoveryScanResult,
} from "../discovery/recoveryScan";
import { formatTestAmount } from "../format";
import { useGalleryAdminAction } from "../hooks/useGalleryAdminAction";
import { useGalleryPoolState } from "../hooks/useGalleryPoolState";
import { useGalleryTokenState } from "../hooks/useGalleryTokenState";
import {
  decodeTestGalleryMetadata,
  type GalleryMetadataResult,
} from "../metadata/testMetadata";
import {
  galleryQueryKeys,
  invalidateGalleryDiscovery,
  invalidateGalleryToken,
} from "../queryKeys";
import {
  parseGalleryPremium,
  parseGalleryRendererSeed,
  parseGalleryTokenId,
  parseUnsignedTestAmount,
  type GalleryAdminCall,
  type GalleryAdminState,
} from "../transactions/adminAction";
import type {
  GalleryAuthority,
  GalleryGlobalState,
  GalleryHookProjection,
} from "../types";

const config = BASE_SEPOLIA_TEST_GALLERY_CONFIG;
const identity = {
  chainId: config.chainId,
  galleryAddress: config.addresses.gallery,
} as const;
const rendererAbi = [
  {
    type: "function",
    name: "tokenURI",
    stateMutability: "pure",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "string" }],
  },
] as const;

type RotationMode = "mint" | "burn" | "end";

export const PRIMARY_GALLERY_ADMIN_ACTIONS = [
  "list",
  "set_premium",
  "unlist",
  "rotate_mint",
  "rotate_burn",
  "rotate_end_of_mint",
  "withdraw_fees",
  "scan_all_888",
] as const;

function parsedTokenId(value: string) {
  try {
    return parseGalleryTokenId(value);
  } catch {
    return null;
  }
}

function ActionError({ message }: { message: string | null }) {
  return message ? <Alert severity="error">{message}</Alert> : null;
}

function MetadataPreview({
  metadata,
  seed,
}: {
  metadata: GalleryMetadataResult;
  seed: bigint;
}) {
  const name =
    metadata.status === "ready" && metadata.name
      ? metadata.name
      : `Renderer seed ${seed}`;
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <Box
          component="img"
          src={metadata.image}
          alt={`${name} preview`}
          sx={{ width: 128, height: 128, objectFit: "cover" }}
        />
        <div>
          <Typography fontWeight={700}>{name}</Typography>
          <Typography variant="body2" color="text.secondary">
            Deterministic TEST renderer output for seed {seed.toString()}.
          </Typography>
        </div>
      </Stack>
    </Paper>
  );
}

function adminStatusCopy(state: GalleryAdminState) {
  switch (state.status) {
    case "idle":
      return "Choose a market action.";
    case "switching_chain":
      return "Switching to Base Sepolia…";
    case "simulating":
      return "Checking the exact gallery action with the contract…";
    case "awaiting_wallet":
      return "Confirm the gallery action in your wallet.";
    case "confirming":
      return "Waiting for the gallery action receipt…";
    case "confirmed":
      return "Gallery action confirmed and affected state refreshed.";
    case "outcome_unknown":
      return "The action was broadcast, but its receipt could not be confirmed. Check the transaction before retrying.";
    case "error":
      return state.failure
        ? displaySafeErrorMessage(state.failure.cause)
        : "The gallery action failed.";
  }
}

export function AdminMarketActions({
  authority,
  global,
  refreshGlobal,
}: {
  authority: Exclude<GalleryAuthority, "denied">;
  global: GalleryHookProjection<GalleryGlobalState>;
  refreshGlobal: () => Promise<void>;
}) {
  const publicClient = usePublicClient({ chainId: config.chainId });
  const queryClient = useQueryClient();
  const [tokenInput, setTokenInput] = useState("");
  const [premiumInput, setPremiumInput] = useState("");
  const [rotationMode, setRotationMode] = useState<RotationMode>("mint");
  const [poolTokenInput, setPoolTokenInput] = useState("");
  const [seedInput, setSeedInput] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{
    mode: RotationMode;
    input: string;
    seed: bigint;
    uri: string;
    metadata: GalleryMetadataResult;
  } | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] =
    useState<GalleryRecoveryScanResult | null>(null);
  const scanController = useRef<AbortController | null>(null);
  const [withdrawRecipient, setWithdrawRecipient] = useState(
    global.status === "success" ? global.data.feeRecipient : "",
  );
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawReview, setWithdrawReview] = useState<{
    recipient: Address;
    amount: bigint;
    accrued: bigint;
    recipientInput: string;
    amountInput: string;
  } | null>(null);

  useEffect(() => {
    if (
      !withdrawRecipient &&
      global.status === "success"
    ) {
      setWithdrawRecipient(global.data.feeRecipient);
    }
  }, [global, withdrawRecipient]);

  useEffect(
    () => () => {
      scanController.current?.abort();
    },
    [],
  );

  const refreshAfterAction = useCallback(
    async (call: GalleryAdminCall) => {
      if ("tokenId" in call) {
        await invalidateGalleryToken(queryClient, identity, call.tokenId);
      }
      if (
        call.kind === "list" ||
        call.kind === "set_premium" ||
        call.kind === "unlist"
      ) {
        await invalidateGalleryDiscovery(queryClient, identity);
      }
      if (call.kind === "rotate_mint" || call.kind === "rotate_burn") {
        await queryClient.invalidateQueries({
          queryKey: galleryQueryKeys.pools(identity),
        });
      }
      await refreshGlobal();
    },
    [queryClient, refreshGlobal],
  );
  const transaction = useGalleryAdminAction({ refresh: refreshAfterAction });

  const selectedTokenId = parsedTokenId(tokenInput);
  const selectedToken = useGalleryTokenState(selectedTokenId ?? 1n, {
    enabled: selectedTokenId !== null,
  });
  const poolTokenId = parsedTokenId(poolTokenInput);
  const mintPool = useGalleryPoolState({
    kind: "mint",
    tokenIds: poolTokenId ? [poolTokenId] : [],
    enabled: rotationMode === "mint" && poolTokenId !== null,
  });
  const burnPool = useGalleryPoolState({
    kind: "burn",
    tokenIds: poolTokenId ? [poolTokenId] : [],
    enabled: rotationMode === "burn" && poolTokenId !== null,
  });
  const selectedPool = rotationMode === "mint" ? mintPool : burnPool;
  const selectedPoolEligibility =
    selectedPool.projection.status === "success"
      ? selectedPool.projection.data.candidates[0]?.eligible
      : null;

  const run = (build: () => GalleryAdminCall) => {
    setActionError(null);
    try {
      void transaction.submit(build());
    } catch (error) {
      setActionError(error instanceof Error ? error.message : String(error));
    }
  };

  const previewSeed = async (mode: RotationMode, input: string) => {
    setActionError(null);
    try {
      if (!publicClient) throw new Error("Base Sepolia RPC is unavailable.");
      const seed =
        mode === "end"
          ? parseGalleryRendererSeed(input)
          : parseGalleryTokenId(input);
      const uri = await publicClient.readContract({
        abi: rendererAbi,
        address: config.addresses.renderer,
        functionName: "tokenURI",
        args: [seed],
      });
      setPreview({
        mode,
        input,
        seed,
        uri,
        metadata: decodeTestGalleryMetadata(uri),
      });
    } catch (error) {
      setPreview(null);
      setActionError(error instanceof Error ? error.message : String(error));
    }
  };

  const startRecoveryScan = async () => {
    if (!publicClient || scanning) return;
    const controller = new AbortController();
    scanController.current = controller;
    setScanning(true);
    setActionError(null);
    try {
      const result = await scanGalleryRecoveryInventory({
        gallery: config.addresses.gallery,
        signal: controller.signal,
        source: {
          getBlockNumber: () => publicClient.getBlockNumber(),
          readOwners: async (tokenIds, blockNumber) => {
            const owners = await publicClient.multicall({
              allowFailure: false,
              blockNumber,
              contracts: tokenIds.map((tokenId) => ({
                abi: fameMirrorAbi,
                address: config.addresses.mirror,
                functionName: "ownerAt" as const,
                args: [tokenId] as const,
              })),
            });
            return new Map(
              tokenIds.map((tokenId, index) => [tokenId, owners[index]]),
            );
          },
          getAffectedTokenIds: async (fromBlock, toBlock) => {
            const [galleryLogs, mirrorLogs] = await Promise.all([
              publicClient.getLogs({
                address: config.addresses.gallery,
                fromBlock,
                toBlock,
              }),
              publicClient.getLogs({
                address: config.addresses.mirror,
                fromBlock,
                toBlock,
              }),
            ]);
            const affected = new Set<bigint>();
            for (const log of galleryLogs) {
              try {
                const decoded = decodeEventLog({
                  abi: closedLoopGallerySwapAbi,
                  data: log.data,
                  topics: log.topics as [Hex, ...Hex[]],
                  strict: true,
                }) as {
                  args: { tokenId?: unknown };
                };
                if (typeof decoded.args.tokenId === "bigint") {
                  affected.add(decoded.args.tokenId);
                }
              } catch {
                // Other gallery logs do not identify a collection token.
              }
            }
            for (const log of mirrorLogs) {
              try {
                const decoded = decodeEventLog({
                  abi: fameMirrorAbi,
                  eventName: "Transfer",
                  data: log.data,
                  topics: log.topics as [Hex, ...Hex[]],
                  strict: true,
                });
                const { from, to, id } = decoded.args;
                if (
                  (isAddressEqual(from, config.addresses.gallery) ||
                    isAddressEqual(to, config.addresses.gallery)) &&
                  id >= 1n &&
                  id <= 888n
                ) {
                  affected.add(id);
                }
              } catch {
                // Non-Transfer mirror logs do not affect custody.
              }
            }
            return [...affected];
          },
          readFinalStates: async (tokenIds, blockNumber) => {
            const values = await publicClient.multicall({
              allowFailure: false,
              blockNumber,
              contracts: tokenIds.flatMap((tokenId) => [
                {
                  abi: fameMirrorAbi,
                  address: config.addresses.mirror,
                  functionName: "ownerAt" as const,
                  args: [tokenId] as const,
                },
                {
                  abi: closedLoopGallerySwapAbi,
                  address: config.addresses.gallery,
                  functionName: "listings" as const,
                  args: [tokenId] as const,
                },
              ]),
            });
            return new Map(
              tokenIds.map((tokenId, index) => {
                const owner = values[index * 2] as Address;
                const listing = values[index * 2 + 1] as readonly [
                  bigint,
                  boolean,
                ];
                return [
                  tokenId,
                  {
                    tokenId,
                    owner,
                    listingActive: listing[1],
                  },
                ];
              }),
            );
          },
        },
      });
      setScanResult(result);
    } catch (error) {
      if (!controller.signal.aborted) {
        setActionError(error instanceof Error ? error.message : String(error));
      }
    } finally {
      setScanning(false);
      scanController.current = null;
    }
  };

  const currentAccrued =
    global.status === "success" ? global.data.accruedProtocolFees : null;
  const withdrawalReviewValid =
    withdrawReview !== null &&
    currentAccrued === withdrawReview.accrued &&
    withdrawReview.recipientInput === withdrawRecipient &&
    withdrawReview.amountInput === withdrawAmount;
  const transactionTerminal =
    transaction.state.status === "confirmed" ||
    transaction.state.status === "outcome_unknown" ||
    transaction.state.status === "error";

  return (
    <Stack spacing={3}>
      <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 3 } }}>
        <Stack spacing={2}>
          <Typography component="h2" variant="h5">
            Listing lifecycle
          </Typography>
          <TextField
            label="Gallery token ID"
            value={tokenInput}
            onChange={(event) => setTokenInput(event.target.value)}
            inputProps={{ inputMode: "numeric" }}
          />
          <TextField
            label="Premium in TEST"
            value={premiumInput}
            onChange={(event) => setPremiumInput(event.target.value)}
            inputProps={{ inputMode: "decimal" }}
          />
          {selectedToken.projection.status === "success" ? (
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Stack spacing={0.75}>
                <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>
                  Current owner: {selectedToken.projection.data.owner}
                </Typography>
                <Typography variant="body2">
                  Listing:{" "}
                  {selectedToken.projection.data.listing.active
                    ? `active at ${formatTestAmount(
                        selectedToken.projection.data.listing.premium,
                      )} TEST premium`
                    : "inactive"}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Canonical token read block{" "}
                  {selectedToken.projection.blockNumber.toString()}
                </Typography>
              </Stack>
            </Paper>
          ) : selectedToken.projection.status === "failure" ? (
            <Alert severity="error">{selectedToken.projection.message}</Alert>
          ) : selectedTokenId ? (
            <Typography role="status">Loading current token state…</Typography>
          ) : null}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Button
              variant="contained"
              onClick={() =>
                run(() => ({
                  kind: "list",
                  tokenId: parseGalleryTokenId(tokenInput),
                  premium: parseGalleryPremium(premiumInput),
                }))
              }
            >
              List
            </Button>
            <Button
              variant="outlined"
              onClick={() =>
                run(() => ({
                  kind: "set_premium",
                  tokenId: parseGalleryTokenId(tokenInput),
                  premium: parseGalleryPremium(premiumInput),
                }))
              }
            >
              Set premium
            </Button>
            <Button
              variant="outlined"
              onClick={() =>
                run(() => ({
                  kind: "unlist",
                  tokenId: parseGalleryTokenId(tokenInput),
                }))
              }
            >
              Unlist
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 3 } }}>
        <Stack spacing={2}>
          <div>
            <Typography component="h2" variant="h5">
              TEST metadata rotations
            </Typography>
            <Typography color="text.secondary">
              Mint, Burn, and End-of-Mint exercise the gallery contract. Art
              Pool is intentionally absent from this TEST workbench.
            </Typography>
          </div>
          <FormControl fullWidth>
            <InputLabel id="rotation-mode-label">Rotation path</InputLabel>
            <Select
              labelId="rotation-mode-label"
              label="Rotation path"
              value={rotationMode}
              onChange={(event) => {
                setRotationMode(event.target.value as RotationMode);
                setPreview(null);
              }}
            >
              <MenuItem value="mint">Mint pool</MenuItem>
              <MenuItem value="burn">Burn pool</MenuItem>
              <MenuItem value="end">End-of-Mint seed</MenuItem>
            </Select>
          </FormControl>
          {rotationMode === "end" ? (
            <TextField
              label="Renderer seed"
              value={seedInput}
              onChange={(event) => {
                setSeedInput(event.target.value);
                setPreview(null);
              }}
              inputProps={{ inputMode: "numeric" }}
            />
          ) : (
            <>
              <TextField
                label={`${rotationMode === "mint" ? "Mint" : "Burn"} pool token ID`}
                value={poolTokenInput}
                onChange={(event) => {
                  setPoolTokenInput(event.target.value);
                  setPreview(null);
                }}
                inputProps={{ inputMode: "numeric" }}
              />
              <Typography variant="body2" color="text.secondary">
                {selectedPool.projection.status === "loading"
                  ? "Checking current pool eligibility…"
                  : selectedPoolEligibility === true
                    ? "Contract pool read: eligible"
                    : selectedPoolEligibility === false
                      ? "Contract pool read: not currently eligible"
                      : "Enter a token ID to check this pool."}
              </Typography>
            </>
          )}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Button
              variant="outlined"
              onClick={() =>
                void previewSeed(
                  rotationMode,
                  rotationMode === "end" ? seedInput : poolTokenInput,
                )
              }
            >
              Preview renderer art
            </Button>
            <Button
              variant="contained"
              onClick={() =>
                run(() => {
                  const tokenId = parseGalleryTokenId(tokenInput);
                  if (rotationMode === "mint") {
                    return {
                      kind: "rotate_mint",
                      tokenId,
                      poolTokenId: parseGalleryTokenId(poolTokenInput),
                    };
                  }
                  if (rotationMode === "burn") {
                    return {
                      kind: "rotate_burn",
                      tokenId,
                      poolTokenId: parseGalleryTokenId(poolTokenInput),
                    };
                  }
                  const seed = parseGalleryRendererSeed(seedInput);
                  if (
                    !preview ||
                    preview.mode !== "end" ||
                    preview.input !== seedInput ||
                    preview.seed !== seed ||
                    preview.uri.length === 0
                  ) {
                    throw new Error(
                      "Preview the current renderer URI for this seed first.",
                    );
                  }
                  return {
                    kind: "rotate_end_of_mint",
                    tokenId,
                    metadataUri: preview.uri,
                  };
                })
              }
            >
              Run rotation
            </Button>
          </Stack>
          {preview ? (
            <MetadataPreview metadata={preview.metadata} seed={preview.seed} />
          ) : null}
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 3 } }}>
        <Stack spacing={2}>
          <div>
            <Typography component="h2" variant="h5">
              Recovery inventory scan
            </Typography>
            <Typography color="text.secondary">
              Scan all 888 is a manual recovery tool for direct NFT transfers.
              It does not replace or advance normal listing discovery.
            </Typography>
          </div>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Button
              variant="outlined"
              disabled={scanning}
              onClick={() => void startRecoveryScan()}
            >
              {scanning ? "Scanning all 888…" : "Scan all 888"}
            </Button>
            {scanning ? (
              <Button
                variant="text"
                onClick={() => scanController.current?.abort()}
              >
                Cancel scan
              </Button>
            ) : null}
          </Stack>
          {scanResult ? (
            <Alert severity="success">
              Found {scanResult.galleryOwnedTokenIds.length} gallery-owned NFTs
              at block {scanResult.reconciliationBlock.toString()};{" "}
              {scanResult.activeListingTokenIds.length} are actively listed.
            </Alert>
          ) : null}
        </Stack>
      </Paper>

      {authority === "owner" ? (
        <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 3 } }}>
          <Stack spacing={2}>
            <div>
              <Typography component="h2" variant="h5">
                Owner fee withdrawal
              </Typography>
              <Typography color="text.secondary">
                Owner-only. Review the complete recipient and exact TEST amount
                before submitting.
              </Typography>
            </div>
            <TextField
              label="Fee recipient"
              value={withdrawRecipient}
              onChange={(event) => {
                setWithdrawRecipient(event.target.value);
                setWithdrawReview(null);
              }}
            />
            <TextField
              label="Withdrawal amount in TEST"
              value={withdrawAmount}
              onChange={(event) => {
                setWithdrawAmount(event.target.value);
                setWithdrawReview(null);
              }}
              inputProps={{ inputMode: "decimal" }}
            />
            <Button
              variant="outlined"
              onClick={() => {
                try {
                  if (currentAccrued === null) {
                    throw new Error("Current accrued fees are unavailable.");
                  }
                  if (!isAddress(withdrawRecipient)) {
                    throw new Error("Enter a valid fee recipient address.");
                  }
                  const amount = parseUnsignedTestAmount(withdrawAmount, {
                    allowZero: true,
                    maximum: currentAccrued,
                  });
                  setWithdrawReview({
                    recipient: withdrawRecipient,
                    amount,
                    accrued: currentAccrued,
                    recipientInput: withdrawRecipient,
                    amountInput: withdrawAmount,
                  });
                  setActionError(null);
                } catch (error) {
                  setWithdrawReview(null);
                  setActionError(
                    error instanceof Error ? error.message : String(error),
                  );
                }
              }}
            >
              Review withdrawal
            </Button>
            {withdrawReview ? (
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Stack spacing={1}>
                  <Typography component="h3" variant="h6">
                    Withdrawal review
                  </Typography>
                  <Typography sx={{ overflowWrap: "anywhere" }}>
                    Recipient: {withdrawReview.recipient}
                  </Typography>
                  <Typography>
                    Amount: {formatTestAmount(withdrawReview.amount)} TEST
                  </Typography>
                  <Typography>
                    Accrued: {formatTestAmount(withdrawReview.accrued)} TEST
                  </Typography>
                  <Typography>
                    Projected remainder:{" "}
                    {formatTestAmount(
                      withdrawReview.accrued - withdrawReview.amount,
                    )}{" "}
                    TEST
                  </Typography>
                  {!withdrawalReviewValid ? (
                    <Alert severity="warning">
                      Inputs or accrued balance changed. Review again.
                    </Alert>
                  ) : (
                    <Button
                      variant="contained"
                      onClick={() =>
                        run(() => ({
                          kind: "withdraw_fees",
                          recipient: withdrawReview.recipient,
                          amount: withdrawReview.amount,
                        }))
                      }
                    >
                      Withdraw reviewed fees
                    </Button>
                  )}
                </Stack>
              </Paper>
            ) : null}
          </Stack>
        </Paper>
      ) : null}

      <ActionError message={actionError} />
      {transaction.state.status !== "idle" && !transaction.modalOpen ? (
        <Button
          variant="outlined"
          onClick={() => transaction.setModalOpen(true)}
          sx={{ alignSelf: "flex-start" }}
        >
          View admin transaction
        </Button>
      ) : null}
      <TransactionsModal
        open={transaction.modalOpen}
        onClose={() => transaction.setModalOpen(false)}
        transactions={
          transaction.transaction ? [transaction.transaction] : undefined
        }
        onTransactionConfirmed={() => undefined}
        topContent={
          <Stack spacing={2} sx={{ mb: 2 }}>
            <Alert
              severity={
                transaction.state.status === "error"
                  ? "error"
                  : transaction.state.status === "outcome_unknown"
                    ? "warning"
                    : transaction.state.status === "confirmed"
                      ? "success"
                      : "info"
              }
            >
              {adminStatusCopy(transaction.state)}
            </Alert>
            {transactionTerminal ? (
              <Button
                variant="outlined"
                onClick={() => {
                  transaction.reset();
                  transaction.setModalOpen(false);
                }}
              >
                Done
              </Button>
            ) : null}
          </Stack>
        }
      />
      <Divider />
      <Typography variant="caption" color="text.secondary">
        No Art Pool, upload flow, production payment router, or direct
        CreatorMagic write is exposed here.
      </Typography>
    </Stack>
  );
}
