"use client";

import { forwardRef } from "react";
import NextLink from "next/link";
import Button, { type ButtonProps } from "@mui/material/Button";

type LinkButtonProps = Omit<
  ButtonProps<typeof NextLink>,
  "component" | "href"
> & {
  href: string;
};

export const LinkButton = forwardRef<HTMLAnchorElement, LinkButtonProps>(
  function LinkButton({ href, ...props }, ref) {
    return <Button component={NextLink} ref={ref} href={href} {...props} />;
  },
);

LinkButton.displayName = "LinkButton";
