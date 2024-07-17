import useLocalStorage from "use-local-storage";
import { useCallback, useEffect, useState } from "react";

export function useSeeFameLaunch() {
  const [isFameLaunchSeen, setFameLaunchSeen] = useLocalStorage(
    "fame-launch-seen",
    false,
    {
      syncData: true,
    },
  );
  const [shouldSee, setShouldSee] = useState(false);
  const [userSeen, setUserSeen] = useState(false);
  const wasSeen = useCallback(() => {
    setShouldSee(false);
    setFameLaunchSeen(true);
    setUserSeen(true);
  }, [setFameLaunchSeen]);
  useEffect(() => {
    if (
      (process.env.NEXT_PUBLIC_FAME_LAUNCH_MODAL === "true" ||
        !isFameLaunchSeen) &&
      !userSeen
    ) {
      const timeoutId = setTimeout(() => {
        setShouldSee(true);
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [isFameLaunchSeen, shouldSee, userSeen]);

  return [shouldSee, wasSeen] as const;
}
