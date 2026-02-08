"use client";

import { type FC, useCallback, useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Chip from "@mui/material/Chip";
import { useSearchParams, useRouter } from "next/navigation";
import { baseSepolia, mainnet, sepolia } from "viem/chains";
import { isHex, keccak256, toHex } from "viem";
import {
  SOCIAL_PROVIDERS,
  getSocialAttestationKey,
  getSocialSubtagKey,
  getSocialAttestationStatus,
  type SocialProviderId,
  type SocialAttestationStatus,
} from "@/features/naming/attestations";
import { flsNamingAddress } from "@/wagmi";
import type { NetworkType } from "../hooks/useOwnedGateNftTokens";
import type { FullIdentity } from "../hooks/useIdentity";
import { useProfileBatchContext } from "../context/ProfileBatchContext";

type PendingAttestationPayload = {
  provider: SocialProviderId;
  attestation: `0x${string}`;
  subtag: `0x${string}`;
  name: string;
};

type StagedSocialChange = {
  attestation: `0x${string}`;
  subtag: `0x${string}`;
};

function getChainId(network: NetworkType) {
  switch (network) {
    case "sepolia":
      return sepolia.id;
    case "base-sepolia":
      return baseSepolia.id;
    case "mainnet":
      return mainnet.id;
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

function getSocialChangeIds(provider: SocialProviderId) {
  return {
    attestationId: `social:${provider}:attestation`,
    subtagId: `social:${provider}:subtag`,
  };
}

export interface SocialAttestationsEditorProps {
  network: NetworkType;
  identity: FullIdentity;
  disabled?: boolean;
  stagedSocialChanges?: Partial<Record<SocialProviderId, StagedSocialChange>>;
}

export const SocialAttestationsEditor: FC<SocialAttestationsEditorProps> = ({
  network,
  identity,
  disabled = false,
  stagedSocialChanges,
}) => {
  const { stageChange: onStageMetadataChange, removeChange: onRemoveMetadataChange } =
    useProfileBatchContext();
  const router = useRouter();
  const searchParams = useSearchParams();
  const chainId = getChainId(network);
  const [pending, setPending] = useState<PendingAttestationPayload | null>(null);
  const [pendingStatus, setPendingStatus] = useState<SocialAttestationStatus | null>(null);
  const [pendingError, setPendingError] = useState<string | null>(null);
  const [activeProvider, setActiveProvider] = useState<SocialProviderId | null>(
    null,
  );

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

  const stageAttestation = useCallback(
    (provider: SocialProviderId, attestation: `0x${string}`, subtag: `0x${string}`) => {
      const { attestationId, subtagId } = getSocialChangeIds(provider);
      const attestationKey = getSocialAttestationKey(provider);
      const subtagKey = getSocialSubtagKey(provider);
      const label = `Update ${formatProvider(provider)} attestation`;

      onStageMetadataChange(attestationId, attestationKey, attestation, label);
      onStageMetadataChange(subtagId, subtagKey, subtag, label);
    },
    [onStageMetadataChange],
  );

  const stageClearAttestation = useCallback(
    (provider: SocialProviderId) => {
      if (!chainId) {
        setPendingError("Social attestations are not supported on mainnet yet.");
        return;
      }
      const { attestationId, subtagId } = getSocialChangeIds(provider);
      const attestationKey = getSocialAttestationKey(provider);
      const subtagKey = getSocialSubtagKey(provider);
      const label = `Clear ${formatProvider(provider)} attestation`;

      onStageMetadataChange(attestationId, attestationKey, "0x", label);
      onStageMetadataChange(subtagId, subtagKey, "0x", label);
    },
    [chainId, onStageMetadataChange],
  );

  const unstageProvider = useCallback(
    (provider: SocialProviderId) => {
      const { attestationId, subtagId } = getSocialChangeIds(provider);
      onRemoveMetadataChange(attestationId);
      onRemoveMetadataChange(subtagId);
    },
    [onRemoveMetadataChange],
  );

  useEffect(() => {
    if (!pending || !pendingStatus) return;
    stageAttestation(pending.provider, pending.attestation, pending.subtag);
  }, [pending, pendingStatus, stageAttestation]);

  return (
    <Box component="div" sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {pendingError && (
        <Alert severity="warning" onClose={() => setPendingError(null)}>
          {pendingError}
        </Alert>
      )}

      {pending && (
        <Alert severity="info">
          Attestation ready for {formatProvider(pending.provider)}. Staged for
          batch submission.
        </Alert>
      )}

      {currentAttestations.map(({ provider, status }) => {
        const pendingForProvider = pending?.provider === provider ? pending : null;
        const isActive = activeProvider === provider;
        const stagedChange = stagedSocialChanges?.[provider];
        const isClearStaged =
          stagedChange?.attestation === "0x" && stagedChange?.subtag === "0x";
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
            {stagedChange && (
              <Typography variant="body2" color="text.secondary">
                {isClearStaged ? "Clear staged for batch" : "Update staged for batch"}
              </Typography>
            )}

            <Box component="div" sx={{ display: "flex", gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => handleStartLink(provider)}
                disabled={disabled || isActive || !isSupportedNetwork}
                startIcon={isActive ? <CircularProgress size={16} /> : null}
              >
                {isActive ? "Starting..." : "Link Account"}
              </Button>

              {stagedChange && !isClearStaged && (
                <Button
                  variant="text"
                  size="small"
                  color="warning"
                  onClick={() => unstageProvider(provider)}
                  disabled={disabled}
                >
                  Undo Staged
                </Button>
              )}

              {status && (
                <Button
                  variant="text"
                  size="small"
                  color="warning"
                  onClick={() =>
                    isClearStaged
                      ? unstageProvider(provider)
                      : stageClearAttestation(provider)
                  }
                  disabled={disabled || !isSupportedNetwork}
                >
                  {isClearStaged ? "Undo Clear" : "Clear"}
                </Button>
              )}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};
