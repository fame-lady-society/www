"use client";

import { useState } from "react";
import InfoIcon from "@mui/icons-material/Info";

interface InfoTooltipProps {
  text: string;
}

export function InfoTooltip({ text }: InfoTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block ml-2">
      <span
        className="cursor-pointer"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onClick={() => setIsVisible(!isVisible)}
      >
        <InfoIcon className="text-gray-500 w-5 h-5" />
      </span>
      {isVisible && (
        <div className="absolute z-10 w-64 p-2 mt-2 text-sm text-white bg-gray-800 rounded-lg shadow-lg -left-1/2 transform -translate-x-1/2">
          {text}
        </div>
      )}
    </div>
  );
}
