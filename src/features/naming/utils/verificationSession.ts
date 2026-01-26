import type { NetworkType } from "../hooks/useOwnedGateNftTokens";

const STORAGE_KEY = "fls-address-verification-session";
const SESSION_MAX_AGE_MS = 60 * 60 * 1000; // 1 hour

export type VerificationStep = "start" | "sign" | "submit" | "complete";

export interface VerificationSession {
  network: NetworkType;
  identifier: string;
  tokenId: string; // stored as string for JSON serialization
  primaryAddress: `0x${string}`;
  targetAddress: `0x${string}`;
  nonce: string; // stored as string for JSON serialization
  signature?: `0x${string}`;
  createdAt: number;
  expiresAt: number;
  currentStep: VerificationStep;
}

export interface VerificationSessionInput {
  network: NetworkType;
  identifier: string;
  tokenId: bigint;
  primaryAddress: `0x${string}`;
  targetAddress: `0x${string}`;
  nonce: bigint;
}

const isBrowser = typeof window !== "undefined";

type SessionListener = (session: VerificationSession | null) => void;
const listeners = new Set<SessionListener>();

function notify(session: VerificationSession | null): void {
  listeners.forEach((listener) => {
    try {
      listener(session);
    } catch (error) {
      console.error("Session listener error:", error);
    }
  });
}

export function createVerificationSession(
  input: VerificationSessionInput
): VerificationSession {
  const now = Date.now();
  const session: VerificationSession = {
    network: input.network,
    identifier: input.identifier,
    tokenId: input.tokenId.toString(),
    primaryAddress: input.primaryAddress,
    targetAddress: input.targetAddress,
    nonce: input.nonce.toString(),
    createdAt: now,
    expiresAt: now + SESSION_MAX_AGE_MS,
    currentStep: "start",
  };

  saveSession(session);
  return session;
}

function saveSession(session: VerificationSession): void {
  if (!isBrowser) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  notify(session);
}

export function getVerificationSession(): VerificationSession | null {
  if (!isBrowser) return null;

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const session = JSON.parse(raw) as VerificationSession;

    // Validate required fields
    if (
      !session.network ||
      !session.identifier ||
      !session.tokenId ||
      !session.primaryAddress ||
      !session.targetAddress ||
      !session.nonce ||
      !session.expiresAt
    ) {
      clearVerificationSession();
      return null;
    }

    // Check expiry
    if (session.expiresAt < Date.now()) {
      clearVerificationSession();
      return null;
    }

    return session;
  } catch {
    clearVerificationSession();
    return null;
  }
}

export function updateVerificationSession(
  updates: Partial<Pick<VerificationSession, "signature" | "currentStep">>
): VerificationSession | null {
  const session = getVerificationSession();
  if (!session) return null;

  const updatedSession: VerificationSession = {
    ...session,
    ...updates,
  };

  saveSession(updatedSession);
  return updatedSession;
}

export function setSessionSignature(
  signature: `0x${string}`
): VerificationSession | null {
  return updateVerificationSession({
    signature,
    currentStep: "submit",
  });
}

export function setSessionStep(
  step: VerificationStep
): VerificationSession | null {
  return updateVerificationSession({ currentStep: step });
}

export function clearVerificationSession(): void {
  if (!isBrowser) return;
  localStorage.removeItem(STORAGE_KEY);
  notify(null);
}

export function subscribeVerificationSession(
  listener: SessionListener
): () => void {
  listeners.add(listener);

  if (isBrowser) {
    const storageListener = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        listener(getVerificationSession());
      }
    };
    window.addEventListener("storage", storageListener);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", storageListener);
    };
  }

  return () => {
    listeners.delete(listener);
  };
}

export function isSessionForIdentity(
  session: VerificationSession | null,
  network: NetworkType,
  identifier: string
): boolean {
  if (!session) return false;
  return session.network === network && session.identifier === identifier;
}

export function getSessionTokenId(session: VerificationSession): bigint {
  return BigInt(session.tokenId);
}

export function getSessionNonce(session: VerificationSession): bigint {
  return BigInt(session.nonce);
}
