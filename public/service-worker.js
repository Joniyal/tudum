// Service Worker for habit reminders - v2.1
const SW_VERSION = "2.1";
console.log("[SERVICE_WORKER] Loaded - Version:", SW_VERSION);

// Store to track sent notifications and active alarms
let notificationsSent = new Set();
let activeAlarms = new Map(); // habitId -> { startTime, duration, snoozedUntil, interval }

// Listen for messages from the page
self.addEventListener("message", (event) => {
  const { type, habitId, minutes } = event.data;
  
  if (type === "STOP_ALARM") {
    console.log("[SERVICE_WORKER] Received STOP_ALARM message for:", habitId);
    const alarm = activeAlarms.get(habitId);
    if (alarm && alarm.interval) {
      clearInterval(alarm.interval);
      console.log("[SERVICE_WORKER] Cleared interval for:", habitId);
    }
    activeAlarms.delete(habitId);
  } else if (type === "SNOOZE_ALARM") {
    console.log("[SERVICE_WORKER] Received SNOOZE_ALARM message for:", habitId, "minutes:", minutes);
    const alarm = activeAlarms.get(habitId);
    if (alarm) {
      alarm.snoozedUntil = Date.now() + (minutes * 60000);
      console.log("[SERVICE_WORKER] Snoozed alarm for:", minutes, "minutes");
    }
  }
});

// Check reminders every 5 seconds
setInterval(async () => {
  console.log("[SERVICE_WORKER] Checking reminders...");
  
  try {
    const response = await fetch("/api/reminders/check");
    if (response.ok) {
      const data = await response.json();
      const { reminders, currentTime } = data;
      
      console.log(`[SERVICE_WORKER] Current time: ${currentTime} | Found ${reminders?.length || 0} reminders`);
      
      if (reminders && reminders.length > 0) {
        reminders.forEach((reminder) => {
          const notificationKey = `${reminder.id}-${currentTime}`;
          
          // Check if alarm is snoozed
          const alarm = activeAlarms.get(reminder.id);
          if (alarm && alarm.snoozedUntil && alarm.snoozedUntil > Date.now()) {
            console.log(`[SERVICE_WORKER] Alarm snoozed for: ${reminder.title}`);
            return;
          }
          
          // Only send if we haven't already sent it this minute
          if (!notificationsSent.has(notificationKey)) {
            console.log(`[SERVICE_WORKER] Triggering alarm for: ${reminder.title}`);
            
            // Re-notify every 30 seconds if alarm still active
            const renotifyInterval = setInterval(() => {
              const alarm = activeAlarms.get(reminder.id);
              if (!alarm) {
                clearInterval(renotifyInterval);
                return;
              }
              
              const elapsed = Date.now() - alarm.startTime;
              const elapsedMinutes = Math.floor(elapsed / 60000);
              const durationMs = alarm.duration * 60000;
              
              // Check if alarm should auto-stop (unless duration is -1 for "until completed")
              if (alarm.duration !== -1 && elapsed >= durationMs) {
                console.log(`[SERVICE_WORKER] Alarm auto-stopped after ${alarm.duration} minutes`);
                activeAlarms.delete(reminder.id);
                clearInterval(renotifyInterval);
                return;
              }
              
              // Re-show notification to keep it persistent
              self.registration.showNotification(`⏰ ALARM: ${alarm.title} (${elapsedMinutes}m)`, {
                body: alarm.duration === -1 
                  ? 'Mark complete to stop alarm!'
                  : `Stops in ${alarm.duration - elapsedMinutes} minutes`,
                icon: "/favicon.ico",
                badge: "/favicon.ico",
                tag: reminder.id,
                requireInteraction: true,
                vibrate: [500, 200, 500, 200, 500],
                silent: false,
                renotify: true,
                actions: [
                  {
                    action: "complete",
                    title: "✓ Mark Complete",
                  },
                  {
                    action: "snooze-1",
                    title: "Snooze 1min",
                  },
                  {
                    action: "snooze-2",
                    title: "Snooze 2min",
                  },
                  {
                    action: "dismiss",
                    title: "Dismiss",
                  }
                ]
              });
            }, 30000); // Re-notify every 30 seconds
            
            // Store alarm info with interval reference
            activeAlarms.set(reminder.id, {
              startTime: Date.now(),
              duration: reminder.alarmDuration || 5, // minutes
              habitId: reminder.id,
              title: reminder.title,
              interval: renotifyInterval,
            });
            
            // Show initial persistent notification with actions
            self.registration.showNotification(`⏰ ALARM: ${reminder.title}`, {
              body: `${reminder.description || 'Complete your habit!'}\n\nAlarm will play for ${reminder.alarmDuration || 5} minutes`,
              icon: "/favicon.ico",
              badge: "/favicon.ico",
              tag: reminder.id,
              requireInteraction: true,
              vibrate: [500, 200, 500, 200, 500, 200, 500], // Continuous vibration pattern
              silent: false,
              renotify: true,
              actions: [
                {
                  action: "complete",
                  title: "✓ Mark Complete",
                },
                {
                  action: "snooze-1",
                  title: "Snooze 1min",
                },
                {
                  action: "snooze-2",
                  title: "Snooze 2min",
                },
                {
                  action: "dismiss",
                  title: "Dismiss",
                }
              ]
            }).catch((err) => {
              console.error("[SERVICE_WORKER] Error showing notification:", err);
            });
            
            notificationsSent.add(notificationKey);
            
            // Clean up old entries after duration + 2 minutes
            setTimeout(() => {
              notificationsSent.delete(notificationKey);
            }, 180000);
          }
        });
      }
    }
  } catch (error) {
    console.error("[SERVICE_WORKER] Error checking reminders:", error);
  }
}, 5000);

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  const habitId = event.notification.tag;
  const action = event.action;
  
  console.log("[SERVICE_WORKER] Notification action:", action, "for habit:", habitId);
  
  event.notification.close();
  
  if (action === "complete") {
    // Mark habit as complete
    event.waitUntil(
      fetch(`/api/habits/${habitId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
        .then((res) => {
          if (res.ok) {
            console.log("[SERVICE_WORKER] Habit marked complete:", habitId);
            
            // Clear the re-notification interval
            const alarm = activeAlarms.get(habitId);
            if (alarm && alarm.interval) {
              clearInterval(alarm.interval);
              console.log("[SERVICE_WORKER] Cleared re-notification interval");
            }
            
            // Remove alarm
            activeAlarms.delete(habitId);
            
            // Show success notification
            self.registration.showNotification("✅ Habit Completed!", {
              body: "Great job! Keep up the streak! 🔥",
              icon: "/favicon.ico",
              tag: `${habitId}-completed`,
              requireInteraction: false,
              vibrate: [200],
            });
          }
        })
        .catch((err) => console.error("[SERVICE_WORKER] Error completing habit:", err))
    );
  } else if (action === "snooze-1") {
    // Snooze for 1 minute
    const alarm = activeAlarms.get(habitId);
    if (alarm) {
      alarm.snoozedUntil = Date.now() + 60000; // 1 minute
      console.log("[SERVICE_WORKER] Snoozed for 1 minute");
      
      self.registration.showNotification("💤 Snoozed for 1 minute", {
        body: "We'll remind you again soon!",
        icon: "/favicon.ico",
        tag: `${habitId}-snooze`,
        requireInteraction: false,
        vibrate: [100],
      });
    }
  } else if (action === "snooze-2") {
    // Snooze for 2 minutes
    const alarm = activeAlarms.get(habitId);
    if (alarm) {
      alarm.snoozedUntil = Date.now() + 120000; // 2 minutes
      console.log("[SERVICE_WORKER] Snoozed for 2 minutes");
      
      self.registration.showNotification("💤 Snoozed for 2 minutes", {
        body: "We'll remind you again soon!",
        icon: "/favicon.ico",
        tag: `${habitId}-snooze`,
        requireInteraction: false,
        vibrate: [100],
      });
    }
  } else if (action === "dismiss") {
    // Dismiss alarm
    const alarm = activeAlarms.get(habitId);
    if (alarm && alarm.interval) {
      clearInterval(alarm.interval);
      console.log("[SERVICE_WORKER] Cleared re-notification interval");
    }
    activeAlarms.delete(habitId);
    console.log("[SERVICE_WORKER] Alarm dismissed");
  } else {
    // Default click - open app with alarm
    event.waitUntil(
      clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
        // Check if dashboard is already open
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes("/dashboard") && "focus" in client) {
            // Send message to open alarm modal
            client.postMessage({
              type: "OPEN_ALARM",
              habitId: habitId,
            });
            return client.focus();
          }
        }
        // If not open, open new window
        if (clients.openWindow) {
          return clients.openWindow(`/dashboard?alarm=${habitId}`);
        }
      })
    );
  }
});

// Handle notification close (user swiped away)
self.addEventListener("notificationclose", (event) => {
  console.log("[SERVICE_WORKER] Notification closed:", event.notification.tag);
  // Don't stop alarm - it will continue via re-notifications
});
