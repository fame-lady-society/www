const STORAGE_KEY = "siweAuthToken";

export type AuthSession = {
  token: string;
  expiresAt: number;
};

const isBrowser = typeof window !== "undefined";
type AuthSessionListener = (session: AuthSession | null) => void;

const listeners = new Set<AuthSessionListener>();

function notify(session: AuthSession | null): void {
  listeners.forEach((listener) => {
    try {
      listener(session);
    } catch (error) {
      // ignore listener errors to avoid breaking notification chain
      console.error(error);
    }
  });
}

export function setAuthSession(session: AuthSession): void {
  if (!isBrowser) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  notify(session);
}

export function clearAuthSession(): void {
  if (!isBrowser) return;
  localStorage.removeItem(STORAGE_KEY);
  notify(null);
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

export function subscribeAuthSession(
  listener: AuthSessionListener,
): () => void {
  listeners.add(listener);
  if (isBrowser) {
    const storageListener = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        listener(getAuthSession());
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

