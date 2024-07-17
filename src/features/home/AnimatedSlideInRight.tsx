import { useInView } from "react-intersection-observer";
import { useSpring, animated } from "react-spring";
import Box, { BoxProps } from "@mui/material/Box";
import { FC, PropsWithChildren, useLayoutEffect } from "react";

const AnimatedBox = animated(Box);

export const AnimatedSlideInRight: FC<
  PropsWithChildren<
    BoxProps & {
      inViewProps?: Parameters<typeof useInView>[0];
    }
  >
> = ({ children, inViewProps, ...rest }) => {
  const { ref, inView } = useInView({
    threshold: 0.1,
    ...inViewProps,
  });

  const props = useSpring({
    opacity: inView ? 1 : 0,
    transform: inView ? "translateX(0)" : "translateX(150px)",
    config: { mass: 2, tension: 50, friction: 20 },
  });

  return (
    <AnimatedBox style={props} ref={ref} {...rest}>
      {children}
    </AnimatedBox>
  );
};
