import { forwardRef } from "react";
import { Canvas as ThreeCanvas } from "@react-three/fiber";
import { PropsWithChildren } from "react";
import { FrameLimiter } from "./FrameLimiter";

// TODO(next15-followup): Smoke-test the React 19 rendering-stack upgrades
// (React Spring, R3F, drei, postprocessing, and Three) in the canvas flows before PR.
export const FullscreenCanvas = forwardRef<
  HTMLCanvasElement,
  PropsWithChildren<{
    opacity?: number;
  }>
>(function Component({ opacity = 1, children }, ref) {
  return (
    <ThreeCanvas
      ref={ref}
      gl={{ alpha: true, antialias: false, preserveDrawingBuffer: true }}
      dpr={1.5}
      style={{
        height: "100vh",
        width: "100vw",
        position: "fixed",
        top: 0,
        left: 0,
        opacity,
      }}
      frameloop="demand"
      camera={{ position: [0, 0.5, 6], fov: 35 }}
      onCreated={({ gl }) => {
        const context = gl.getContext();
        if (context instanceof WebGLRenderingContext) {
          context.getExtension("OES_standard_derivatives");
        }
      }}
    >
      <FrameLimiter fps={60} />
      {children}
    </ThreeCanvas>
  );
});
