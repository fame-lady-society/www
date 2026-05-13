"use client";

import { useEffect, useMemo, useState } from "react";
import { base } from "viem/chains";
import { usePublicClient } from "wagmi";
import { FAME_SWAP_ARTIFACT_MANIFEST } from "../artifacts/manifest";
import type { FameSwapConfig } from "../config";
import { fameRouterAbi } from "../router/abi";
import {
  liveReadiness,
  routerPolicyTargetKey,
  staticReadiness,
  type RouterPolicyReader,
  type RouterPolicySnapshot,
} from "../solver/readiness";
import type { FameSwapReadiness, FameSwapReadinessBlocked } from "../solver/types";

function pendingReadiness(
  routerAddress: NonNullable<FameSwapConfig["routerAddress"]>,
): FameSwapReadinessBlocked {
  return {
    status: "not_live_ready",
    reason: "read_error",
    message: "Checking live FAME router readiness on Base.",
    routerAddress,
  };
}

function clientUnavailableReadiness(
  routerAddress: NonNullable<FameSwapConfig["routerAddress"]>,
): FameSwapReadinessBlocked {
  return {
    status: "not_live_ready",
    reason: "read_error",
    message: "Could not create a Base public client for router readiness.",
    routerAddress,
  };
}

function toFeePpm(value: bigint | number): bigint {
  return typeof value === "bigint" ? value : BigInt(value);
}

export function useFameSwapReadiness(config: FameSwapConfig): {
  readiness: FameSwapReadiness;
  isChecking: boolean;
} {
  const publicClient = usePublicClient({ chainId: base.id });
  const staticResult = useMemo(() => staticReadiness(config), [config]);
  const [readiness, setReadiness] = useState<FameSwapReadiness>(() =>
    staticResult.status === "ready"
      ? pendingReadiness(staticResult.routerAddress)
      : staticResult,
  );
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (staticResult.status === "not_live_ready") {
      setReadiness(staticResult);
      setIsChecking(false);
      return () => {
        cancelled = true;
      };
    }

    if (!publicClient) {
      setReadiness(clientUnavailableReadiness(staticResult.routerAddress));
      setIsChecking(false);
      return () => {
        cancelled = true;
      };
    }

    const reader: RouterPolicyReader = {
      read: async (routerAddress): Promise<RouterPolicySnapshot> => {
        const feePpm = await publicClient.readContract({
          address: routerAddress,
          abi: fameRouterAbi,
          functionName: "feePpm",
        });

        const familyResults = await Promise.all(
          FAME_SWAP_ARTIFACT_MANIFEST.requiredVenueTargets.map(
            async (target) => {
              const enabled = await publicClient.readContract({
                address: routerAddress,
                abi: fameRouterAbi,
                functionName: "venueFamilyEnabled",
                args: [target.familyOrdinal],
              });
              return [target.familyOrdinal, enabled] as const;
            },
          ),
        );

        const targetResults = await Promise.all(
          FAME_SWAP_ARTIFACT_MANIFEST.requiredVenueTargets.map(
            async (target) => {
              const enabled = await publicClient.readContract({
                address: routerAddress,
                abi: fameRouterAbi,
                functionName: "venueTargetEnabled",
                args: [target.familyOrdinal, target.target],
              });
              return [
                routerPolicyTargetKey(target.familyOrdinal, target.target),
                enabled,
              ] as const;
            },
          ),
        );

        const hookDataResults = await Promise.all(
          FAME_SWAP_ARTIFACT_MANIFEST.requiredV4HookDataKeys.map(
            async (hookDataKey) => {
              const enabled = await publicClient.readContract({
                address: routerAddress,
                abi: fameRouterAbi,
                functionName: "v4HookDataHashEnabled",
                args: [hookDataKey],
              });
              return [hookDataKey.toLowerCase(), enabled] as const;
            },
          ),
        );

        return {
          feePpm: toFeePpm(feePpm),
          venueFamilies: new Map(familyResults),
          venueTargets: new Map(targetResults),
          v4HookDataKeys: new Map(hookDataResults),
        };
      },
    };

    setReadiness(pendingReadiness(staticResult.routerAddress));
    setIsChecking(true);
    liveReadiness(config, reader).then((result) => {
      if (cancelled) return;
      setReadiness(result);
      setIsChecking(false);
    });

    return () => {
      cancelled = true;
    };
  }, [config, publicClient, staticResult]);

  return {
    readiness,
    isChecking,
  };
}
