"use client";

import { useState, useEffect, useCallback } from "react";
import {
  type VerificationSession,
  type VerificationSessionInput,
  type VerificationStep,
  getVerificationSession,
  createVerificationSession,
  updateVerificationSession,
  setSessionSignature,
  setSessionStep,
  clearVerificationSession,
  subscribeVerificationSession,
  isSessionForIdentity,
  getSessionTokenId,
  getSessionNonce,
} from "../utils/verificationSession";
import type { NetworkType } from "./useOwnedGateNftTokens";

export interface UseAddressVerificationSessionResult {
  session: VerificationSession | null;
  hasSession: boolean;
  isExpired: boolean;
  tokenId: bigint | null;
  nonce: bigint | null;
  createSession: (input: VerificationSessionInput) => VerificationSession;
  setSignature: (signature: `0x${string}`) => void;
  setStep: (step: VerificationStep) => void;
  clearSession: () => void;
  isSessionForCurrentIdentity: boolean;
}

export function useAddressVerificationSession(
  network?: NetworkType,
  identifier?: string
): UseAddressVerificationSessionResult {
  const [session, setSession] = useState<VerificationSession | null>(() =>
    getVerificationSession()
  );

  useEffect(() => {
    setSession(getVerificationSession());
    const unsubscribe = subscribeVerificationSession(setSession);
    return unsubscribe;
  }, []);

  const hasSession = session !== null;
  const isExpired = session !== null && session.expiresAt < Date.now();
  const tokenId = session ? getSessionTokenId(session) : null;
  const nonce = session ? getSessionNonce(session) : null;

  const isSessionForCurrentIdentity =
    network !== undefined &&
    identifier !== undefined &&
    isSessionForIdentity(session, network, identifier);

  const handleCreateSession = useCallback(
    (input: VerificationSessionInput): VerificationSession => {
      return createVerificationSession(input);
    },
    []
  );

  const handleSetSignature = useCallback((signature: `0x${string}`) => {
    const updated = setSessionSignature(signature);
    if (updated) {
      setSession(updated);
    }
  }, []);

  const handleSetStep = useCallback((step: VerificationStep) => {
    const updated = setSessionStep(step);
    if (updated) {
      setSession(updated);
    }
  }, []);

  const handleClearSession = useCallback(() => {
    clearVerificationSession();
    setSession(null);
  }, []);

  return {
    session,
    hasSession,
    isExpired,
    tokenId,
    nonce,
    createSession: handleCreateSession,
    setSignature: handleSetSignature,
    setStep: handleSetStep,
    clearSession: handleClearSession,
    isSessionForCurrentIdentity,
  };
}
