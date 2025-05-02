"use client";
import { FC, useEffect } from "react";
import { sdk } from "@farcaster/frame-sdk";

export const Farcaster: FC = () => {
  useEffect(() => {
    sdk.actions.ready().then(() => {
      console.log("Farcaster is ready");
    });
  }, []);

  return null;
};
