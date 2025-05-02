"use client";

import { type FC, useRef, useState, useEffect } from "react";
import { useScroll } from "@use-gesture/react";
import { useMediaQuery } from "@mui/material";

export const ScrollLayout: FC<{
  hero: NonNullable<React.ReactNode>;
  content: NonNullable<React.ReactNode>;
}> = ({ hero, content }) => {
  const isMobile = useMediaQuery("(max-width: 800px)");
  const containerRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (isScrolled) {
      setIsTransitioning(true);
      const timer = setTimeout(() => setIsTransitioning(false), 1050);
      return () => clearTimeout(timer);
    }
  }, [isScrolled]);

  useScroll(
    ({ scrolling, direction, movement }) => {
      if (scrolling && !isTransitioning) {
        if (direction[1] > 0 && !isScrolled) {
          setIsScrolled(true);
        } else if (direction[1] < 0 && movement[1] < 0 && isScrolled) {
          setIsScrolled(false);
        }
      }
    },
    {
      target: typeof window !== "undefined" ? window : undefined,
      enabled: !isMobile,
    },
  );

  const altLayout = isScrolled && !isMobile;

  return (
    <div className="h-screen w-full">
      <div
        ref={containerRef}
        className={`h-full w-full transition-all duration-[1050ms] ease-in-out ${
          altLayout ? "flex" : "block"
        }`}
      >
        <div
          className={`flex items-center justify-center transition-all duration-[1050ms] ease-in-out ${
            altLayout ? "w-1/2 translate-x-0" : "w-full translate-x-0"
          }`}
        >
          {hero}
        </div>
        <div
          className={`flex items-center justify-center transition-all duration-[1050ms] ease-in-out ${
            altLayout
              ? "w-1/2 overflow-y-auto translate-x-0"
              : "w-full translate-y-full"
          }`}
        >
          <div className="flex flex-col items-center justify-center w-full">
            {content}
          </div>
        </div>
      </div>
    </div>
  );
};
