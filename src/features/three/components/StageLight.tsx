import { forwardRef } from "react";
import * as THREE from "three";

// const AnimatedPlane = animated(Plane);

// export const Please: FC = () => {
//   return (
//     <>
//       <ThreeCanvas
//         gl={{ preserveDrawingBuffer: true }}
//         dpr={1.5}
//         frameloop="demand"
//         camera={{ position: [0, 0.5, 6], fov: 35 }}
//       >
//         <FrameLimiter fps={60} />
//         <Content />
//       </ThreeCanvas>
//     </>
//   );
// };

export const StageLight = forwardRef<THREE.PointLight>(
  function SpotlightRef(_, ref) {
    return (
      <>
        <ambientLight intensity={0.5} />
        <pointLight ref={ref} position={[10, 10, 10]} />
      </>
    );
  },
);
