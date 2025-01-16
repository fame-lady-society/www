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
  audioRef: MutableRefObject<HTMLAudioElement | undefined>;
  height: number;
  width: number;
}> = ({ audioRef, height, width }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;

    const animate = () => {
      // Setup audio context and nodes if they don't exist but audio element does
      if (audioRef.current && !audioContextRef.current) {
        audioContextRef.current = new AudioContext();
        analyserRef.current = audioContextRef.current.createAnalyser();
        sourceNodeRef.current =
          audioContextRef.current.createMediaElementSource(audioRef.current);
        sourceNodeRef.current.connect(analyserRef.current);
        analyserRef.current.connect(audioContextRef.current.destination);
      }

      // Clear canvas regardless of audio state
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Only draw frequency data if analyzer exists
      if (analyserRef.current) {
        const fbc_array = new Uint8Array(analyserRef.current.frequencyBinCount);
        const bar_count = width / 2;

        analyserRef.current.getByteFrequencyData(fbc_array);
        ctx.fillStyle = "#ffffff";

        for (var i = 0; i < bar_count; i++) {
          const bar_pos = i * 4;
          const bar_width = 2;
          const bar_height = -(fbc_array[i] / 2);

          ctx.fillRect(bar_pos, canvas.height, bar_width, bar_height);
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [audioRef, width]);

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
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 50, backgroundColor: "transparent" }}
      width={width}
      height={height}
    />
  );
};

const IMAGE_1 = "/~/jilly/lingerie-dreams/teaser.webp";
const AUDIO_1 = "/~/jilly/lingerie-dreams/teaser.m4a";

export const TeaserContent = ({
  width,
  height,
}: {
  width: number;
  height: number;
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>();

  return (
    <button
      className="relative block w-fit"
      onClick={() => {
        if (audioRef.current) {
          if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
          } else {
            audioRef.current.play();
            setIsPlaying(true);
          }
        } else {
          const audio = new Audio(AUDIO_1);
          audio.play();
          audioRef.current = audio;
          setIsPlaying(true);
        }
      }}
    >
      <div className="relative">
        <NextImage src={IMAGE_1} alt="Teaser" width={width} height={height} />
        <Equalizer width={width} height={height} audioRef={audioRef} />
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
  const [dimensions, setDimensions] = useState({ width: 400, height: 400 });

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
