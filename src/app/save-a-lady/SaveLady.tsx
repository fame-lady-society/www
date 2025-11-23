"use client";
import { useEffect, useState, useCallback } from "react";
import type { GetListingsResponse, Listing } from "opensea-js";
import { DefaultProvider } from "@/context/default";
import Head from "next/head";
import MenuList from "@mui/material/MenuList";
import Typography from "@mui/material/Typography";
import { Main } from "@/layouts/Main";
import { LinksMenuItems } from "@/features/appbar/components/LinksMenuItems";
import { SiteMenu } from "@/features/appbar/components/SiteMenu";
import Container from "@mui/material/Container";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import { SaveLadyCard } from "@/features/save/components/SaveLadyCard";
import { AppMain } from "@/layouts/AppMain";

export const SaveLady = ({
  initialListings,
}: {
  initialListings?: Listing[];
}) => {
  const [listings, setListings] = useState<Listing[]>(initialListings || []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reloadListings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/society-listings");
      if (!res.ok) throw new Error(`Failed to load listings (${res.status})`);
      const json: GetListingsResponse = await res.json();
      setListings(json.listings || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialListings && initialListings.length > 0) {
      setLoading(false);
      return;
    }
    reloadListings();
  }, [initialListings, reloadListings]);

  return (
    <>
      <Container sx={{ py: 2 }}>
        {loading && <CircularProgress size={32} />}
        {error && <Alert severity="error">{error}</Alert>}
        {!loading && !error && (
          <SaveLadyCard
            listings={listings}
            onRefreshRequested={reloadListings}
          />
        )}
      </Container>
    </>
  );
};
