import { FC, ReactNode, useCallback } from "react";
import { useNotifications } from "@/features/notifications/Context";

export const CopyToClipboard: FC<{
  text: string;
  clipboard?: boolean;
  mobileShareMessage?: string;
  children: (handleClick: () => void) => ReactNode;
}> = ({ children, text, clipboard, mobileShareMessage = "Share this" }) => {
  const { addNotification } = useNotifications();

  const handleClick = useCallback(() => {
    if (navigator.share && typeof clipboard === "undefined" || clipboard === false) {
      navigator.share({
        title: mobileShareMessage,
        text: text,
      });
    } else if (navigator.clipboard) {
      addNotification({
        id: "copied",
        message: "Copied to clipboard",
        type: "success",
      });
      navigator.clipboard.writeText(text);
    }
  }, [addNotification, mobileShareMessage, text]);

  return children(handleClick);
};
