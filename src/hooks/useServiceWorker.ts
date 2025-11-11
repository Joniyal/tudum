"use client";

import { useEffect } from "react";

export function useServiceWorker() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      // Unregister old service workers first
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          console.log("[SW_REGISTER] Updating old Service Worker...");
          registration.update();
        });
      });

      navigator.serviceWorker
        .register("/service-worker.js", { 
          scope: "/",
          updateViaCache: "none" // Force fresh fetch
        })
        .then((registration) => {
          console.log("[SW_REGISTER] Service Worker registered:", registration);
          
          // Check for updates every 30 seconds
          setInterval(() => {
            registration.update();
          }, 30000);
          
          // Listen for updates
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            console.log("[SW_REGISTER] New Service Worker found, installing...");
            
            newWorker?.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                console.log("[SW_REGISTER] New Service Worker installed! Reloading page...");
                // Auto-reload to activate new SW
                window.location.reload();
              }
            });
          });
        })
        .catch((error) => {
          console.error("[SW_REGISTER] Service Worker registration failed:", error);
        });
    }
  }, []);
}
