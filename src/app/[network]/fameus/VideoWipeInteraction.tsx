"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAccount } from "wagmi";

export const VideoWipeInteraction = ({
  children,
  videoUrl,
  redirectPath,
  allowInteraction = true,
  mustBeConnected,
  redirectWhenConnectedPath,
}: {
  children: React.ReactNode;
  videoUrl: string;
  redirectPath: string;
  redirectWhenConnectedPath?: string;
  allowInteraction?: boolean;
  mustBeConnected?: boolean;
}) => {
  const { isConnected } = useAccount();
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const isAllowedToInteract = allowInteraction && (!mustBeConnected || isConnected);

  const handleInteraction = useCallback(async () => {
    if (!videoRef.current || !isAllowedToInteract) return;
    if (!isPlaying) {
      try {
        await videoRef.current.play();
        setIsPlaying(true);
      } catch (error) {
        // Reset video element on play failure
        if (videoRef.current) {
          videoRef.current.currentTime = 0;
          setIsPlaying(false);
        }
      }
    } else {
      router.push((redirectWhenConnectedPath && isConnected && redirectWhenConnectedPath) || redirectPath);
    }
  }, [isPlaying, redirectPath, router, isAllowedToInteract, redirectWhenConnectedPath, isConnected]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isAllowedToInteract) return;
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isAllowedToInteract) return;
    if (!touchStart) return;

    const touchEnd = e.changedTouches[0].clientX;
    const swipeDistance = touchEnd - touchStart;

    // Detect significant horizontal swipe (more than 50px)
    if (Math.abs(swipeDistance) > 50) {
      handleInteraction();
    }

    setTouchStart(null);
  };

  useEffect(() => {
    router.prefetch(redirectPath);
  }, [router, redirectPath]);

  return (
    <div
      onClick={isAllowedToInteract ? handleInteraction : undefined}
      onKeyDown={isAllowedToInteract ? handleInteraction : undefined}
      onTouchStart={isAllowedToInteract ? handleTouchStart : undefined}
      onTouchEnd={isAllowedToInteract ? handleTouchEnd : undefined}
      tabIndex={isAllowedToInteract ? 0 : undefined}
      role={isAllowedToInteract ? "button" : undefined}
      className="relative w-full h-full"
    >
      <video
        ref={videoRef}
        src={videoUrl}
        className="absolute inset-0 w-full h-full object-cover object-center z-50 pointer-events-none"
        style={{ opacity: isPlaying ? 1 : 0 }}
        onEnded={() => router.push((redirectWhenConnectedPath && isConnected && redirectWhenConnectedPath) || redirectPath)}
      />
      {!isPlaying && children}
    </div>
  );
};
