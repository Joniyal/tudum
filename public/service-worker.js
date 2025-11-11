// Service Worker for habit reminders
console.log("[SERVICE_WORKER] Loaded");

// Store to track sent notifications
let notificationsSent = new Set();

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
          
          // Only send if we haven't already sent it this minute
          if (!notificationsSent.has(notificationKey)) {
            console.log(`[SERVICE_WORKER] Sending notification for: ${reminder.title}`);
            
            self.registration.showNotification(`🎯 Time for: ${reminder.title}`, {
              body: reminder.description || `Don't forget your ${reminder.frequency.toLowerCase()} habit!`,
              icon: "/icon-192x192.png",
              badge: "/icon-192x192.png",
              tag: reminder.id,
              requireInteraction: true,
              vibrate: [200, 100, 200],
              actions: [
                {
                  action: "open",
                  title: "Open Tudum",
                  icon: "/icon-192x192.png"
                },
                {
                  action: "close",
                  title: "Close"
                }
              ]
            }).catch((err) => {
              console.error("[SERVICE_WORKER] Error showing notification:", err);
            });
            
            notificationsSent.add(notificationKey);
            
            // Clean up old entries after 2 minutes
            setTimeout(() => {
              notificationsSent.delete(notificationKey);
            }, 120000);
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
  console.log("[SERVICE_WORKER] Notification clicked:", event.notification.tag);
  event.notification.close();
  
  // Open dashboard window
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      // Check if dashboard is already open
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes("/dashboard") && "focus" in client) {
          return client.focus();
        }
      }
      // If not open, open new window
      if (clients.openWindow) {
        return clients.openWindow("/dashboard");
      }
    })
  );
});

// Handle notification close
self.addEventListener("notificationclose", (event) => {
  console.log("[SERVICE_WORKER] Notification closed:", event.notification.tag);
});
