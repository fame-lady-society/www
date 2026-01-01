import { useEffect, useState } from "react";

import {
  AuthSession,
  getAuthSession,
  subscribeAuthSession,
} from "@/utils/authToken";

export function useAuthSession(): AuthSession | null {
  const [session, setSession] = useState<AuthSession | null>(() =>
    getAuthSession(),
  );

  useEffect(() => {
    setSession(getAuthSession());
    const unsubscribe = subscribeAuthSession(setSession);
    return unsubscribe;
  }, []);

  return session;
}

