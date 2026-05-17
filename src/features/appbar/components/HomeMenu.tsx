import { FC, PropsWithChildren, useEffect, useState } from "react";

interface IProps {
  handleClose: () => void;
  anchorEl: Element | null;
}

const MENU_WIDTH = 320;
const MENU_MARGIN = 16;

export const HomeMenu: FC<PropsWithChildren<IProps>> = ({
  handleClose,
  anchorEl,
  children,
}) => {
  const open = Boolean(anchorEl);
  const [position, setPosition] = useState({ left: MENU_MARGIN, top: 64 });

  useEffect(() => {
    if (!anchorEl) return;

    const updatePosition = () => {
      const rect = anchorEl.getBoundingClientRect();
      const maxLeft = window.innerWidth - MENU_WIDTH - MENU_MARGIN;
      setPosition({
        left: Math.max(MENU_MARGIN, Math.min(rect.left, maxLeft)),
        top: rect.bottom + 8,
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [anchorEl]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50"
      onClick={handleClose}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          handleClose();
        }
      }}
      role="presentation"
    >
      <div className="absolute inset-0 bg-black/30" />
      <div
        className="fixed rounded bg-white py-2 shadow-xl"
        onClick={(event) => event.stopPropagation()}
        style={{
          left: position.left,
          maxWidth: `calc(100vw - ${MENU_MARGIN * 2}px)`,
          top: position.top,
          width: MENU_WIDTH,
        }}
      >
        {children}
      </div>
    </div>
  );
};
