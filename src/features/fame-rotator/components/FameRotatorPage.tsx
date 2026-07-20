"use client";

import Button from "@mui/material/Button";
import MenuList from "@mui/material/MenuList";
import Typography from "@mui/material/Typography";
import { ConnectKitButton } from "connectkit";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { base } from "viem/chains";
import { usePublicClient, useSwitchChain } from "wagmi";
import { DefaultProvider } from "@/context/default";
import { LinksMenuItems } from "@/features/appbar/components/LinksMenuItems";
import { SiteMenu } from "@/features/appbar/components/SiteMenu";
import { Main } from "@/layouts/Main";
import { fameMirrorAbi } from "@/wagmi";
import {
  FAME_BURN_POOL_ROTATOR_BASE_ADDRESS,
  getFameRotatorConfig,
} from "../config";
import { useFameRotatorExecutionEnvironment } from "../hooks/useFameRotatorExecutionEnvironment";
import { useFameRotatorPreflight } from "../hooks/useFameRotatorPreflight";
import { useFameRotatorTransaction } from "../hooks/useFameRotatorTransaction";
import { isRotatorAuthorizedForOffered } from "../transactions/contractRequests";
import type { BurnPoolTargetResolution } from "../target";
import { FameRotatorAcquisition } from "./FameRotatorAcquisition";
import {
  FameRotatorView,
  type FameRotatorWalletStatus,
} from "./FameRotatorView";

export type { FameRotatorWalletStatus, FameRotatorViewProps } from "./FameRotatorView";
export { FameRotatorView } from "./FameRotatorView";

export interface FameRotatorPageProps {
  resolution: BurnPoolTargetResolution;
}

function FameRotatorExperience({ resolution }: FameRotatorPageProps) {
  const config = getFameRotatorConfig(base.id);
  const preflight = useFameRotatorPreflight();
  const execution = useFameRotatorExecutionEnvironment({
    rotatorAddress: config.status === "configured" ? config.address : null,
    expectedRuntimeBytecode:
      config.status === "configured" ? config.expectedRuntimeBytecode : null,
    expectedFame: config.status === "configured" ? config.expectedFame : null,
    expectedMirror:
      config.status === "configured" ? config.expectedMirror : null,
  });
  const publicClient = usePublicClient({ chainId: base.id });
  const {
    switchChainAsync,
    isPending: isSwitching,
    error: switchChainError,
  } = useSwitchChain();

  const [selectedOfferedId, setSelectedOfferedId] = useState<number | null>(
    null,
  );
  // Bumps after approval so rotation prep is treated as discarded.
  const [approvalEpoch, setApprovalEpoch] = useState(0);

  const ownedIds = preflight.preflight.ownedIds;

  // Invalidate selection when account/ownership changes remove the offered id.
  useEffect(() => {
    if (selectedOfferedId === null) return;
    if (!ownedIds.includes(selectedOfferedId)) {
      setSelectedOfferedId(null);
    }
  }, [ownedIds, selectedOfferedId]);

  // Drop selection on disconnect / account change via preflight reset.
  useEffect(() => {
    if (preflight.preflight.status === "disconnected") {
      setSelectedOfferedId(null);
    }
  }, [preflight.preflight.status]);

  const refreshAll = useCallback(async () => {
    await preflight.refetch();
  }, [preflight]);

  const transaction = useFameRotatorTransaction({
    account: execution.account,
    executionReady:
      execution.environment.canExecute &&
      resolution.status === "available" &&
      preflight.preflight.status === "direct_eligible",
    verifyEnvironment: execution.verify,
    refresh: refreshAll,
    onApprovalVerified: () => {
      setApprovalEpoch((epoch) => epoch + 1);
    },
  });

  const authorizationQuery = useQuery({
    queryKey: [
      "fame-rotator",
      "authorization",
      execution.account,
      selectedOfferedId,
      approvalEpoch,
      FAME_BURN_POOL_ROTATOR_BASE_ADDRESS,
    ],
    enabled:
      execution.environment.status === "ready" &&
      execution.account !== undefined &&
      selectedOfferedId !== null &&
      publicClient !== undefined &&
      config.status === "configured",
    queryFn: async (): Promise<boolean> => {
      if (
        !publicClient ||
        !execution.account ||
        selectedOfferedId === null ||
        config.status !== "configured"
      ) {
        return false;
      }
      const [getApproved, isApprovedForAll] = await Promise.all([
        publicClient.readContract({
          address: config.expectedMirror,
          abi: fameMirrorAbi,
          functionName: "getApproved",
          args: [BigInt(selectedOfferedId)],
        }),
        publicClient.readContract({
          address: config.expectedMirror,
          abi: fameMirrorAbi,
          functionName: "isApprovedForAll",
          args: [execution.account, config.address],
        }),
      ]);
      return isRotatorAuthorizedForOffered({
        rotator: config.address,
        getApproved: typeof getApproved === "string" ? getApproved : null,
        isApprovedForAll:
          typeof isApprovedForAll === "boolean" ? isApprovedForAll : null,
      });
    },
    staleTime: 5_000,
  });

  const authorized =
    authorizationQuery.data === undefined ? null : authorizationQuery.data;

  let walletStatus: FameRotatorWalletStatus;
  switch (execution.environment.status) {
    case "disconnected":
      walletStatus = "disconnected";
      break;
    case "wrong_chain":
      walletStatus = "wrong_chain";
      break;
    case "checking":
      walletStatus = "checking";
      break;
    case "ready":
      walletStatus = "ready";
      break;
    default:
      walletStatus = "blocked";
  }

  const walletMessage =
    switchChainError && execution.environment.status === "wrong_chain"
      ? "The Base network switch was not completed. Try again."
      : execution.environment.message;

  let walletControl: ReactNode = undefined;
  switch (execution.environment.status) {
    case "disconnected":
      walletControl = <ConnectKitButton />;
      break;
    case "wrong_chain":
      walletControl = (
        <Button
          type="button"
          variant="outlined"
          disabled={isSwitching}
          onClick={() =>
            void switchChainAsync({ chainId: base.id }).catch(() => undefined)
          }
          sx={{ minHeight: 44 }}
        >
          {isSwitching ? "Switching to Base…" : "Switch to Base"}
        </Button>
      );
      break;
    case "error":
    case "incompatible":
      walletControl = (
        <Button
          type="button"
          variant="outlined"
          onClick={() => void execution.retry()}
          sx={{ minHeight: 44 }}
        >
          Check again
        </Button>
      );
      break;
  }

  const targetAvailable = resolution.status === "available";
  const canSelect =
    preflight.preflight.canSelectOffered && selectedOfferedId !== null;
  const writeBase =
    walletStatus === "ready" &&
    targetAvailable &&
    canSelect &&
    !transaction.isPending &&
    !transaction.state.error?.blockRetryWrite;

  // Terminal success (including refresh failure after proof) must not re-arm writes.
  const rotationSucceeded =
    (transaction.state.status === "verified" &&
      transaction.state.action === "rotate") ||
    (transaction.state.status === "refresh_failed_after_verified" &&
      transaction.state.action === "rotate");

  const writeStatusAllowsAction =
    !rotationSucceeded &&
    (transaction.state.status === "idle" ||
      transaction.state.status === "failed" ||
      transaction.state.status === "cancelled" ||
      transaction.state.status === "reverted" ||
      transaction.state.status === "different_transaction" ||
      (transaction.state.status === "verified" &&
        transaction.state.action === "approve") ||
      (transaction.state.status === "refresh_failed_after_verified" &&
        transaction.state.action === "approve"));

  // Approval needed when not yet authorized; rotate when authorized.
  const canApprove =
    writeBase && authorized === false && writeStatusAllowsAction;

  const canRotate =
    writeBase && authorized === true && writeStatusAllowsAction;

  const inventoryMessage = useMemo(() => {
    if (preflight.preflight.status === "incomplete_inventory") {
      return preflight.preflight.message;
    }
    if (preflight.preflight.status === "read_failure") {
      return preflight.preflight.message;
    }
    if (
      selectedOfferedId !== null &&
      preflight.preflight.status === "direct_eligible" &&
      !ownedIds.includes(selectedOfferedId)
    ) {
      return "The offered Society NFT is no longer in your inventory. Select another.";
    }
    return null;
  }, [ownedIds, preflight.preflight, selectedOfferedId]);

  const acquisitionSlot =
    preflight.preflight.status === "needs_skip_repair" ||
    preflight.preflight.status === "needs_fame" ||
    preflight.preflight.status === "needs_reconciliation" ? (
      <FameRotatorAcquisition
        preflight={preflight.preflight}
        onInvalidate={() => void preflight.refetch()}
      />
    ) : null;

  const handleApprove = () => {
    if (selectedOfferedId === null) return;
    void transaction.approve(selectedOfferedId).then(() => {
      void authorizationQuery.refetch();
    });
  };

  const handleRotate = () => {
    if (resolution.status !== "available" || selectedOfferedId === null) {
      return;
    }
    void transaction.rotate(resolution.tokenId, selectedOfferedId);
  };

  const handleRetry = () => {
    if (transaction.state.status === "verification_pending") {
      void transaction.retryVerification();
      return;
    }
    if (transaction.state.error?.kind === "refresh_failure") {
      void refreshAll().catch(() => undefined);
      return;
    }
    transaction.reset();
  };

  return (
    <FameRotatorView
      resolution={resolution}
      walletStatus={walletStatus}
      walletMessage={walletMessage}
      walletControl={walletControl}
      ownedIds={preflight.preflight.canSelectOffered ? ownedIds : []}
      selectedOfferedId={selectedOfferedId}
      onSelectOffered={setSelectedOfferedId}
      authorized={authorized}
      canApprove={Boolean(canApprove)}
      canRotate={Boolean(canRotate)}
      isPending={transaction.isPending || isSwitching}
      onApprove={handleApprove}
      onRotate={handleRotate}
      acquisitionSlot={acquisitionSlot}
      transactionState={transaction.state}
      onRetryTransaction={handleRetry}
      onRetryVerification={() => void transaction.retryVerification()}
      onResetTransaction={transaction.reset}
      preflightMessage={
        walletStatus === "ready" || walletStatus === "checking"
          ? preflight.preflight.message
          : undefined
      }
      inventoryMessage={inventoryMessage}
    />
  );
}

/**
 * Full rotation page chrome matching FameSwap / Society NFT auction shells.
 */
export function FameRotatorPage({ resolution }: FameRotatorPageProps) {
  return (
    <DefaultProvider base>
      <Main
        menu={
          <MenuList dense disablePadding>
            <LinksMenuItems />
            <SiteMenu isFame />
          </MenuList>
        }
        title={
          <Typography variant="h5" component="h1" marginLeft={2}>
            {resolution.status === "available" ||
            resolution.status === "unavailable" ||
            resolution.status === "retryable_read_failure"
              ? `Rotate #${resolution.tokenId}`
              : "Rotate"}
          </Typography>
        }
      >
        <FameRotatorExperience resolution={resolution} />
      </Main>
    </DefaultProvider>
  );
}
