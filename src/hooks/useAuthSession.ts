import { useEffect, useState } from "react";

import {
  AuthSession,
  getAuthSession,
  subscribeAuthSession,
} from "@/utils/authToken";

const EMPTY = { token: undefined, expiresAt: undefined } as const;

export function useAuthSession() {
  const [session, setSession] = useState<AuthSession | null>(() =>
    getAuthSession(),
  );

  useEffect(() => {
    setSession(getAuthSession());
    const unsubscribe = subscribeAuthSession(setSession);
    return unsubscribe;
  }, []);

  return session ?? EMPTY;
}

