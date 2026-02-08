"use client";

import { createContext, useContext } from "react";

export type ProfileBatchContextValue = {
  stageChange: (
    id: string,
    key: `0x${string}`,
    value: `0x${string}`,
    label: string,
  ) => void;
  removeChange: (id: string) => void;
};

export const ProfileBatchContext = createContext<ProfileBatchContextValue | null>(
  null,
);

export function useProfileBatchContext(): ProfileBatchContextValue {
  const context = useContext(ProfileBatchContext);
  if (!context) {
    throw new Error("ProfileBatchContext is missing.");
  }
  return context;
}
