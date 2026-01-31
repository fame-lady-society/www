"use client";

import { type FC, useCallback, useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Chip from "@mui/material/Chip";
import { useSearchParams, useRouter } from "next/navigation";
import { useWaitForTransactionReceipt } from "wagmi";
import { baseSepolia, sepolia } from "viem/chains";
import { isHex, keccak256, toHex } from "viem";
import {
  SOCIAL_PROVIDERS,
  getSocialAttestationKey,
  getSocialSubtagKey,
  getSocialAttestationStatus,
  type SocialProviderId,
  type SocialAttestationStatus,
} from "@/features/naming/attestations";
import { flsNamingAddress, useWriteFlsNamingSetMetadataBatch } from "@/wagmi";
import type { NetworkType } from "../hooks/useOwnedGateNftTokens";
import type { FullIdentity } from "../hooks/useIdentity";

type PendingAttestationPayload = {
  provider: SocialProviderId;
  attestation: `0x${string}`;
  subtag: `0x${string}`;
  name: string;
};

type RefreshingState = {
  provider: SocialProviderId;
  previousStatusKey: string;
  startedAt: number;
};

function getChainId(network: NetworkType) {
  switch (network) {
    case "sepolia":
      return sepolia.id;
    case "base-sepolia":
      return baseSepolia.id;
    default:
      return null;
  }
}

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function parsePendingPayload(value: string): PendingAttestationPayload | null {
  try {
    const decoded = JSON.parse(decodeBase64Url(value)) as PendingAttestationPayload;
    if (!SOCIAL_PROVIDERS.includes(decoded.provider)) return null;
    if (!isHex(decoded.attestation) || !isHex(decoded.subtag)) return null;
    if (!decoded.name) return null;
    return decoded;
  } catch {
    return null;
  }
}

function isAddressValue(value: string): value is `0x${string}` {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

function formatProvider(provider: SocialProviderId): string {
  return provider === "x" ? "X" : "Discord";
}

function getStatusKey(status: SocialAttestationStatus | null): string {
  if (!status) return "none";
  return `${status.provider}:${status.handle}:${status.verified ? "1" : "0"}`;
}

export interface SocialAttestationsEditorProps {
  network: NetworkType;
  identity: FullIdentity;
  onRefetchIdentity?: () => Promise<void> | void;
}

export const SocialAttestationsEditor: FC<SocialAttestationsEditorProps> = ({
  network,
  identity,
  onRefetchIdentity,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const chainId = getChainId(network);
  const [pending, setPending] = useState<PendingAttestationPayload | null>(null);
  const [pendingStatus, setPendingStatus] = useState<SocialAttestationStatus | null>(null);
  const [pendingError, setPendingError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<RefreshingState | null>(null);
  const [activeProvider, setActiveProvider] = useState<SocialProviderId | null>(
    null,
  );

  const { writeContract, data: txHash, isPending, error, reset } =
    useWriteFlsNamingSetMetadataBatch();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  useEffect(() => {
    let active = true;
    const payload = searchParams?.get("socialAttestation");
    if (!payload || !chainId) return () => undefined;

    const run = async () => {
      const parsed = parsePendingPayload(payload);
      if (!parsed) {
        setPendingError("Unable to parse attestation payload.");
        return;
      }
      if (parsed.name !== identity.name) {
        setPendingError("Attestation does not match this identity.");
        return;
      }

      setPending(parsed);
      setPendingError(null);

      const attestorEnv = process.env.NEXT_PUBLIC_SOCIAL_ATTESTOR_ADDRESS;
      const attestorAddress =
        typeof attestorEnv === "string" && isAddressValue(attestorEnv)
          ? attestorEnv
          : null;
      const expectedAudience =
        typeof process.env.NEXT_PUBLIC_SOCIAL_ATTESTATION_AUD === "string"
          ? process.env.NEXT_PUBLIC_SOCIAL_ATTESTATION_AUD
          : undefined;

      if (!attestorAddress) {
        setPendingError("Attestor address not configured.");
        return;
      }

      const verifyingContract =
        flsNamingAddress[chainId as keyof typeof flsNamingAddress];
      if (!verifyingContract) {
        setPendingError("Naming contract not configured for this network.");
        return;
      }

      const status = await getSocialAttestationStatus(
        parsed.provider,
        parsed.attestation,
        {
          chainId,
          verifyingContract,
          attestorAddress,
          namehash: keccak256(toHex(identity.name)),
          expectedAudience,
        },
      );

      if (!active) return;

      if (!status) {
        setPendingError("Attestation payload failed verification.");
      }
      setPendingStatus(status);

      const url = new URL(window.location.href);
      url.searchParams.delete("socialAttestation");
      url.searchParams.delete("provider");
      router.replace(url.pathname + url.search);
    };

    run();

    return () => {
      active = false;
    };
  }, [searchParams, identity.name, router, chainId]);

  const currentAttestations = useMemo(() => {
    return SOCIAL_PROVIDERS.map((provider) => ({
      provider,
      status: identity.socialAttestations.find((entry) => entry.provider === provider) ?? null,
    }));
  }, [identity.socialAttestations]);

  const statusByProvider = useMemo(() => {
    return new Map(
      currentAttestations.map(({ provider, status }) => [provider, status] as const),
    );
  }, [currentAttestations]);

  const handleStartLink = useCallback(
    async (provider: SocialProviderId) => {
      setActiveProvider(provider);
      try {
        const response = await fetch(
          `/api/attestations/oauth/${provider}/start?name=${encodeURIComponent(
            identity.name,
          )}&returnTo=${encodeURIComponent(window.location.href)}`,
        );
        if (!response.ok) {
          const body = await response.json();
          throw new Error(body?.error ?? "Unable to start OAuth");
        }
        const data = (await response.json()) as { url?: string };
        if (!data.url) {
          throw new Error("Missing authorization URL");
        }
        window.location.assign(data.url);
      } catch (err) {
        setPendingError(
          err instanceof Error ? err.message : "Failed to start OAuth",
        );
        setActiveProvider(null);
      }
    },
    [identity.name],
  );

  const handleWriteAttestation = useCallback(() => {
    if (!pending || !chainId) return;
    const attestationKey = getSocialAttestationKey(pending.provider);
    const subtagKey = getSocialSubtagKey(pending.provider);
    setActiveProvider(pending.provider);

    writeContract({
      chainId,
      args: [
        [attestationKey, subtagKey],
        [pending.attestation, pending.subtag],
      ],
    });
  }, [pending, writeContract, chainId]);

  const handleClearAttestation = useCallback(
    (provider: SocialProviderId) => {
      if (!chainId) {
        setPendingError("Social attestations are not supported on mainnet yet.");
        return;
      }
      setActiveProvider(provider);
      writeContract({
        chainId,
        args: [
          [getSocialAttestationKey(provider), getSocialSubtagKey(provider)],
          ["0x", "0x"],
        ],
      });
    },
    [writeContract, chainId],
  );

  useEffect(() => {
    if (isSuccess && activeProvider) {
      const previousStatusKey = getStatusKey(statusByProvider.get(activeProvider) ?? null);
      setRefreshing({
        provider: activeProvider,
        previousStatusKey,
        startedAt: Date.now(),
      });
      setPending(null);
      setPendingStatus(null);
      setActiveProvider(null);
      reset();
      void onRefetchIdentity?.();
    }
  }, [isSuccess, activeProvider, reset, statusByProvider, onRefetchIdentity]);

  useEffect(() => {
    if (!refreshing) return;
    const currentStatusKey = getStatusKey(
      statusByProvider.get(refreshing.provider) ?? null,
    );
    if (currentStatusKey !== refreshing.previousStatusKey) {
      setRefreshing(null);
    }
  }, [refreshing, statusByProvider]);

  useEffect(() => {
    if (!refreshing) return;
    const timeout = window.setTimeout(() => {
      setRefreshing(null);
    }, 30000);
    return () => window.clearTimeout(timeout);
  }, [refreshing]);

  const isWorking = isPending || isConfirming;

  return (
    <Box component="div" sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {pendingError && (
        <Alert severity="warning" onClose={() => setPendingError(null)}>
          {pendingError}
        </Alert>
      )}

      {error && (
        <Alert severity="error" onClose={() => reset()}>
          {error.message}
        </Alert>
      )}

      {pending && (
        <Alert severity="info">
          Attestation ready for {formatProvider(pending.provider)}. Review and
          save to chain.
        </Alert>
      )}

      {currentAttestations.map(({ provider, status }) => {
        const pendingForProvider = pending?.provider === provider ? pending : null;
        const isActive = activeProvider === provider;
        const isRefreshing = refreshing?.provider === provider;
        const isSupportedNetwork = !!chainId;
        return (
          <Box
            key={provider}
            component="div"
            sx={{
              border: "1px solid rgba(0,0,0,0.1)",
              borderRadius: 1,
              p: 2,
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
            }}
          >
            <Box component="div" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {formatProvider(provider)}
              </Typography>
              {status?.verified && <Chip label="Verified" size="small" color="success" />}
              {status && !status.verified && (
                <Chip label="Unverified" size="small" color="warning" />
              )}
            </Box>

            {status ? (
              <Typography variant="body2">
                Linked handle: <strong>{status.handle}</strong>
              </Typography>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No attestation stored yet.
              </Typography>
            )}

            {pendingForProvider && pendingStatus && (
              <Typography variant="body2" color="text.secondary">
                Pending handle: <strong>{pendingStatus.handle}</strong>
              </Typography>
            )}

            {isRefreshing && (
              <Typography variant="body2" color="text.secondary">
                Refreshing attestation...
              </Typography>
            )}

            <Box component="div" sx={{ display: "flex", gap: 1 }}>
              {pendingForProvider ? (
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleWriteAttestation}
                  disabled={isWorking || isRefreshing || !isSupportedNetwork}
                  startIcon={
                    (isWorking && isActive) || isRefreshing ? (
                      <CircularProgress size={16} />
                    ) : null
                  }
                >
                  {isWorking && isActive
                    ? "Saving..."
                    : isRefreshing
                      ? "Refreshing..."
                      : "Save Attestation"}
                </Button>
              ) : (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleStartLink(provider)}
                  disabled={(isWorking && isActive) || isRefreshing || !isSupportedNetwork}
                  startIcon={
                    (isWorking && isActive) || isRefreshing ? (
                      <CircularProgress size={16} />
                    ) : null
                  }
                >
                  {isWorking && isActive
                    ? "Starting..."
                    : isRefreshing
                      ? "Refreshing..."
                      : "Link Account"}
                </Button>
              )}

              {status && (
                <Button
                  variant="text"
                  size="small"
                  color="warning"
                  onClick={() => handleClearAttestation(provider)}
                  disabled={(isWorking && isActive) || isRefreshing}
                >
                  Clear
                </Button>
              )}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};
