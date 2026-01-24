"use client";

import { useMemo } from "react";
import { useAccount } from "@/hooks/useAccount";
import type { FullIdentity } from "./useIdentity";

export interface IdentityPermissions {
  isPrimary: boolean;
  isVerified: boolean;
  canManage: boolean;
  canRequestPrimary: boolean;
}

export function useIdentityPermissions(
  identity: FullIdentity | null
): IdentityPermissions {
  const { address } = useAccount();

  return useMemo(() => {
    if (!identity || !address) {
      return {
        isPrimary: false,
        isVerified: false,
        canManage: false,
        canRequestPrimary: false,
      };
    }

    const normalizedAddress = address.toLowerCase();
    const isPrimary =
      identity.primaryAddress.toLowerCase() === normalizedAddress;
    const isVerified = identity.verifiedAddresses.some(
      (addr) => addr.toLowerCase() === normalizedAddress
    );

    return {
      isPrimary,
      isVerified,
      // Primary can do everything
      canManage: isPrimary,
      // Verified (but not primary) can request to become primary
      canRequestPrimary: isVerified && !isPrimary,
    };
  }, [identity, address]);
}
