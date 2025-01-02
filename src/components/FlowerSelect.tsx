import { useEffect, useRef, useState } from "react";
import cn from "classnames";

export const FlowerSelect = ({ isSelected }: { isSelected: boolean }) => {
  const selectionRef = useRef<HTMLVideoElement>(null);
  const unselectionRef = useRef<HTMLVideoElement>(null);
  const [currentPhase, setCurrentPhase] = useState<'selection' | 'selected' | 'unselection' | 'none'>('none');
  const [shouldShow, setShouldShow] = useState(false);
  const prevIsSelected = useRef(isSelected);

  // Preload unselection video when component mounts
  useEffect(() => {
    const unselectionVideo = unselectionRef.current;
    if (unselectionVideo) {
      unselectionVideo.load();
    }
  }, []);

  useEffect(() => {
    // Handle selection
    if (isSelected) {
      setShouldShow(true);
      setCurrentPhase('selection');
      const video = selectionRef.current;
      if (video) {
        video.currentTime = 0;
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // Autoplay was prevented, handle if needed
          });
        }
      }
    }
    // Handle unselection
    else if (!isSelected && prevIsSelected.current && currentPhase !== 'unselection') {
      const selectionVideo = selectionRef.current;

      // If selection video is still playing, wait for it to finish before starting unselection
      if (selectionVideo && !selectionVideo.ended && currentPhase === 'selection') {
        const handleSelectionEnd = () => {
          setCurrentPhase('unselection');
          const unselectionVideo = unselectionRef.current;
          if (unselectionVideo) {
            unselectionVideo.currentTime = 0;
            unselectionVideo.play();
          }
          selectionVideo.removeEventListener('ended', handleSelectionEnd);
        };
        selectionVideo.addEventListener('ended', handleSelectionEnd);
      } else {
        // If selection video is done or wasn't playing, start unselection immediately
        setCurrentPhase('unselection');
        const video = unselectionRef.current;
        if (video) {
          video.currentTime = 0;
          video.play();
        }
      }
    }
    prevIsSelected.current = isSelected;
  }, [isSelected, currentPhase]);

  if (!shouldShow) return null;

  return (
    <>
      <video
        ref={selectionRef}
        src="/videos/flower-selection.webm"
        width={400}
        height={400}
        className={cn(
          "absolute top-0 left-0 pointer-events-none",
          currentPhase !== 'selection' && "hidden"
        )}
        muted
        playsInline
      />
      <video
        ref={unselectionRef}
        src="/videos/flower-unselection.webm"
        width={400}
        height={400}
        className={cn(
          "absolute top-0 left-0 pointer-events-none",
          currentPhase !== 'unselection' && "hidden"
        )}
        muted
        playsInline
        preload="auto"
        onEnded={() => {
          setShouldShow(false);
        }}
      />
    </>
  );
};