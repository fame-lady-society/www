import { useRef } from "react";
import { useSpring, animated } from "@react-spring/three";
import { Plane, useTexture } from "@react-three/drei";
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

function lookingAt(obj: THREE.Object3D) {
  const direction = new THREE.Vector3(0, 0, 3);
  direction.applyMatrix4(obj.matrix);
  return direction;
}

export const Lips = () => {
  const { rotationY, positionZ } = useSpring({
    from: { rotationY: 0, positionZ: 0 },
    to: async (next) => {
      await next({ rotationY: -Math.PI / 4 });
      await new Promise((r) => setTimeout(r, 1000));
      await next({ rotationY: Math.PI / 4 });
      await new Promise((r) => setTimeout(r, 1000));
      await next({ rotationY: 0 });
      await new Promise((r) => setTimeout(r, 1000));
      await next({ positionZ: 5 });
    },
  });
  const imageRef = useRef<THREE.Group>(null);

  const texture = useTexture("/images/lips.webp");
  return (
    <>
      {/* <color attach="background" args={["#000000"]} /> */}
      <animated.group
        ref={imageRef}
        position-z={positionZ}
        rotation-y={rotationY}
      >
        <Plane
          args={[1, 1]}
          position={[0, 0, 0]}
          rotation={[Math.PI, Math.PI, Math.PI]}
        >
          <meshBasicMaterial map={texture} transparent />
        </Plane>
      </animated.group>
    </>
  );
};
