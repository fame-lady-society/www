"use client";

import { type FC, useId } from "react";
import Box from "@mui/material/Box";

export const SocialCheckmark: FC = () => {
  const gradientId = useId();

  return (
    <Box
      component="span"
      sx={{ display: "inline-flex", alignItems: "center", lineHeight: 0 }}
      aria-label="Verified social"
      role="img"
    >
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f472b6" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
        <path
          d="M12 20.3l-1.4-1.3c-4.8-4.4-7.8-7.1-7.8-10.4 0-2.3 1.8-4 4.1-4 1.6 0 3.1.8 3.9 2.1.8-1.3 2.3-2.1 3.9-2.1 2.3 0 4.1 1.7 4.1 4 0 3.3-3 6-7.8 10.4l-1 .9z"
          fill={`url(#${gradientId})`}
          stroke="#be185d"
          strokeWidth="0.8"
        />
        <path
          d="M8.3 9.2c.4-.9 1.3-1.5 2.2-1.5"
          fill="none"
          stroke="#fbcfe8"
          strokeWidth="0.8"
          strokeLinecap="round"
        />
        <path
          d="M8.7 12.4l1.7 1.9 4.6-4.7"
          fill="none"
          stroke="#fff"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Box>
  );
};
