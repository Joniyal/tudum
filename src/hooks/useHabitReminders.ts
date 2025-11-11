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

  // Request notification permission on mount
  useEffect(() => {
    if (status === "authenticated") {
      if ("Notification" in window) {
        console.log("[REMINDERS] Browser supports notifications");
        Notification.requestPermission().then((permission) => {
          notificationPermission.current = permission;
          console.log("[REMINDERS] Notification permission:", permission);
          if (permission === "denied") {
            console.warn("[REMINDERS] Notifications are blocked! Please enable them in browser settings.");
          }
        });
      } else {
        console.error("[REMINDERS] Browser does not support notifications");
      }
    }
  }, [status]);

  // Check for reminders every minute
  useEffect(() => {
    if (status !== "authenticated") return;

    const checkReminders = async () => {
      try {
        console.log("[REMINDERS] Checking for reminders...");
        const res = await fetch("/api/reminders/check");
        if (res.ok) {
          const data = await res.json();
          const { reminders, currentTime } = data;
          console.log("[REMINDERS] Current time:", currentTime, "| Found", reminders?.length || 0, "reminders");

          // Show notification for each reminder
          if (reminders && reminders.length > 0) {
            console.log("[REMINDERS] Permission status:", notificationPermission.current);
            if (notificationPermission.current === "granted") {
              reminders.forEach((reminder: Reminder) => {
                // Play notification sound
                const audio = new Audio("/notification-sound.mp3");
                audio.play().catch((err) => console.log("[REMINDERS] Audio play failed:", err));

                const notification = new Notification(`🎯 Time for: ${reminder.title}`, {
                  body: reminder.description || `Don't forget your ${reminder.frequency.toLowerCase()} habit!`,
                  icon: "/icon-192x192.png", // You can add an icon later
                  tag: reminder.id, // Prevents duplicate notifications
                  requireInteraction: true, // Notification stays until user interacts
                  silent: false, // Enable system notification sound
                });

                notification.onclick = () => {
                  window.focus();
                  notification.close();
                  // Navigate to dashboard
                  window.location.href = "/dashboard";
                };

                console.log("[REMINDERS] Notification shown for:", reminder.title);
              });
            } else {
              console.warn("[REMINDERS] Cannot show notifications - permission:", notificationPermission.current);
            }
          }
        }
      } catch (error) {
        console.error("[REMINDERS] Error checking reminders:", error);
      }
    };

    // Check immediately on mount
    checkReminders();

    // Check every 10 seconds instead of every minute (to ensure we catch it)
    checkInterval.current = setInterval(checkReminders, 10000);

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
