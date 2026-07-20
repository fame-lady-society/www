import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";
import NextImage from "next/image";
import NextLink from "next/link";
import type { FC, ReactNode } from "react";
import { FAME_METADATA_FALLBACK_IMAGE } from "@/service/fameMetadata";
import {
  ROTATION_EXCHANGE_EXPLANATION,
  type BurnPoolTargetResolution,
} from "../target";
import type { RotatorTransactionState } from "../transactionState";
import { FameRotatorStatus } from "./FameRotatorStatus";

// ---------------------------------------------------------------------------
// Pure view props (static component tests)
// ---------------------------------------------------------------------------

export type FameRotatorWalletStatus =
  | "disconnected"
  | "wrong_chain"
  | "checking"
  | "ready"
  | "blocked";

export interface FameRotatorViewProps {
  resolution: BurnPoolTargetResolution;
  walletStatus: FameRotatorWalletStatus;
  walletMessage?: string;
  walletControl?: ReactNode;
  /** Complete owned inventory when selectable. */
  ownedIds: readonly number[];
  /**
   * Presentation images for owned token IDs. Missing entries use the shared
   * fallback so identity remains selectable even when metadata fails.
   */
  ownedTokenImages?: Readonly<Record<number, string>>;
  selectedOfferedId: number | null;
  onSelectOffered?: (tokenId: number) => void;
  /** Whether rotator is already authorized for the selected offered NFT. */
  authorized: boolean | null;
  canApprove: boolean;
  canRotate: boolean;
  isPending: boolean;
  onApprove?: () => void;
  onRotate?: () => void;
  /** Acquisition branch content (only when no NFT). */
  acquisitionSlot?: ReactNode;
  transactionState: RotatorTransactionState;
  onRetryTransaction?: () => void;
  onRetryVerification?: () => void;
  onResetTransaction?: () => void;
  preflightMessage?: string;
  /** Incomplete inventory / ownership loss messaging. */
  inventoryMessage?: string | null;
}

/**
 * Presentational rotation experience. Used by the live page and static tests.
 */
export const FameRotatorView: FC<FameRotatorViewProps> = ({
  resolution,
  walletStatus,
  walletMessage,
  walletControl,
  ownedIds,
  ownedTokenImages = {},
  selectedOfferedId,
  onSelectOffered,
  authorized,
  canApprove,
  canRotate,
  isPending,
  onApprove,
  onRotate,
  acquisitionSlot,
  transactionState,
  onRetryTransaction,
  onRetryVerification,
  onResetTransaction,
  preflightMessage,
  inventoryMessage,
}) => {
  const writesVisible =
    walletStatus === "ready" ||
    walletStatus === "checking" ||
    walletStatus === "blocked";

  return (
    <Container
      maxWidth="md"
      sx={{ px: { xs: 2, sm: 3 }, py: { xs: 3, sm: 5 } }}
      data-wallet-status={walletStatus}
    >
      <Stack spacing={{ xs: 3, md: 4 }}>
        <Typography variant="body2">
          <Link component={NextLink} href="/fame" underline="hover" color="inherit">
            ← Back to $FAME
          </Link>
        </Typography>

        {resolution.status === "invalid_id" ? (
          <Stack
            component="section"
            aria-labelledby="rotate-invalid-heading"
            spacing={1.5}
            data-resolution="invalid_id"
          >
            <Typography id="rotate-invalid-heading" variant="h4" component="h1">
              Invalid target
            </Typography>
            <Typography>
              The rotation route accepts only canonical positive Society token
              IDs from 1 to 888.{" "}
              <Typography component="code" fontFamily="monospace">
                {resolution.raw || "(empty)"}
              </Typography>{" "}
              is not a valid target id.
            </Typography>
            <Link component={NextLink} href="/fame" underline="hover">
              Return to the burn pool
            </Link>
          </Stack>
        ) : null}

        {resolution.status === "unavailable" ? (
          <Stack
            component="section"
            aria-labelledby="rotate-unavailable-heading"
            spacing={1.5}
            data-resolution="unavailable"
          >
            <Typography
              id="rotate-unavailable-heading"
              variant="h4"
              component="h1"
            >
              Society #{resolution.tokenId} is not in the burn pool
            </Typography>
            <Typography>
              That token is a valid Society id, but it is not currently in the
              FIFO burn pool. It may already have been minted or rotated by
              someone else.
            </Typography>
            <Link
              component={NextLink}
              href={resolution.returnHref}
              underline="hover"
            >
              Return to the burn pool
            </Link>
          </Stack>
        ) : null}

        {resolution.status === "retryable_read_failure" ? (
          <Stack
            component="section"
            aria-labelledby="rotate-retry-heading"
            spacing={1.5}
            data-resolution="retryable_read_failure"
          >
            <Typography id="rotate-retry-heading" variant="h4" component="h1">
              Could not read the burn pool for Society #{resolution.tokenId}
            </Typography>
            <Typography>
              A temporary read failure prevented confirming whether this target
              is still available. This is not the same as the token being absent
              from the pool.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {resolution.message}
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Link
                component={NextLink}
                href={`/fame/rotate/${resolution.tokenId}`}
                underline="hover"
              >
                Retry this target
              </Link>
              <Link component={NextLink} href="/fame" underline="hover">
                Return to the burn pool
              </Link>
            </Stack>
          </Stack>
        ) : null}

        {resolution.status === "available" ? (
          <Stack
            component="section"
            aria-labelledby="rotate-available-heading"
            spacing={3}
            data-resolution="available"
            data-target-id={resolution.tokenId}
            data-fifo-position={resolution.position}
            data-max-rotations={resolution.maxRotations}
          >
            <Stack spacing={1}>
              <Typography
                id="rotate-available-heading"
                variant="h4"
                component="h1"
              >
                Rotate for Society #{resolution.tokenId}
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                data-testid="rotation-exchange-explanation"
              >
                {ROTATION_EXCHANGE_EXPLANATION}
              </Typography>
            </Stack>

            {/* Target vs offered comparison */}
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              alignItems={{ xs: "stretch", sm: "flex-start" }}
              data-testid="target-offered-comparison"
            >
              <TokenCard
                label="Target"
                tokenId={resolution.tokenId}
                image={resolution.image}
                meta={`FIFO position ${resolution.position} · bound ${resolution.maxRotations}`}
                highlight
              />
              <TokenCard
                label="You offer"
                tokenId={selectedOfferedId}
                image={
                  selectedOfferedId !== null
                    ? ownedTokenImage(selectedOfferedId, ownedTokenImages)
                    : null
                }
                meta={
                  selectedOfferedId !== null
                    ? "Selected Society NFT to surrender"
                    : "Select an owned Society NFT below"
                }
                emptyLabel="No offered NFT selected"
              />
            </Stack>

            {/* Wallet recovery */}
            <Stack
              component="section"
              aria-label="Wallet connection"
              spacing={1}
              data-testid="wallet-region"
              data-wallet-status={walletStatus}
            >
              {walletMessage ? (
                <Typography variant="body2" color="text.secondary">
                  {walletMessage}
                </Typography>
              ) : null}
              {walletControl}
            </Stack>

            {walletStatus === "disconnected" ? (
              <Typography
                variant="body2"
                color="text.secondary"
                data-testid="disconnected-guidance"
              >
                Connect a Base wallet to choose an offered Society NFT and
                complete approval or rotation.
              </Typography>
            ) : null}

            {walletStatus === "wrong_chain" ? (
              <Typography
                variant="body2"
                color="text.secondary"
                data-testid="wrong-chain-guidance"
                data-preserved-target={resolution.tokenId}
              >
                Switch to Base to continue rotating for Society #
                {resolution.tokenId}.
              </Typography>
            ) : null}

            {preflightMessage ? (
              <Typography variant="body2" color="text.secondary">
                {preflightMessage}
              </Typography>
            ) : null}

            {inventoryMessage ? (
              <Typography
                variant="body2"
                color="warning.main"
                role="status"
                data-testid="inventory-message"
              >
                {inventoryMessage}
              </Typography>
            ) : null}

            {/* Acquisition only when no owned NFT */}
            {acquisitionSlot}

            {/* Offered NFT selection */}
            {ownedIds.length > 0 ? (
              <Stack
                component="section"
                aria-label="Select offered Society NFT"
                spacing={1.5}
                data-testid="offered-inventory"
                data-count={ownedIds.length}
              >
                <Typography variant="h6" fontWeight={700}>
                  Choose the Society NFT you will offer
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Select one owned NFT.
                </Typography>
                <Stack
                  direction="row"
                  flexWrap="wrap"
                  useFlexGap
                  spacing={1.5}
                  sx={{ gap: 1.5 }}
                  data-testid="offered-inventory-grid"
                >
                  {ownedIds.map((tokenId) => {
                    const selected = selectedOfferedId === tokenId;
                    const image = ownedTokenImage(tokenId, ownedTokenImages);
                    return (
                      <Button
                        key={tokenId}
                        type="button"
                        variant={selected ? "contained" : "outlined"}
                        aria-pressed={selected}
                        aria-label={`Offer Society NFT ${tokenId}`}
                        onClick={() => onSelectOffered?.(tokenId)}
                        disabled={isPending}
                        data-offered-option={tokenId}
                        data-selected={selected ? "true" : "false"}
                        data-offered-image={image}
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "stretch",
                          gap: 1,
                          p: 1,
                          minHeight: 44,
                          minWidth: 112,
                          maxWidth: 140,
                          fontWeight: 700,
                          textTransform: "none",
                          borderWidth: selected ? 2 : 1,
                        }}
                      >
                        <NextImage
                          src={image}
                          alt={`Society NFT ${tokenId}`}
                          width={120}
                          height={120}
                          sizes="120px"
                          style={{
                            width: "100%",
                            height: "auto",
                            aspectRatio: "1",
                            objectFit: "cover",
                            borderRadius: 8,
                            display: "block",
                          }}
                        />
                        <Typography
                          component="span"
                          variant="body2"
                          fontWeight={700}
                          textAlign="center"
                        >
                          #{tokenId}
                        </Typography>
                      </Button>
                    );
                  })}
                </Stack>
              </Stack>
            ) : null}

            {/* Approve / Rotate actions */}
            {writesVisible && resolution.status === "available" ? (
              <Stack
                component="section"
                aria-label="Approval and rotation actions"
                spacing={1.5}
                data-testid="write-actions"
                data-can-approve={canApprove ? "true" : "false"}
                data-can-rotate={canRotate ? "true" : "false"}
                data-authorized={
                  authorized === null
                    ? "unknown"
                    : authorized
                      ? "true"
                      : "false"
                }
              >
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1.5}
                  alignItems={{ xs: "stretch", sm: "center" }}
                >
                  <Button
                    type="button"
                    variant="outlined"
                    disabled={!canApprove || isPending}
                    onClick={onApprove}
                    aria-label="Approve offered Society NFT for rotator"
                    data-testid="approve-button"
                    sx={{ minHeight: 44, fontWeight: 700 }}
                  >
                    Approve offered NFT
                  </Button>
                  <Button
                    type="button"
                    variant="contained"
                    disabled={!canRotate || isPending}
                    onClick={onRotate}
                    aria-label="Rotate offered Society NFT for target"
                    data-testid="rotate-button"
                    sx={{ minHeight: 44, fontWeight: 700 }}
                  >
                    Rotate for #{resolution.tokenId}
                  </Button>
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  After approval
                  succeeds, confirm rotation with a fresh pool snapshot and
                  bound.
                </Typography>
              </Stack>
            ) : null}

            {/* Disconnected / wrong chain: never show write buttons */}
            {(walletStatus === "disconnected" ||
              walletStatus === "wrong_chain") && (
              <Stack
                data-testid="write-actions-hidden"
                data-can-approve="false"
                data-can-rotate="false"
                sx={{ display: "none" }}
                aria-hidden
              />
            )}

            <FameRotatorStatus
              state={transactionState}
              onRetry={onRetryTransaction}
              onRetryVerification={onRetryVerification}
              onReset={onResetTransaction}
            />
          </Stack>
        ) : null}
      </Stack>
    </Container>
  );
};

/** Resolve owned-token artwork; metadata failure never removes selectability. */
export function ownedTokenImage(
  tokenId: number,
  images: Readonly<Record<number, string>>,
): string {
  const image = images[tokenId];
  if (typeof image === "string" && image.length > 0) {
    return image;
  }
  return FAME_METADATA_FALLBACK_IMAGE;
}

function TokenCard({
  label,
  tokenId,
  image,
  meta,
  highlight,
  emptyLabel,
}: {
  label: string;
  tokenId: number | null;
  image: string | null;
  meta: string;
  highlight?: boolean;
  emptyLabel?: string;
}) {
  return (
    <Stack
      spacing={1}
      sx={{
        flex: 1,
        p: 2,
        borderRadius: 2,
        border: "1px solid",
        borderColor: highlight ? "primary.main" : "divider",
        backgroundColor: "action.hover",
        minWidth: 0,
      }}
      data-token-card={label.toLowerCase().replace(/\s+/g, "-")}
      data-token-id={tokenId ?? ""}
    >
      <Typography variant="overline" color="text.secondary">
        {label}
      </Typography>
      {tokenId !== null && image ? (
        <NextImage
          src={image}
          alt={`Society NFT ${tokenId}`}
          width={200}
          height={200}
          style={{ width: "100%", maxWidth: 200, height: "auto", borderRadius: 8 }}
        />
      ) : (
        <Stack
          alignItems="center"
          justifyContent="center"
          sx={{
            width: "100%",
            maxWidth: 200,
            aspectRatio: "1",
            borderRadius: 2,
            border: "1px dashed",
            borderColor: "divider",
            color: "text.secondary",
            px: 1,
          }}
        >
          <Typography variant="body2" textAlign="center">
            {emptyLabel ?? "—"}
          </Typography>
        </Stack>
      )}
      <Typography variant="h6" fontWeight={700}>
        {tokenId !== null ? `Society #${tokenId}` : "—"}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {meta}
      </Typography>
    </Stack>
  );
}

