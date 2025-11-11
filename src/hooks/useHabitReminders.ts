"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";

type Reminder = {
  id: string;
  title: string;
  description: string | null;
  frequency: string;
  reminderTime: string;
};

export function useHabitReminders() {
  const { data: session, status } = useSession();
  const notificationPermission = useRef<NotificationPermission>("default");
  const checkInterval = useRef<NodeJS.Timeout | null>(null);
  const lastNotificationTime = useRef<string>("");

  // Request notification permission on mount
  useEffect(() => {
    if (status === "authenticated") {
      if ("Notification" in window) {
        console.log("[REMINDERS] Browser supports notifications, requesting permission...");
        Notification.requestPermission().then((permission) => {
          notificationPermission.current = permission;
          console.log("[REMINDERS] Notification permission:", permission);
          if (permission === "denied") {
            console.warn("[REMINDERS] Notifications are blocked! Please enable them in browser settings.");
          } else if (permission === "granted") {
            console.log("[REMINDERS] Notifications enabled!");
          }
        });
      } else {
        console.error("[REMINDERS] Browser does not support notifications");
      }
    }
  }, [status]);

  // Check for reminders every 5 seconds (for this tab)
  useEffect(() => {
    if (status !== "authenticated") return;

    const checkReminders = async () => {
      try {
        console.log("[REMINDERS-TAB] Checking for reminders...");
        const res = await fetch("/api/reminders/check");
        if (res.ok) {
          const data = await res.json();
          const { reminders, currentTime } = data;
          console.log("[REMINDERS-TAB] Current time:", currentTime, "| Found", reminders?.length || 0, "reminders");

          // Show notification for each reminder (only if tab is focused)
          if (reminders && reminders.length > 0 && document.hasFocus()) {
            console.log("[REMINDERS-TAB] Tab is focused, showing notifications");
            if (notificationPermission.current === "granted") {
              reminders.forEach((reminder: Reminder) => {
                const notificationKey = `${reminder.id}-${currentTime}`;
                
                // Only show if we haven't already shown it this minute
                if (lastNotificationTime.current !== notificationKey) {
                  console.log("[REMINDERS-TAB] Showing notification for:", reminder.title);

                  const notification = new Notification(`🎯 Time for: ${reminder.title}`, {
                    body: reminder.description || `Don't forget your ${reminder.frequency.toLowerCase()} habit!`,
                    tag: reminder.id,
                    requireInteraction: true,
                    silent: false,
                  } as any);

                  notification.onclick = () => {
                    window.focus();
                    notification.close();
                    window.location.href = "/dashboard";
                  };

                  lastNotificationTime.current = notificationKey;
                  console.log("[REMINDERS-TAB] Notification shown for:", reminder.title);
                }
              });
            } else {
              console.warn("[REMINDERS-TAB] Cannot show notifications - permission:", notificationPermission.current);
            }
          }
        }
      } catch (error) {
        console.error("[REMINDERS-TAB] Error checking reminders:", error);
      }
    };

    // Check immediately on mount
    checkReminders();

    // Check every 5 seconds
    checkInterval.current = setInterval(checkReminders, 5000);

    return () => {
      if (checkInterval.current) {
        clearInterval(checkInterval.current);
      }
    };
  }, [status]);

  return {
    notificationPermission: notificationPermission.current,
  };
}
