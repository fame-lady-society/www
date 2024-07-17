import React, { FC, forwardRef, useCallback } from "react";
import Box from "@mui/material/Box";
import Backdrop from "@mui/material/Backdrop";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContentText from "@mui/material/DialogContentText";
import Typography from "@mui/material/Typography";
import NextImage from "next/image";
import { useSpring, animated } from "react-spring";

export type CloseReason = "backdropClick" | "escapeKeyDown" | "ctaClick";

const logoUrl = "/images/fame/gold-leaf-square.png";

interface FadeProps {
  children: React.ReactElement;
  in?: boolean;
  onClick?: any;
  onEnter?: (node: HTMLElement, isAppearing: boolean) => void;
  onExited?: (node: HTMLElement, isAppearing: boolean) => void;
  ownerState?: any;
}

const Fade = forwardRef<HTMLDivElement, FadeProps>(function Fade(props, ref) {
  const {
    children,
    in: open,
    onClick,
    onEnter,
    onExited,
    ownerState,
    ...other
  } = props;
  const style = useSpring({
    from: { opacity: 0 },
    to: { opacity: open ? 1 : 0 },
    onStart: () => {
      if (open && onEnter) {
        onEnter(null as any, true);
      }
    },
    onRest: () => {
      if (!open && onExited) {
        onExited(null as any, true);
      }
    },
  });

  return (
    <animated.div ref={ref} style={style} {...other}>
      {React.cloneElement(children, { onClick })}
    </animated.div>
  );
});

export const FameLaunchModal: FC<{
  open: boolean;
  onCtaClick: () => void;
  onClose: (open: CloseReason) => void;
}> = ({ open, onCtaClick, onClose }) => {
  const onClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      e.stopPropagation();
      onClose("ctaClick");
      onCtaClick();
    },
    [onCtaClick, onClose],
  );

  return (
    <Dialog
      open={open}
      onClose={() => onClose("backdropClick")}
      slots={{
        backdrop: Backdrop,
      }}
      slotProps={{
        backdrop: {
          TransitionComponent: Fade,
        },
      }}
    >
      <Box
        component="div"
        onClick={onClick}
        sx={{
          scrollbarWidth: "none",
          overflowY: "scroll",
        }}
      >
        <DialogTitle>
          <Typography variant="h6" textAlign="center" textTransform="uppercase">
            $FAME is here
          </Typography>
        </DialogTitle>
        <DialogContent>
          <DialogContentText textAlign="center" marginBottom={2}>
            learn more
          </DialogContentText>
          <Box component="div" display="flex" justifyContent="center">
            <NextImage
              src={logoUrl}
              alt="society logo"
              width={500}
              height={500}
            />
          </Box>
          <DialogContentText textAlign="center" marginY={2}>
            WE are the Fame Lady Society and this is $FAME, a revolutionary
            DN-404 project featuring 888 stunning Fame inspired female NFT’s
            liquidity backed by 888 million $FAME tokens.
          </DialogContentText>
          <DialogContentText textAlign="center" marginY={2}>
            Buy 1 million $FAME and one of our rare and exclusive Society Ladies
            mint into your wallet making you feel special and complete.
          </DialogContentText>
          <DialogContentText textAlign="center" marginY={2}>
            Sell any portion of that million $FAME and she will disappear
            leaving you heart broken and bewildered.
          </DialogContentText>
          <DialogContentText textAlign="center" marginY={2}>
            So the choice is yours.
          </DialogContentText>
          <DialogContentText textAlign="center" marginY={2}>
            One thing is for sure the $FAME/Society token/NFT will change the
            way the World thinks about NFT assets and how they can be traded and
            gamified.
          </DialogContentText>
        </DialogContent>
      </Box>
    </Dialog>
  );
};
