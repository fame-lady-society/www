"use client";

import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Snackbar, { SnackbarCloseReason } from "@mui/material/Snackbar";
import { useNotifications, type Notification } from "./Context";

export const Notifications: FC = () => {
  const { notifications, removeNotification } = useNotifications();
  const [messageInfo, setMessageInfo] = useState<Notification | null>(null);

  console.log("notifications", notifications);
  console.log("messageInfo", messageInfo);
  const handleClose = useCallback(
    (
      event: Event | React.SyntheticEvent<any, Event>,
      reason: SnackbarCloseReason,
    ) => {
      if (messageInfo) {
        removeNotification(messageInfo.id);
      }
      setMessageInfo(null);
    },
    [messageInfo, removeNotification],
  );

  const processQueue = useCallback(() => {
    if (notifications.length > 0) {
      const topTransaction = notifications[0];
      setMessageInfo(topTransaction);
      removeNotification(topTransaction.id);
    }
  }, [notifications, removeNotification]);

  useMemo(() => {
    if (notifications.length > 0 && !messageInfo) {
      console.log("processQueue");
      processQueue();
    }
  }, [notifications, messageInfo, processQueue]);

  return (
    <Snackbar
      key={messageInfo?.id}
      open={messageInfo !== null}
      autoHideDuration={messageInfo?.autoHideMs}
      onClose={handleClose}
      message={messageInfo?.message}
      anchorOrigin={{ vertical: "top", horizontal: "right" }}
      ContentProps={{
        sx: {
          backgroundColor: messageInfo?.type === "error" ? "red" : "white",
          color: messageInfo?.type === "error" ? "white" : "black",
        },
      }}
      style={{
        // translate down 50px to avoid the header
        top: "80px",
      }}
    />
  );
};


export const NotificationsTailwind: FC = () => {
  const { notifications, removeNotification } = useNotifications();

  // Tracks the current notification being displayed
  const [messageInfo, setMessageInfo] = useState<Notification | null>(null);

  // We'll use this to manage fade-in and fade-out transitions
  const [visible, setVisible] = useState(false);

  // Keep a ref for the auto-hide timer
  const autoHideTimer = useRef<NodeJS.Timeout | null>(null);

  console.log(notifications);

  // Removes the current notification from state and hides the snackbar
  const closeNotification = useCallback((reason: SnackbarCloseReason) => {
    if (messageInfo) {
      removeNotification(messageInfo.id);
    }
    setMessageInfo(null);
    setVisible(false);
  }, [messageInfo, removeNotification]);

  // Automatically pick the next notification from the queue
  const processQueue = useCallback(() => {
    if (notifications.length > 0) {
      const top = notifications[0];
      setMessageInfo(top);
      removeNotification(top.id);
      setVisible(true); // triggers fade-in
    }
  }, [notifications, removeNotification]);

  // Whenever notifications change or we consume the current message,
  // display the next item in the queue (if any).
  useEffect(() => {
    if (!messageInfo && notifications.length > 0) {
      processQueue();
    }
  }, [notifications, messageInfo, processQueue]);

  // Handle auto-hide
  useEffect(() => {
    // Clear any in-progress timers whenever the messageInfo changes
    if (autoHideTimer.current) {
      clearTimeout(autoHideTimer.current);
    }

    if (messageInfo?.autoHideMs) {
      autoHideTimer.current = setTimeout(() => {
        closeNotification("timeout");
      }, messageInfo.autoHideMs);
    }

    return () => {
      if (autoHideTimer.current) {
        clearTimeout(autoHideTimer.current);
      }
    };
  }, [messageInfo, closeNotification]);

  // If nothing to show, render nothing
  if (!messageInfo) {
    return null;
  }
  // Apply different background colors based on notification type
  const bgColor = (() => {
    switch (messageInfo.type) {
      case "error":
        return "bg-red-500 text-white";
      case "success":
        return "bg-green-500 text-white";
      case "info":
        return "bg-blue-500 text-white";
      default:
        return "bg-white text-black";
    }
  })();

  return (
    <div
      // Because we’re only showing one notification at a time (top of queue),
      // we can just animate this single container.
      className={`
        fixed z-50 right-4 top-20
        px-4 py-3
        rounded shadow-md
        transition-all duration-300
        ${bgColor}
        ${visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"}
      `}
      // Extra inline style if you want to tweak positioning
      style={{ minWidth: "200px" }}
      role="alert"
    >
      <div className="flex items-center justify-between">
        <span>{messageInfo.message}</span>
        <button
          className="ml-3 hover:opacity-75"
          onClick={() => closeNotification("clickaway")}
          aria-label="Close"
        >
          &times;
        </button>
      </div>
    </div>
  );
};
