import { FC, ReactNode, useCallback } from "react";
import { useNotifications } from "@/features/notifications/Context";

export const CopyToClipboard: FC<{
  text: string;
  mobileShareMessage?: string;
  children: (handleClick: () => void) => ReactNode;
}> = ({ children, text, mobileShareMessage = "Share this" }) => {
  const { addNotification } = useNotifications();

  const handleClick = useCallback(() => {
    if (navigator.share) {
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
