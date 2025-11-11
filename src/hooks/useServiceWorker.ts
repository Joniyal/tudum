"use client";

import { useEffect } from "react";

export function useServiceWorker() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/service-worker.js", { scope: "/" })
        .then((registration) => {
          console.log("[SW_REGISTER] Service Worker registered:", registration);
        })
        .catch((error) => {
          console.error("[SW_REGISTER] Service Worker registration failed:", error);
        });
    }
  }, []);
}
