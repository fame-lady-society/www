"use client";
import NextImage from "next/image";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import {
  useState,
  useEffect,
  useRef,
  FC,
  RefObject,
  MutableRefObject,
} from "react";
import { Lasers } from "./Lasers";

export const Equalizer: FC<{
  videoRef: MutableRefObject<HTMLVideoElement | null>;
  height: number;
  width: number;
  fullScreen?: boolean;
}> = ({ videoRef, height, width, fullScreen }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Update canvas size when width/height props change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = width;
    canvas.height = height;
  }, [width, height]);

  useEffect(() => {
    const BASE_HUE = 280; // Purple base
    const HUE_RANGE = 60; // How much the hue can vary
    const LOW_FREQ_INFLUENCE = 8; // How many low frequency bands to consider
    const DAMPING_FACTOR = 0.25; // Controls how quickly frequencies update
    const MAX_ROTATION_SPEED = 0.1; // Limit maximum rotation speed

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const FREQUENCY_STEPS = 32;

    let animationFrameId: number;
    const lightBarState = Array.from({ length: FREQUENCY_STEPS }, (_, i) => ({
      rotation: (Math.sin((i * Math.PI) / FREQUENCY_STEPS) * Math.PI) / 2,
      direction: Math.random() > 0.5 ? 1 : -1,
      currentFrequency: 0, // Track current frequency for damping
      targetRotation: 0, // Track where we want to rotate to
    }));

    const animate = () => {
      // Setup audio context and nodes if they don't exist but audio element does
      if (videoRef.current && !audioContextRef.current) {
        const connect = () => {
          if (!videoRef.current || audioContextRef.current) return;
          audioContextRef.current = new AudioContext();
          analyserRef.current = audioContextRef.current.createAnalyser();
          sourceNodeRef.current =
            audioContextRef.current.createMediaElementSource(videoRef.current);
          sourceNodeRef.current.connect(analyserRef.current);
          analyserRef.current.connect(audioContextRef.current.destination);
        };

        const noticeVideoStarted = () => {
          videoRef.current?.removeEventListener("play", noticeVideoStarted);
          connect();
        };
        videoRef.current?.addEventListener("play", noticeVideoStarted);
      }

      // Clear canvas regardless of audio state
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Only draw frequency data if analyzer exists
      if (analyserRef.current) {
        const fbc_array = new Uint8Array(analyserRef.current.frequencyBinCount);
        const bar_height = height / FREQUENCY_STEPS;

        analyserRef.current.getByteFrequencyData(fbc_array);

        let avgLowFreq = 0;
        if (analyserRef.current) {
          const fbc_array = new Uint8Array(
            analyserRef.current.frequencyBinCount,
          );
          analyserRef.current.getByteFrequencyData(fbc_array);

          // Calculate average of low frequencies
          avgLowFreq =
            fbc_array.slice(0, LOW_FREQ_INFLUENCE).reduce((a, b) => a + b, 0) /
            LOW_FREQ_INFLUENCE /
            255;
        }

        // Draw bars from bottom (low freq) to top (high freq)
        for (let i = 0; i < FREQUENCY_STEPS; i += 2) {
          const targetFrequency = fbc_array[i] / 255;

          // Apply damping to frequency changes
          lightBarState[i].currentFrequency +=
            (targetFrequency - lightBarState[i].currentFrequency) *
            DAMPING_FACTOR;
          const frequency_strength = lightBarState[i].currentFrequency;

          // Calculate hue based on position and low frequency
          const hue =
            (BASE_HUE +
              (i / FREQUENCY_STEPS) * HUE_RANGE +
              avgLowFreq * HUE_RANGE) %
            360;

          // Create gradient with HSL colors
          const leftGradient = ctx.createLinearGradient(0, 0, width, 0);
          leftGradient.addColorStop(
            0,
            `hsla(${hue}, 80%, 70%, ${frequency_strength * 0.25})`,
          );
          leftGradient.addColorStop(
            0.95,
            `hsla(${hue}, 80%, 70%, ${frequency_strength * 0.125})`,
          );
          leftGradient.addColorStop(
            1,
            `hsla(${hue}, 80%, 70%, ${frequency_strength * 0.05})`,
          );

          ctx.fillStyle = leftGradient;

          // Calculate target rotation based on frequency
          lightBarState[i].targetRotation =
            frequency_strength * Math.PI * 0.33 * lightBarState[i].direction -
            (Math.PI / 8) * lightBarState[i].direction;

          // Smoothly move current rotation towards target
          const rotationDiff =
            lightBarState[i].targetRotation - lightBarState[i].rotation;
          const rotationStep =
            Math.min(
              Math.abs(rotationDiff) * DAMPING_FACTOR,
              MAX_ROTATION_SPEED,
            ) * Math.sign(rotationDiff);

          lightBarState[i].rotation += rotationStep;

          // Draw left side bar
          const y = canvas.height;
          // Draw left side bar
          ctx.save();
          ctx.translate(-width * 0.2, y);
          ctx.rotate(lightBarState[i].rotation);
          ctx.fillRect(0, 0, width * 2.5, bar_height - 1);
          ctx.restore();

          // Draw right side bar with mirrored gradient
          const rightGradient = ctx.createLinearGradient(
            canvas.width,
            0,
            canvas.width - width,
            0,
          );
          rightGradient.addColorStop(
            0,
            `hsla(${hue}, 80%, 70%, ${frequency_strength * 0})`,
          );
          rightGradient.addColorStop(
            0.01,
            `hsla(${hue}, 80%, 70%, ${frequency_strength * 0.0025})`,
          );
          rightGradient.addColorStop(
            0.1,
            `hsla(${hue}, 80%, 70%, ${frequency_strength * 0.1})`,
          );
          ctx.fillStyle = rightGradient;

          ctx.save();
          ctx.translate(canvas.width + width * 0.2, y);
          ctx.rotate(-lightBarState[i].rotation);
          ctx.fillRect(-width * 2, 0, width * 2, bar_height - 1);
          ctx.restore();
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [height, videoRef, width]);

  // Cleanup audio context when component unmounts
  useEffect(() => {
    return () => {
      if (sourceNodeRef.current) {
        sourceNodeRef.current.disconnect();
      }
      if (analyserRef.current) {
        analyserRef.current.disconnect();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`inset-0 pointer-events-none ${
        fullScreen ? "fixed" : "absolute"
      }`}
      style={{ zIndex: 50, backgroundColor: "transparent" }}
      width={width}
      height={height}
    />
  );
};

export const TeaserContent = ({
  width,
  height,
}: {
  width: number;
  height: number;
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  return (
    <button
      className="relative block w-fit"
      onClick={() => {
        if (videoRef.current) {
          if (isPlaying) {
            videoRef.current.pause();
            setIsPlaying(false);
          } else {
            videoRef.current
              .play()
              .then(() => {
                setIsPlaying(true);
              })
              .catch((error) => {
                console.error("Error playing video", error);
              });
          }
        } else {
          setIsPlaying(true);
        }
      }}
    >
      <div className="relative">
        <video
          controls={false}
          autoPlay={false}
          loop
          poster="/~/jilly/lingerie-dreams/poster.jpg"
          width={width}
          height={height}
          ref={videoRef}
        >
          <source
            src="/~/jilly/lingerie-dreams/final_720.mp4"
            type="video/mp4"
            media="(min-width: 600px)"
          />
          <source
            src="/~/jilly/lingerie-dreams/final_720.webm"
            type="video/webm"
            media="(min-width: 600px)"
          />
          <source
            src="/~/jilly/lingerie-dreams/final_720.ogv"
            type="video/ogg"
            media="(min-width: 600px)"
          />
          <source
            src="/~/jilly/lingerie-dreams/final_360.mp4"
            type="video/mp4"
            media="(max-width: 599px)"
          />
          <source
            src="/~/jilly/lingerie-dreams/final_360.webm"
            type="video/webm"
            media="(max-width: 599px)"
          />
          <source
            src="/~/jilly/lingerie-dreams/final_360.ogv"
            type="video/ogg"
            media="(max-width: 599px)"
          />
          Your browser does not support HTML5 video.
        </video>
        <Equalizer
          width={typeof window !== "undefined" ? window.innerWidth : width}
          height={typeof window !== "undefined" ? window.innerHeight : height}
          videoRef={videoRef}
          fullScreen
        />
        <Lasers width={width} height={height} isPlaying={isPlaying} />
      </div>
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center gap-2 transition-opacity duration-500 ${isPlaying ? "opacity-0" : "opacity-100"}`}
      >
        <div className="p-2 rounded-full bg-black/50 group-hover:bg-black/70 transition-colors">
          <VolumeUpIcon className="text-white w-8 h-8" />
        </div>
        <p className="text-white font-bold text-lg bg-black/50 px-4 py-2 rounded-full animate-bounce">
          TURN UP THE VOLUME!
        </p>
      </div>
    </button>
  );
};

export const Teaser = () => {
  const [dimensions, setDimensions] = useState({ width: 720, height: 720 });

  useEffect(() => {
    const updateDimensions = () => {
      const smallestDimension = Math.min(window.innerWidth, window.innerHeight);
      const size = Math.floor(smallestDimension * 0.7);
      setDimensions({ width: size, height: size });
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);

    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  return <TeaserContent width={dimensions.width} height={dimensions.height} />;
};
