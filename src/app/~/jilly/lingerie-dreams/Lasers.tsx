"use client";
import { useEffect, useRef } from "react";

export const Lasers = ({
  width,
  height,
  isPlaying,
}: {
  width: number;
  height: number;
  isPlaying: boolean;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Laser beam parameters
    const beams: {
      x: number;
      y: number;
      angle: number;
      speed: number;
      color: string;
    }[] = Array(5)
      .fill(0)
      .map(() => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        angle: Math.random() * Math.PI * 2,
        speed: 2 + Math.random() * 3,
        color: `hsl(${Math.random() * 360}, 100%, 50%)`,
      }));

    const animate = () => {
      if (!isPlaying) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }

      // Clear previous frame with transparency
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw and update beams
      beams.forEach((beam) => {
        ctx.beginPath();
        ctx.moveTo(beam.x, beam.y);

        // Calculate end point
        const endX = beam.x + Math.cos(beam.angle) * 100;
        const endY = beam.y + Math.sin(beam.angle) * 100;

        ctx.lineTo(endX, endY);
        ctx.strokeStyle = beam.color;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Update position
        beam.x += Math.cos(beam.angle) * beam.speed;
        beam.y += Math.sin(beam.angle) * beam.speed;

        // Bounce off walls
        if (beam.x < 0 || beam.x > canvas.width)
          beam.angle = Math.PI - beam.angle;
        if (beam.y < 0 || beam.y > canvas.height) beam.angle = -beam.angle;
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    if (isPlaying) {
      animate();
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [height, isPlaying, width]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 50, backgroundColor: "transparent" }}
    />
  );
};
