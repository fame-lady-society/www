"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { VerificationSession } from "../utils/verificationSession";
import { clearVerificationSession } from "../utils/verificationSession";

export interface SessionValidationResult {
  isExpired: boolean;
  isValid: boolean;
  timeRemaining: number | null;
  handleExpired: () => void;
}

export function useSessionValidation(
  session: VerificationSession | null,
  wizardBaseUrl: string,
  editUrl: string
): SessionValidationResult {
  const router = useRouter();
  const [isExpired, setIsExpired] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  // Check expiry on mount and periodically
  useEffect(() => {
    if (!session) {
      setIsExpired(false);
      setTimeRemaining(null);
      return;
    }

    const checkExpiry = () => {
      const now = Date.now();
      const remaining = session.expiresAt - now;

      if (remaining <= 0) {
        setIsExpired(true);
        setTimeRemaining(0);
      } else {
        setIsExpired(false);
        setTimeRemaining(remaining);
      }
    };

    checkExpiry();
    const interval = setInterval(checkExpiry, 1000);

    return () => clearInterval(interval);
  }, [session]);

  const handleExpired = useCallback(() => {
    clearVerificationSession();
    router.replace(`${wizardBaseUrl}/start`);
  }, [router, wizardBaseUrl]);

  const isValid = session !== null && !isExpired;

  return {
    isExpired,
    isValid,
    timeRemaining,
    handleExpired,
  };
}

export function formatTimeRemaining(ms: number | null): string {
  if (ms === null || ms <= 0) return "Expired";

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m remaining`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s remaining`;
  } else {
    return `${seconds}s remaining`;
  }
}
