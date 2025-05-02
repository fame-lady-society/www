"use client";

import { type FC, useRef, useState, useEffect } from "react";
import { useScroll } from "@use-gesture/react";
import { useMediaQuery } from "@mui/material";
import { useSpring, animated } from "react-spring";

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

  const containerSpring = useSpring({
    display: isScrolled && !isMobile ? "flex" : "block",
    config: { duration: 666, friction: 1000 },
  });

  const heroSpring = useSpring({
    width: isScrolled && !isMobile ? "50%" : "100%",
    transform: "translateX(0)",
    config: { duration: 666, friction: 10 },
  });

  const contentSpring = useSpring({
    width: isScrolled && !isMobile ? "50%" : "100%",
    config: { duration: 666, friction: 5 },
  });

  return (
    <div className="h-screen w-full">
      <animated.div
        ref={containerRef}
        style={containerSpring}
        className="h-full w-full"
      >
        <animated.div
          style={heroSpring}
          className="flex items-center justify-center"
        >
          {hero}
        </animated.div>
        <animated.div
          style={contentSpring}
          className={`flex justify-center overflow-y-auto ${!isScrolled || isMobile ? "items-start" : "items-center"}`}
        >
          <div className="flex flex-col items-center justify-center w-full">
            {content}
          </div>
        </animated.div>
      </animated.div>
    </div>
  );
};
