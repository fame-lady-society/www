"use client";
import { FC, useCallback, useEffect, useMemo, useState } from "react";
import type { Listing } from "opensea-js";
import { formatUnits } from "viem";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Grid2 from "@mui/material/Unstable_Grid2"; // MUI v5 experimental grid
import CardActionArea from "@mui/material/CardActionArea";
import CardHeader from "@mui/material/CardHeader";
import Box from "@mui/material/Box";
import { useSweepAndWrap } from "@/hooks/useSweepAndWrap";
import { TransactionsModal } from "@/components/TransactionsModal";
import { useReadFameLadySocietyWrapCost } from "@/wagmi";
import { useAccount, useBalance } from "wagmi";
import { client as mainnetClient } from "@/viem/mainnet-client";
import { getEnsName } from "viem/actions";

export type SaveLadyCardProps = {
  listings: Listing[];
  onSelectionChange?: (tokenIds: BigInt[]) => void;
  onRefreshRequested?: () => Promise<void> | void;
};

export const SaveLadyCard: FC<SaveLadyCardProps> = ({
  listings,
  onSelectionChange,
  onRefreshRequested,
}) => {
  const [selected, setSelected] = useState<Set<BigInt>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [sellerNames, setSellerNames] = useState<string[]>([]);
  const { executeSweep, status, txHash, error } = useSweepAndWrap();
  const { data: wrapCostData } = useReadFameLadySocietyWrapCost();

  const FEE_BPS = 250n; // 2.5% platform fee

  const toggle = useCallback(
    (tokenId: bigint) => {
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(tokenId)) {
          next.delete(tokenId);
        } else {
          if (prev.size >= 13) return prev; // cap at 13
          next.add(tokenId);
        }
        onSelectionChange?.(Array.from(next));
        return next;
      });
    },
    [onSelectionChange],
  );

  const sortedListings = useMemo(
    () =>
      [...listings].sort((a, b) => {
        const aVal = Number(
          formatUnits(BigInt(a.price.current.value), a.price.current.decimals),
        );
        const bVal = Number(
          formatUnits(BigInt(b.price.current.value), b.price.current.decimals),
        );
        return aVal - bVal;
      }),
    [listings],
  );

  const costBreakdown = useMemo(() => {
    if (selected.size === 0) {
      return null;
    }
    // Sum listing prices in wei (normalize to 18 decimals)
    const normalize = (value: bigint, decimals: number) => {
      if (decimals === 18) return value;
      if (decimals < 18) return value * 10n ** BigInt(18 - decimals);
      return value / 10n ** BigInt(decimals - 18);
    };
    let listingsWei = 0n;
    for (const l of listings) {
      try {
        const offerItem = l.protocol_data.parameters.offer[0];
        const tokenId = BigInt(offerItem.identifierOrCriteria);
        if (selected.has(tokenId)) {
          listingsWei += normalize(
            BigInt(l.price.current.value),
            l.price.current.decimals,
          );
        }
      } catch {
        // ignore malformed listing
      }
    }
    const wrapCostEach = BigInt(wrapCostData ?? 0n);
    const wrapCostWei = wrapCostEach * BigInt(selected.size);
    const feeWei = ((listingsWei + wrapCostWei) * FEE_BPS) / 10000n;
    const totalWei = listingsWei + wrapCostWei + feeWei;
    return {
      listingsValue: listingsWei,
      wrapValue: wrapCostWei,
      feeValue: feeWei,
      totalValue: totalWei,
      listingsEth: formatUnits(listingsWei, 18),
      wrapEth: formatUnits(wrapCostWei, 18),
      feeEth: formatUnits(feeWei, 18),
      totalEth: formatUnits(totalWei, 18),
    };
  }, [selected, listings, wrapCostData, FEE_BPS]);

  const { address } = useAccount();
  const { data: balance } = useBalance({
    address,
  });

  // Resolve seller names
  useEffect(() => {
    (async () => {
      // Initialize seller names array with addresses first
      const initialNames = listings.map(
        (l) => l.protocol_data.parameters.offerer,
      );
      setSellerNames(initialNames);

      // Resolve ENS names in parallel but update state after each resolution
      const ensPromises = listings.map(async (listing, index) => {
        const sellerAddress = listing.protocol_data.parameters.offerer;

        try {
          const name = await getEnsName(mainnetClient, {
            address: sellerAddress as `0x${string}`,
          });

          if (name) {
            setSellerNames((prev) => {
              const newNames = [...prev];
              newNames[index] = name;
              return newNames;
            });
          }
        } catch (error) {
          // Keep the address if ENS resolution fails
          console.warn(`Failed to resolve ENS for ${sellerAddress}:`, error);
        }
      });

      // Wait for all promises to complete
      await Promise.allSettled(ensPromises);
    })();
  }, [listings]);

  return (
    <>
      <Card sx={{ mb: 2 }}>
        <CardHeader title="Sweep and Wrap" />
        <CardContent>
          <Typography variant="body1" component="div" sx={{ mb: 1 }}>
            select listings you want to sweep and wrap in a single transaction
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            an additional 2.5% fee (in addition to the wrap fee of{" "}
            {formatUnits(BigInt(wrapCostData ?? 0n), 18)} E) is collected by the
            Society
          </Typography>
          <Typography variant="body1" component="div" sx={{ mb: 2 }}>
            select listings you want to sweep and wrap
          </Typography>

          <Box
            component="div"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              mb: 2,
              flexWrap: "wrap",
            }}
          >
            <Typography variant="body2">selected: {selected.size}</Typography>

            <Button
              variant="outlined"
              size="small"
              disabled={selected.size === 0 || status === "submitting"}
              onClick={async () => {
                const selectedListings = listings.filter((l) => {
                  try {
                    const offerItem = l.protocol_data.parameters.offer[0];
                    return selected.has(BigInt(offerItem.identifierOrCriteria));
                  } catch {
                    return false;
                  }
                });
                setModalOpen(true);
                await executeSweep(selectedListings);
                // After sweep attempt, trigger a listings refresh
                await onRefreshRequested?.();
              }}
            >
              Sweep and Wrap
            </Button>
          </Box>
          <Box
            component="div"
            sx={{ display: "flex", flexDirection: "column", gap: 0.5, mb: 1 }}
          >
            <Typography
              variant="body2"
              sx={{
                minHeight: "1.5em",
                color:
                  costBreakdown &&
                  balance &&
                  costBreakdown.totalValue > balance.value
                    ? "error.main"
                    : undefined,
              }}
            >
              {balance
                ? `balance: ${formatUnits(balance.value, balance.decimals)} ETH`
                : "balance: —"}
            </Typography>
            <Typography variant="body2" sx={{ minHeight: "1.5em" }}>
              {costBreakdown
                ? `estimate: ${costBreakdown.totalEth} ETH (listings ${costBreakdown.listingsEth} + wrap ${costBreakdown.wrapEth} + fee ${costBreakdown.feeEth})`
                : ""}
            </Typography>
          </Box>
        </CardContent>
      </Card>
      <Grid2 container spacing={1}>
        {sortedListings.map((l, index) => {
          const offerItem = l.protocol_data.parameters.offer[0];
          const tokenId = BigInt(offerItem.identifierOrCriteria);
          const priceEth = formatUnits(
            BigInt(l.price.current.value),
            l.price.current.decimals,
          );
          const isSelected = selected.has(tokenId);
          return (
            <Grid2 xs={12} sm={6} md={4} lg={3} key={l.order_hash + tokenId}>
              <Card>
                <CardActionArea
                  onClick={() => toggle(tokenId)}
                  sx={{
                    ...(isSelected && {
                      borderColor: "primary.main",
                      borderStyle: "solid",
                      borderWidth: 5,
                    }),
                  }}
                >
                  <CardHeader title={`FLS ${Number(tokenId)}`} />
                  <CardMedia
                    component="img"
                    image={`https://fame.support/fls/thumb/${tokenId}`}
                    sx={{
                      objectFit: "contain",
                      width: "100%",
                      transition: "transform 0.5s ease-in-out",
                    }}
                  />
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">
                      Price: {priceEth} ETH
                    </Typography>
                    <Typography
                      variant="caption"
                      display="block"
                      textOverflow="ellipsis"
                      overflow="hidden"
                      whiteSpace="nowrap"
                      sx={{
                        mt: 0.5,
                      }}
                    >
                      Seller:{" "}
                      {sellerNames[index] ?? l.protocol_data.parameters.offerer}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid2>
          );
        })}
      </Grid2>
      <TransactionsModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        transactions={txHash ? [{ kind: "sweepAndWrap", hash: txHash }] : []}
        onTransactionConfirmed={async () => {
          setModalOpen(false);
          setSelected(new Set());
          // After confirmation, refresh again to reflect updated availability
          await onRefreshRequested?.();
        }}
        topContent={
          status === "building" ? (
            <Typography>Building orders…</Typography>
          ) : status === "submitting" ? (
            <Typography>Waiting for your wallet…</Typography>
          ) : status === "error" ? (
            <Typography color="error">{error}</Typography>
          ) : null
        }
      />
    </>
  );
};
