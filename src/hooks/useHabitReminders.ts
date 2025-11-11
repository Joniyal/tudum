"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";

type Reminder = {
  id: string;
  title: string;
  description: string | null;
  frequency: string;
  reminderTime: string;
  alarmDuration: number | null;
};

type ActiveAlarm = {
  habit: Reminder;
  triggeredAt: Date;
  snoozedUntil?: Date;
};

export function useHabitReminders() {
  const { data: session, status } = useSession();
  const notificationPermission = useRef<NotificationPermission>("default");
  const checkInterval = useRef<NodeJS.Timeout | null>(null);
  const lastNotificationTime = useRef<string>("");
  const [activeAlarms, setActiveAlarms] = useState<ActiveAlarm[]>([]);

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
      
      // Listen for messages from Service Worker
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.addEventListener("message", (event) => {
          if (event.data.type === "OPEN_ALARM") {
            console.log("[REMINDERS] Received alarm request from SW:", event.data.habitId);
            // Trigger alarm for this habit
            // (This would need to fetch habit details and add to activeAlarms)
          }
        });
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

          // Trigger alarms for each reminder
          if (reminders && reminders.length > 0) {
            console.log("[REMINDERS-TAB] Found reminders, checking alarms...");
            
            reminders.forEach((reminder: Reminder) => {
              const notificationKey = `${reminder.id}-${currentTime}`;
              
              // Check if already triggered or snoozed
              const existingAlarm = activeAlarms.find(a => a.habit.id === reminder.id);
              const isAlreadyActive = existingAlarm !== undefined;
              const isSnoozed = existingAlarm?.snoozedUntil && existingAlarm.snoozedUntil > new Date();
              
              // Only trigger if not already active and not snoozed
              if (!isAlreadyActive && lastNotificationTime.current !== notificationKey) {
                console.log("[REMINDERS-TAB] Triggering alarm for:", reminder.title);
                
                setActiveAlarms(prev => [...prev, {
                  habit: reminder,
                  triggeredAt: new Date(),
                }]);
                
                lastNotificationTime.current = notificationKey;
              } else if (isSnoozed) {
                console.log("[REMINDERS-TAB] Alarm snoozed for:", reminder.title);
              }
            });
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
  }, [status, activeAlarms]);

  const handleDismiss = (habitId: string) => {
    // Tell Service Worker to stop re-notifications
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: "STOP_ALARM",
        habitId: habitId,
      });
    }
    
    setActiveAlarms(prev => prev.filter(a => a.habit.id !== habitId));
  };

  const handleSnooze = (habitId: string, minutes: number) => {
    // Tell Service Worker to snooze alarm
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: "SNOOZE_ALARM",
        habitId: habitId,
        minutes: minutes,
      });
    }
    
    console.log(`[REMINDERS] Snoozing alarm for ${minutes} minutes`);
    
    // Find the alarm
    const alarm = activeAlarms.find(a => a.habit.id === habitId);
    if (!alarm) return;
    
    // Remove from active alarms (close modal)
    setActiveAlarms(prev => prev.filter(a => a.habit.id !== habitId));
    
    // Re-add after snooze duration
    setTimeout(() => {
      console.log(`[REMINDERS] Re-triggering alarm after ${minutes}m snooze:`, alarm.habit.title);
      setActiveAlarms(prev => [...prev, {
        habit: alarm.habit,
        triggeredAt: new Date(),
      }]);
    }, minutes * 60 * 1000);
  };

  const handleComplete = async (habitId: string) => {
    try {
      const res = await fetch(`/api/habits/${habitId}/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          completedAt: new Date().toISOString(),
        }),
      });
      
      if (res.ok) {
        console.log("[REMINDERS] Habit marked complete:", habitId);
        
        // Tell Service Worker to stop re-notifications
        if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: "STOP_ALARM",
            habitId: habitId,
          });
        }
        
        setActiveAlarms(prev => prev.filter(a => a.habit.id !== habitId));
      } else {
        const errorData = await res.json();
        console.error("[REMINDERS] Failed to mark complete:", errorData);
      }
    } catch (error) {
      console.error("[REMINDERS] Error marking habit complete:", error);
    }
  };

  return {
    notificationPermission: notificationPermission.current,
    activeAlarms,
    handleDismiss,
    handleSnooze,
    handleComplete,
  };
}
