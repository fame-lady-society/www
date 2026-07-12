import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Image from "next/image";
import { formatEther, zeroAddress, type Address } from "viem";
import { base } from "viem/chains";
import { FAME_METADATA_FALLBACK_IMAGE } from "@/service/fameMetadata";
import type {
  SocietyNftAuctionMetadata,
  SocietyNftAuctionPageProjection,
} from "../types";

export interface AuctionHeroProps {
  projection: SocietyNftAuctionPageProjection;
  metadata: SocietyNftAuctionMetadata | null;
  remainingSeconds: bigint | null;
  isRefreshing?: boolean;
  onRefresh?: () => void;
}

function shortAddress(address: Address): string {
  return `${address.slice(0, 8)}…${address.slice(-6)}`;
}

export function formatAuctionEth(value: bigint): string {
  const [whole, fraction = ""] = formatEther(value).split(".");
  const trimmedFraction = fraction.replace(/0+$/, "");
  return `${whole}${trimmedFraction ? `.${trimmedFraction}` : ""} ETH`;
}

export function formatAuctionCountdown(
  remainingSeconds: bigint | null,
): string {
  if (remainingSeconds === null) return "—";
  if (remainingSeconds === 0n) return "Ended";

  const days = remainingSeconds / 86_400n;
  const hours = (remainingSeconds % 86_400n) / 3_600n;
  const minutes = (remainingSeconds % 3_600n) / 60n;
  const seconds = remainingSeconds % 60n;

  if (days > 0n) return `${days}d ${hours}h ${minutes}m`;
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

function formatAuctionDate(timestamp: bigint): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(Number(timestamp) * 1_000));
}

function ExplorerAddressLink({
  address,
  label,
}: {
  address: Address;
  label: string;
}) {
  return (
    <Link
      href={`${base.blockExplorers.default.url}/address/${address}`}
      target="_blank"
      rel="noopener noreferrer"
      underline="hover"
      sx={{ overflowWrap: "anywhere" }}
    >
      {label} <OpenInNewIcon sx={{ fontSize: "0.85em", verticalAlign: -1 }} />
    </Link>
  );
}

function EmptyAuctionHero({
  projection,
  onRefresh,
}: Pick<AuctionHeroProps, "projection" | "onRefresh">) {
  if (projection.kind === "loading") {
    return (
      <Box
        component="section"
        aria-labelledby="auction-state-heading"
        sx={{ py: { xs: 8, md: 14 } }}
      >
        <Typography
          id="auction-state-heading"
          component="h2"
          variant="h3"
          aria-live="polite"
        >
          Loading auction
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          Reading the latest Base block.
        </Typography>
      </Box>
    );
  }

  if (projection.kind === "failure") {
    return (
      <Box
        component="section"
        aria-labelledby="auction-state-heading"
        sx={{ py: { xs: 8, md: 14 } }}
      >
        <Typography id="auction-state-heading" component="h2" variant="h3">
          Auction unavailable
        </Typography>
        <Typography role="alert" sx={{ mt: 1 }}>
          {projection.message}
        </Typography>
        {onRefresh ? (
          <Button
            type="button"
            variant="outlined"
            onClick={onRefresh}
            sx={{ mt: 3, minHeight: 44 }}
          >
            Try again
          </Button>
        ) : null}
      </Box>
    );
  }

  if (projection.kind !== "unstarted") return null;

  return (
    <Box
      component="section"
      aria-labelledby="auction-state-heading"
      sx={{ py: { xs: 8, md: 14 } }}
    >
      <Typography
        id="auction-state-heading"
        component="h2"
        variant="h3"
        aria-live="polite"
      >
        Auction has not started
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 2 }}>
        Auction contract
      </Typography>
      <Typography component="div" sx={{ mt: 0.5 }}>
        <ExplorerAddressLink
          address={projection.auctionAddress}
          label={projection.auctionAddress}
        />
      </Typography>
    </Box>
  );
}

export function AuctionHero({
  projection,
  metadata,
  remainingSeconds,
  isRefreshing = false,
  onRefresh,
}: AuctionHeroProps) {
  if (
    projection.kind === "loading" ||
    projection.kind === "failure" ||
    projection.kind === "unstarted"
  ) {
    return <EmptyAuctionHero projection={projection} onRefresh={onRefresh} />;
  }

  const isSettled = projection.kind === "settled";
  const bidAmount = isSettled ? projection.winningBid : projection.highestBid;
  const hasBid = projection.highestBidder !== zeroAddress;
  const hasRecipient = isSettled && projection.settledRecipient !== zeroAddress;
  const lotName = metadata?.name ?? `Society NFT #${projection.lot.tokenId}`;
  const image = metadata?.image ?? FAME_METADATA_FALLBACK_IMAGE;
  const statusLabel =
    projection.kind === "active"
      ? "Live auction"
      : projection.kind === "ended_unsettled"
        ? "Awaiting settlement"
        : "Auction complete";

  return (
    <Box
      component="article"
      aria-labelledby="auction-lot-heading"
      sx={{
        display: "grid",
        gap: { xs: 3, md: 5 },
        gridTemplateColumns: {
          xs: "1fr",
          md: "minmax(0, 1.35fr) minmax(260px, 0.65fr)",
        },
        alignItems: "end",
        animation: "auction-reveal 420ms ease-out both",
        "@keyframes auction-reveal": {
          from: { opacity: 0, transform: "translateY(10px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
        "@media (prefers-reduced-motion: reduce)": { animation: "none" },
      }}
    >
      <div className="relative aspect-square overflow-hidden rounded bg-neutral-100 dark:bg-neutral-900">
        <Image
          src={image}
          alt={`${lotName} auction artwork`}
          fill
          priority
          sizes="(max-width: 899px) calc(100vw - 32px), 56vw"
          style={{ objectFit: "cover" }}
        />
      </div>

      <Stack spacing={2.5} sx={{ pb: { md: 1 } }}>
        <div>
          <Typography
            variant="overline"
            sx={{
              color: (theme) =>
                theme.palette.mode === "dark" ? "#dec47d" : "#765718",
              letterSpacing: "0.15em",
            }}
          >
            {statusLabel}
          </Typography>
          <Typography id="auction-lot-heading" component="h2" variant="h3">
            {lotName}
          </Typography>
          {metadata?.description ? (
            <Typography color="text.secondary" sx={{ mt: 1.25 }}>
              {metadata.description}
            </Typography>
          ) : null}
          {metadata?.error ? (
            <Typography color="text.secondary" variant="caption" sx={{ mt: 1 }}>
              Showing collection artwork while token details are unavailable.
            </Typography>
          ) : null}
        </div>

        <Box
          component="dl"
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            columnGap: 3,
            rowGap: 2,
            m: 0,
            py: 2.5,
            borderBlock: "1px solid",
            borderColor: "divider",
          }}
        >
          <Box component="div">
            <Typography component="dt" variant="caption" color="text.secondary">
              {isSettled ? "Winning bid" : "Highest bid"}
            </Typography>
            <Typography component="dd" variant="h5" sx={{ m: 0, mt: 0.5 }}>
              {isSettled || hasBid
                ? formatAuctionEth(bidAmount)
                : "No bids yet"}
            </Typography>
          </Box>
          <Box component="div">
            <Typography component="dt" variant="caption" color="text.secondary">
              {projection.kind === "active" ? "Time remaining" : "Status"}
            </Typography>
            <Typography
              component="dd"
              variant="h5"
              sx={{ m: 0, mt: 0.5, fontVariantNumeric: "tabular-nums" }}
            >
              {projection.kind === "active"
                ? formatAuctionCountdown(remainingSeconds)
                : projection.kind === "settled"
                  ? "Settled"
                  : "Ended"}
            </Typography>
          </Box>
        </Box>

        <Stack spacing={0.75}>
          <Typography variant="body2" color="text.secondary">
            {isSettled ? "Recipient" : "Leading bidder"}:{" "}
            {isSettled ? (
              hasRecipient ? (
                <ExplorerAddressLink
                  address={projection.settledRecipient}
                  label={shortAddress(projection.settledRecipient)}
                />
              ) : (
                "—"
              )
            ) : hasBid ? (
              <ExplorerAddressLink
                address={projection.highestBidder}
                label={shortAddress(projection.highestBidder)}
              />
            ) : (
              "—"
            )}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Lot {projection.lot.tokenId.toString()} ·{" "}
            <Link
              href={`${base.blockExplorers.default.url}/token/${projection.societyNft}?a=${projection.lot.tokenId}`}
              target="_blank"
              rel="noopener noreferrer"
              underline="hover"
            >
              View NFT{" "}
              <OpenInNewIcon sx={{ fontSize: "0.85em", verticalAlign: -1 }} />
            </Link>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Started{" "}
            <time
              dateTime={new Date(
                Number(projection.startTime) * 1_000,
              ).toISOString()}
            >
              {formatAuctionDate(projection.startTime)} UTC
            </time>{" "}
            · Ends{" "}
            <time
              dateTime={new Date(
                Number(projection.endTime) * 1_000,
              ).toISOString()}
            >
              {formatAuctionDate(projection.endTime)} UTC
            </time>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <ExplorerAddressLink
              address={projection.auctionAddress}
              label="View auction contract"
            />
          </Typography>
        </Stack>

        {isRefreshing ? (
          <Typography role="status" aria-live="polite" variant="body2">
            Refreshing auction state… Actions pause until the latest bid is
            loaded.
          </Typography>
        ) : null}
      </Stack>
    </Box>
  );
}
