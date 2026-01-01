const STORAGE_KEY = "siweAuthToken";

export type AuthSession = {
  token: string;
  expiresAt: number;
};

const isBrowser = typeof window !== "undefined";

export function setAuthSession(session: AuthSession): void {
  if (!isBrowser) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearAuthSession(): void {
  if (!isBrowser) return;
  localStorage.removeItem(STORAGE_KEY);
}

export function getAuthSession(): AuthSession | null {
  if (!isBrowser) return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as AuthSession;
    if (!parsed.token || typeof parsed.expiresAt !== "number") {
      clearAuthSession();
      return null;
    }
    if (parsed.expiresAt < Date.now()) {
      clearAuthSession();
      return null;
    }
    return parsed;
  } catch {
    clearAuthSession();
    return null;
  }
}

export function withAuthHeaders(
  headers?: HeadersInit,
  sessionOverride?: AuthSession | null,
): HeadersInit {
  const session = sessionOverride ?? getAuthSession();
  if (!session?.token) {
    return headers ?? {};
  }

  return {
    ...(headers ?? {}),
    Authorization: `Bearer ${session.token}`,
  };
}

