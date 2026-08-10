"use client";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Image from "next/image";
import { TransactionsModal } from "@/components/TransactionsModal";
import {
  Fragment,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { useReadContract } from "wagmi";
import { fameMirrorAbi } from "../../../wagmi";
import { displaySafeErrorMessage } from "../../fame-swap/solver/diagnostics";
import { formatTokenAmount } from "../../fame-swap/solver/format";
import { FAME_SWAP_TOKENS } from "../../fame-swap/tokens";
import { useGalleryRuntime } from "../config/galleryRuntime";
import { useGalleryMetadata } from "../hooks/useGalleryMetadata";
import { useGalleryRedemption } from "../hooks/useGalleryRedemption";
import { useGalleryRedemptionOwnership } from "../hooks/useGalleryRedemptionOwnership";
import { useGalleryRedemptionQuote } from "../hooks/useGalleryRedemptionQuote";
import type {
  GalleryRedemptionOutputAsset,
  GalleryRedemptionQuote,
} from "../types";
import { GalleryAssetSelect } from "./GalleryAssetSelect";

const REDEMPTION_OUTPUT_ASSETS = [
  "ETH",
  "WETH",
  "USDC",
] as const satisfies readonly GalleryRedemptionOutputAsset[];

export type SocietyRedemptionTokenPresentation = Readonly<{
  tokenId: bigint;
  metadata: Readonly<{
    status: "loading" | "ready" | "error";
    name: string | null;
    image: string | null;
  }>;
}>;

export type SocietyRedemptionAccordionState =
  | Readonly<{ status: "disconnected" | "loading" | "empty" }>
  | Readonly<{ status: "error"; message: string }>
  | Readonly<{
      status: "ready";
      tokens: readonly SocietyRedemptionTokenPresentation[];
    }>;

const EMPTY_TOKEN_IDS: readonly bigint[] = [];
const SOCIETY_CARD_PAGE_SIZE = 64;
const TOKEN_GRID_STYLE: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))",
  gap: 12,
};

function outputAmount(amount: bigint, asset: GalleryRedemptionOutputAsset) {
  const token = FAME_SWAP_TOKENS.find(({ symbol }) => symbol === asset);
  if (!token) throw new Error(`Unsupported redemption output: ${asset}`);
  return formatTokenAmount(amount, token, asset === "USDC" ? 2 : 4);
}

function wholeFame(amount: bigint) {
  const unit = 10n ** 18n;
  return ((amount + unit / 2n) / unit).toLocaleString("en-US");
}

function QuoteRow({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" justifyContent="space-between" spacing={2}>
      <Typography color="text.secondary">{label}</Typography>
      <Typography fontWeight={600} textAlign="right">
        {value}
      </Typography>
    </Stack>
  );
}

function SocietyTokenPresentationCard({
  token,
  selected,
  disabled,
  onToggle,
}: {
  token: SocietyRedemptionTokenPresentation;
  selected: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  const name = token.metadata.name ?? `Society #${token.tokenId.toString()}`;
  return (
    <Paper
      component="button"
      type="button"
      variant="outlined"
      disabled={disabled}
      onClick={onToggle}
      aria-pressed={selected}
      sx={{
        p: 1.5,
        minWidth: 0,
        minHeight: 88,
        textAlign: "left",
        borderColor: selected ? "primary.main" : "divider",
        bgcolor: selected ? "action.selected" : "background.paper",
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Checkbox checked={selected} disabled={disabled} tabIndex={-1} />
        {token.metadata.status === "ready" && token.metadata.image ? (
          <Image
            src={token.metadata.image}
            alt=""
            width={56}
            height={56}
            style={{
              width: 56,
              height: 56,
              objectFit: "cover",
              borderRadius: 4,
            }}
          />
        ) : null}
        <div style={{ minWidth: 0 }}>
          <Typography fontWeight={700} noWrap>
            {name}
          </Typography>
          <Typography color="text.secondary" variant="body2">
            Society #{token.tokenId.toString()}
          </Typography>
          {token.metadata.status === "error" ? (
            <Typography color="text.secondary" variant="caption">
              Metadata unavailable
            </Typography>
          ) : null}
        </div>
      </Stack>
    </Paper>
  );
}

export function SocietyRedemptionAccordionView({
  state,
  selectedIds,
  outputAsset,
  quote,
  quoteLoading,
  quoteError,
  approved,
  approvalLoading = false,
  approvalError = null,
  simulationPending = false,
  simulationError = null,
  locked,
  quoteCurrent,
  expanded = true,
  onExpandedChange,
  onToggle,
  onOutputAssetChange,
  onApprove,
  onRedeem,
  onOwnershipRefresh,
  onQuoteRefresh,
  renderToken,
}: {
  state: SocietyRedemptionAccordionState;
  selectedIds: readonly bigint[];
  outputAsset: GalleryRedemptionOutputAsset;
  quote: GalleryRedemptionQuote | null;
  quoteLoading: boolean;
  quoteError: Error | null;
  approved: boolean;
  approvalLoading?: boolean;
  approvalError?: Error | null;
  simulationPending?: boolean;
  simulationError?: Error | null;
  locked: boolean;
  quoteCurrent: boolean;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  onToggle: (tokenId: bigint) => void;
  onOutputAssetChange: (asset: GalleryRedemptionOutputAsset) => void;
  onApprove: () => void;
  onRedeem: () => void;
  onOwnershipRefresh: () => void;
  onQuoteRefresh: () => void;
  renderToken?: (
    token: SocietyRedemptionTokenPresentation,
    selected: boolean,
    disabled: boolean,
    onToggle: () => void,
  ) => ReactNode;
}) {
  const selectedSet = new Set(selectedIds);
  const selectionAtCap = selectedIds.length >= 32;
  const [visibleTokenCount, setVisibleTokenCount] = useState(
    SOCIETY_CARD_PAGE_SIZE,
  );
  const ownershipKey =
    state.status === "ready"
      ? `${state.tokens.length}:${state.tokens[0]?.tokenId.toString() ?? ""}:${state.tokens.at(-1)?.tokenId.toString() ?? ""}`
      : state.status;
  useEffect(() => {
    setVisibleTokenCount(SOCIETY_CARD_PAGE_SIZE);
  }, [ownershipKey]);
  const canReview =
    selectedIds.length > 0 &&
    approved &&
    quoteCurrent &&
    !quoteLoading &&
    !quoteError;

  let content: ReactNode;
  if (state.status === "disconnected") {
    content = (
      <Alert severity="info">
        Connect a Base wallet to see your Society NFTs.
      </Alert>
    );
  } else if (state.status === "loading") {
    content = <Alert severity="info">Finding your Society NFTs…</Alert>;
  } else if (state.status === "empty") {
    content = (
      <Alert severity="info">
        You do not own any Society NFTs in this wallet.
      </Alert>
    );
  } else if (state.status === "error") {
    content = (
      <Alert
        severity="error"
        action={<Button onClick={onOwnershipRefresh}>Try again</Button>}
      >
        {state.message}
      </Alert>
    );
  } else {
    const tokens = state.status === "ready" ? state.tokens : [];
    content = (
      <Stack spacing={2.5}>
        {tokens.length > 0 ? (
          <div style={TOKEN_GRID_STYLE}>
            {[...tokens]
              .sort((left, right) => Number(left.tokenId - right.tokenId))
              .slice(0, visibleTokenCount)
              .map((token) => {
                const selected = selectedSet.has(token.tokenId);
                const disabled = locked || (!selected && selectionAtCap);
                const toggle = () => onToggle(token.tokenId);
                return renderToken ? (
                  <Fragment key={token.tokenId.toString()}>
                    {renderToken(token, selected, disabled, toggle)}
                  </Fragment>
                ) : (
                  <SocietyTokenPresentationCard
                    key={token.tokenId.toString()}
                    token={token}
                    selected={selected}
                    disabled={disabled}
                    onToggle={toggle}
                  />
                );
              })}
          </div>
        ) : null}
        {tokens.length > visibleTokenCount ? (
          <Button
            type="button"
            variant="outlined"
            onClick={() =>
              setVisibleTokenCount((current) =>
                Math.min(current + SOCIETY_CARD_PAGE_SIZE, tokens.length),
              )
            }
            sx={{ alignSelf: { sm: "flex-start" } }}
          >
            Show more Society NFTs ({tokens.length - visibleTokenCount} more)
          </Button>
        ) : null}

        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", sm: "center" }}
          spacing={1.5}
        >
          <Typography fontWeight={700}>
            {selectedIds.length} selected
          </Typography>
          <GalleryAssetSelect
            ariaLabel="Redemption output"
            value={outputAsset}
            options={REDEMPTION_OUTPUT_ASSETS}
            disabled={locked}
            onChange={onOutputAssetChange}
          />
        </Stack>

        {quoteLoading ? (
          <Alert severity="info">Quoting your Society redemption…</Alert>
        ) : null}
        {quoteError ? (
          <Alert
            severity="error"
            action={<Button onClick={onQuoteRefresh}>Refresh quote</Button>}
          >
            {displaySafeErrorMessage(quoteError)}
          </Alert>
        ) : null}
        {quote && !quoteCurrent && !quoteLoading && !quoteError ? (
          <Alert
            severity="warning"
            action={<Button onClick={onQuoteRefresh}>Refresh quote</Button>}
          >
            This redemption quote expired.
          </Alert>
        ) : null}
        {quote && quoteCurrent ? (
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Stack spacing={0.75}>
              <QuoteRow
                label="Estimated output"
                value={outputAmount(quote.estimatedOutput, quote.outputAsset)}
              />
              <QuoteRow
                label="Minimum output"
                value={outputAmount(quote.minimumOutput, quote.outputAsset)}
              />
              {quote.checkoutBonus > 0n ? (
                <>
                  <Typography fontWeight={700} sx={{ pt: 0.75 }}>
                    Checkout bonus: {wholeFame(quote.checkoutBonus)} FAME
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    FAME already in checkout is included for the next successful
                    redeemer.
                  </Typography>
                </>
              ) : null}
            </Stack>
          </Paper>
        ) : null}

        {approvalError ? (
          <Alert severity="error">
            {displaySafeErrorMessage(approvalError)}
          </Alert>
        ) : null}
        {selectedIds.length > 0 && !approved ? (
          <Button
            type="button"
            variant="contained"
            disabled={locked || approvalLoading || !quoteCurrent}
            onClick={onApprove}
            sx={{ minHeight: 44, alignSelf: { sm: "flex-start" } }}
          >
            Approve NFT redemption
          </Button>
        ) : null}

        {canReview ? (
          <Alert severity="warning" icon={false}>
            <Stack spacing={1.25}>
              <Typography fontWeight={700}>Selected Society NFTs</Typography>
              <Typography>
                {selectedIds
                  .map((tokenId) => `#${tokenId.toString()}`)
                  .join(", ")}
              </Typography>
              <Typography>
                Burning these NFTs is irreversible. The selected NFTs and all
                FAME already held by checkout will be exchanged for{" "}
                {outputAsset}.
              </Typography>
              {simulationPending ? (
                <Typography color="text.secondary">
                  Checking this redemption with the contract…
                </Typography>
              ) : null}
              {simulationError ? (
                <Alert
                  severity="error"
                  action={
                    <Button onClick={onQuoteRefresh}>Refresh quote</Button>
                  }
                >
                  {displaySafeErrorMessage(simulationError)}
                </Alert>
              ) : null}
              <Button
                type="button"
                color="error"
                variant="contained"
                disabled={
                  locked || simulationPending || Boolean(simulationError)
                }
                onClick={onRedeem}
                sx={{ minHeight: 44, alignSelf: { sm: "flex-start" } }}
              >
                Burn {selectedIds.length}{" "}
                {selectedIds.length === 1 ? "NFT" : "NFTs"}
              </Button>
            </Stack>
          </Alert>
        ) : null}
      </Stack>
    );
  }

  return (
    <Accordion
      expanded={expanded}
      onChange={(_event, nextExpanded) => onExpandedChange?.(nextExpanded)}
      disableGutters
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography component="h2" variant="h5" fontWeight={700}>
          Your Society NFTs
        </Typography>
      </AccordionSummary>
      <AccordionDetails>{expanded ? content : null}</AccordionDetails>
    </Accordion>
  );
}

function OwnedSocietyTokenCard({
  tokenId,
  selected,
  disabled,
  onToggle,
}: {
  tokenId: bigint;
  selected: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  const runtime = useGalleryRuntime();
  const tokenUri = useReadContract({
    abi: fameMirrorAbi,
    address: runtime.addresses.mirror,
    functionName: "tokenURI",
    args: [tokenId],
  });
  const metadata = useGalleryMetadata({
    tokenId: tokenId.toString(),
    tokenUri: typeof tokenUri.data === "string" ? tokenUri.data : "",
  });
  const presentation: SocietyRedemptionTokenPresentation = {
    tokenId,
    metadata:
      tokenUri.isPending || metadata.isLoading
        ? { status: "loading", name: null, image: null }
        : tokenUri.isError || metadata.metadata.status !== "ready"
          ? { status: "error", name: null, image: null }
          : {
              status: "ready",
              name: metadata.metadata.name,
              image: metadata.metadata.image,
            },
  };
  return (
    <SocietyTokenPresentationCard
      token={presentation}
      selected={selected}
      disabled={disabled}
      onToggle={onToggle}
    />
  );
}

function transactionCopy(status: string, error?: Error) {
  if (status === "simulating_approval")
    return "Checking NFT redemption approval…";
  if (status === "awaiting_approval_wallet")
    return "Approve NFT redemption in your wallet.";
  if (status === "confirming_approval")
    return "Approval confirmed. Waiting for two additional Base blocks…";
  if (status === "simulating_redemption")
    return "Checking this redemption with the contract…";
  if (status === "awaiting_redemption_wallet")
    return "Confirm the irreversible burn in your wallet.";
  if (status === "confirming_redemption")
    return "Waiting for one Base redemption confirmation…";
  if (status === "refreshing")
    return "Redemption confirmed. Refreshing balances and owned NFTs…";
  if (status === "success") return "Society NFT redemption confirmed.";
  if (status === "error")
    return error
      ? displaySafeErrorMessage(error)
      : "Society NFT redemption failed.";
  return "Prepare your Society NFT redemption.";
}

export function SocietyRedemptionAccordion() {
  const runtime = useGalleryRuntime();
  const ownership = useGalleryRedemptionOwnership();
  const [expanded, setExpanded] = useState(false);
  const [, setQuoteNow] = useState(Date.now());
  const [selectedIds, setSelectedIds] = useState<bigint[]>([]);
  const [outputAsset, setOutputAsset] =
    useState<GalleryRedemptionOutputAsset>("ETH");
  const ownedIds = useMemo(
    () =>
      ownership.state.status === "ready"
        ? ownership.state.tokenIds
        : EMPTY_TOKEN_IDS,
    [ownership.state],
  );

  useEffect(() => {
    const owned = new Set(ownedIds);
    setSelectedIds((current) =>
      current.filter((tokenId) => owned.has(tokenId)),
    );
  }, [ownedIds]);

  const quote = useGalleryRedemptionQuote({
    tokenIds: selectedIds,
    outputAsset,
  });
  useEffect(() => {
    setQuoteNow(Date.now());
    if (!quote.quote) return;
    const remaining = quote.quote.expiresAt.getTime() - Date.now();
    if (remaining <= 0) return;
    const timeout = window.setTimeout(
      () => setQuoteNow(Date.now()),
      Math.min(remaining + 1, 2_147_483_647),
    );
    return () => window.clearTimeout(timeout);
  }, [quote.quote]);
  const transaction = useGalleryRedemption({
    tokenIds: selectedIds,
    outputAsset,
    quote: quote.quote,
  });
  const toggle = (tokenId: bigint) => {
    setSelectedIds((current) => {
      if (current.includes(tokenId)) {
        return current.filter((candidate) => candidate !== tokenId);
      }
      if (current.length >= 32) return current;
      return [...current, tokenId].sort((left, right) => Number(left - right));
    });
  };
  const viewState = useMemo<SocietyRedemptionAccordionState>(() => {
    if (ownership.state.status !== "ready") return ownership.state;
    return {
      status: "ready",
      tokens: ownership.state.tokenIds.map((tokenId) => ({
        tokenId,
        metadata: { status: "loading", name: null, image: null },
      })),
    };
  }, [ownership.state]);
  const terminal =
    transaction.state.status === "success" ||
    transaction.state.status === "error";

  if (!runtime.checkout) return null;
  return (
    <>
      <SocietyRedemptionAccordionView
        state={viewState}
        selectedIds={selectedIds}
        outputAsset={outputAsset}
        quote={quote.quote}
        quoteLoading={quote.isLoading}
        quoteError={quote.error}
        approved={transaction.approved}
        approvalLoading={transaction.approvalLoading}
        approvalError={transaction.approvalError}
        simulationPending={transaction.simulationPending}
        simulationError={transaction.simulationError}
        locked={transaction.locked}
        quoteCurrent={transaction.quoteCurrent}
        expanded={expanded}
        onExpandedChange={setExpanded}
        onToggle={toggle}
        onOutputAssetChange={setOutputAsset}
        onApprove={() => void transaction.approve()}
        onRedeem={() => void transaction.redeem()}
        onOwnershipRefresh={() => void ownership.refresh()}
        onQuoteRefresh={() => void quote.refresh()}
        renderToken={(token, selected, disabled, onToggle) => (
          <OwnedSocietyTokenCard
            tokenId={token.tokenId}
            selected={selected}
            disabled={disabled}
            onToggle={onToggle}
          />
        )}
      />
      {transaction.locked && !transaction.modalOpen ? (
        <Button
          type="button"
          variant="outlined"
          onClick={() => transaction.setModalOpen(true)}
          sx={{ mt: 2 }}
        >
          View redemption transaction
        </Button>
      ) : null}
      <TransactionsModal
        open={transaction.modalOpen}
        onClose={() => transaction.setModalOpen(false)}
        transactions={[...transaction.transactions]}
        onTransactionConfirmed={() => undefined}
        title="Society NFT redemption"
        topContent={
          <Alert
            severity={
              transaction.state.status === "error"
                ? "error"
                : transaction.state.status === "success"
                  ? "success"
                  : "info"
            }
          >
            {transactionCopy(transaction.state.status, transaction.state.error)}
          </Alert>
        }
        bottomContent={
          terminal ? (
            <Button
              type="button"
              variant="outlined"
              onClick={() => transaction.setModalOpen(false)}
              sx={{ mt: 2, minHeight: 44 }}
            >
              Done
            </Button>
          ) : null
        }
      />
    </>
  );
}
