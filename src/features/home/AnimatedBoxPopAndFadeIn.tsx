import { useInView } from "react-intersection-observer";
import { useSpring, animated } from "react-spring";
import Box, { BoxProps } from "@mui/material/Box";
import { FC, PropsWithChildren, useLayoutEffect } from "react";

const AnimatedBox = animated(Box);

export const AnimatedBoxPopAndFadeIn: FC<
  PropsWithChildren<
    BoxProps & {
      inViewProps?: Parameters<typeof useInView>[0];
      springProps?: Omit<
        Parameters<typeof useSpring>[0],
        "opacity" | "transform"
      >;
    }
  >
> = ({ children, inViewProps, springProps, ...rest }) => {
  const { ref, inView } = useInView({
    threshold: 0.5,
    ...inViewProps,
  });

  const props = useSpring({
    ...springProps,
    opacity: inView ? 1 : 0,
    transform: inView ? "scale(1)" : "scale(0.5)",
    config: { mass: 1, tension: 210, friction: 20 },
  });

  return (
    <AnimatedBox style={props} ref={ref} {...rest}>
      {children}
    </AnimatedBox>
  );
};
