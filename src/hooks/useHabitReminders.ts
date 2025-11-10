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
    if (status === "authenticated" && "Notification" in window) {
      Notification.requestPermission().then((permission) => {
        notificationPermission.current = permission;
        console.log("[REMINDERS] Notification permission:", permission);
      });
    }
  }, [status]);

  // Check for reminders every minute
  useEffect(() => {
    if (status !== "authenticated") return;

    const checkReminders = async () => {
      try {
        const res = await fetch("/api/reminders/check");
        if (res.ok) {
          const data = await res.json();
          const { reminders } = data;

          // Show notification for each reminder
          if (reminders && reminders.length > 0 && notificationPermission.current === "granted") {
            reminders.forEach((reminder: Reminder) => {
              const notification = new Notification(`🎯 Time for: ${reminder.title}`, {
                body: reminder.description || `Don't forget your ${reminder.frequency.toLowerCase()} habit!`,
                icon: "/icon-192x192.png", // You can add an icon later
                tag: reminder.id, // Prevents duplicate notifications
                requireInteraction: true, // Notification stays until user interacts
              });

              notification.onclick = () => {
                window.focus();
                notification.close();
                // Navigate to dashboard
                window.location.href = "/dashboard";
              };

              console.log("[REMINDERS] Notification shown for:", reminder.title);
            });
          }
        }
      } catch (error) {
        console.error("[REMINDERS] Error checking reminders:", error);
      }
    };

    // Check immediately on mount
    checkReminders();

    // Then check every minute
    checkInterval.current = setInterval(checkReminders, 60000);

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
