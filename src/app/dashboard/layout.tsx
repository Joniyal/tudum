"use client";

import { SessionProvider } from "next-auth/react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useHabitReminders } from "@/hooks/useHabitReminders";
import { useServiceWorker } from "@/hooks/useServiceWorker";

function DashboardNav() {
  // Enable habit reminders
  useHabitReminders();
  // Register service worker for background notifications
  useServiceWorker();
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isNight, setIsNight] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [showStaleSessionModal, setShowStaleSessionModal] = useState(false);

  const applyTheme = useCallback((nightMode: boolean) => {
    const root = document.documentElement;
    root.classList.remove("theme-day", "theme-night");
    root.classList.add(nightMode ? "theme-night" : "theme-day");
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const storedTheme = localStorage.getItem("theme");
    const initialNight = storedTheme ? storedTheme === "night" : mediaQuery.matches;
    setIsNight(initialNight);
    applyTheme(initialNight);

    const handleChange = (event: MediaQueryListEvent) => {
      const stored = localStorage.getItem("theme");
      const nextNight = stored ? stored === "night" : event.matches;
      setIsNight(nextNight);
      applyTheme(nextNight);
    };

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, [applyTheme]);

  // Validate session on component mount
  useEffect(() => {
    if (!session?.user?.id) return;

    const validateSession = async () => {
      try {
        // Try to fetch user's connections as a session validity check
        const res = await fetch("/api/connections");
        if (res.status === 401) {
          const data = await res.json();
          if (data.code === "STALE_SESSION") {
            console.warn("[DASHBOARD] Stale session detected - user no longer in database");
            setShowStaleSessionModal(true);
          }
        }
      } catch (error) {
        console.error("[DASHBOARD] Error validating session:", error);
      }
    };

    validateSession();
  }, [session?.user?.id]);

  useEffect(() => {
    // Fetch pending requests count (connections + habit shares)
    const fetchPendingCount = async () => {
      try {
        const [connectionsRes, habitSharesRes] = await Promise.all([
          fetch("/api/connections"),
          fetch("/api/habit-shares?type=received"),
        ]);
        
        let totalPending = 0;
        
        if (connectionsRes.ok) {
          const connections = await connectionsRes.json();
          const pendingConnections = connections.filter(
            (c: any) =>
              c.status === "PENDING" && c.toUserId === session?.user?.id
          );
          totalPending += pendingConnections.length;
        }
        
        if (habitSharesRes.ok) {
          const habitShares = await habitSharesRes.json();
          const pendingHabitShares = habitShares.filter(
            (s: any) => s.status === "PENDING"
          );
          totalPending += pendingHabitShares.length;
        }
        
        setPendingCount(totalPending);
      } catch (error) {
        console.error("Error fetching pending count:", error);
      }
    };

    if (session?.user?.id) {
      fetchPendingCount();
      // Poll every 10 seconds
      const interval = setInterval(fetchPendingCount, 10000);
      return () => clearInterval(interval);
    }
  }, [session?.user?.id]);

  const toggleTheme = () => {
    setIsNight((prev) => {
      const next = !prev;
      applyTheme(next);
      localStorage.setItem("theme", next ? "night" : "day");
      return next;
    });
  };

  const navItems = [
    { href: "/dashboard", label: "My Habits" },
    { href: "/dashboard/social", label: "Social" },
    { href: "/dashboard/messages", label: "Messages" },
    { href: "/dashboard/stats", label: "Stats" },
  ];

  return (
    <nav className="retro-nav">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="retro-heading text-xl tracking-[0.24em] flex items-center gap-3 hover-lift">
              <svg className="w-8 h-8" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2">
                {/* Retro checkmark in box */}
                <rect x="8" y="8" width="48" height="48" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="20,32 28,40 44,24" strokeLinecap="round" strokeLinejoin="round"/>
                {/* Decorative dots */}
                <circle cx="56" cy="12" r="2" fill="currentColor"/>
                <circle cx="12" cy="56" r="2" fill="currentColor"/>
              </svg>
              TUDUM
            </Link>
            <div className="hidden md:flex items-center gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`retro-nav-link ${pathname === item.href ? "is-active" : ""}`}
                >
                  {item.label}
                  {item.href === "/dashboard/social" && pendingCount > 0 && (
                    <span className="retro-badge ml-2">{pendingCount}</span>
                  )}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="retro-switch hover-lift"
              aria-pressed={isNight}
              title={isNight ? "Switch to Day Mode" : "Switch to Night Mode"}
            >
              <span className={`retro-switch__indicator ${isNight ? "is-night" : ""}`}></span>
              <span className="text-[0.68rem]">{isNight ? "Night" : "Day"}</span>
            </button>

            <div className="relative">
              <button
                onClick={() => setShowProfileMenu((prev) => !prev)}
                className="retro-button-outline px-4 py-2 text-xs"
              >
                <span className="flex items-center gap-3">
                  <span className="retro-avatar text-sm">
                    {(session?.user?.name || session?.user?.email)?.[0]?.toUpperCase()}
                  </span>
                  <span className="hidden sm:block tracking-[0.16em]">
                    {session?.user?.name || session?.user?.email}
                  </span>
                  <svg
                    className={`h-4 w-4 transition-transform ${showProfileMenu ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </span>
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-3 w-56 retro-panel animate-slide-down">
                  <div className="flex flex-col divide-y-2 divide-[color:var(--border)]">
                    <Link
                      href="/dashboard/profile"
                      onClick={() => setShowProfileMenu(false)}
                      className="px-5 py-3 text-sm tracking-[0.14em] uppercase hover:bg-[color:var(--background)]"
                    >
                      View Profile
                    </Link>
                    <Link
                      href="/dashboard/profile"
                      onClick={() => setShowProfileMenu(false)}
                      className="px-5 py-3 text-sm tracking-[0.14em] uppercase hover:bg-[color:var(--background)]"
                    >
                      Edit Profile
                    </Link>
                    {session?.user?.isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setShowProfileMenu(false)}
                        className="px-5 py-3 text-sm tracking-[0.14em] uppercase hover:bg-[color:var(--background)]"
                      >
                        Admin Panel
                      </Link>
                    )}
                    <button
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="px-5 py-3 text-left text-sm tracking-[0.14em] uppercase hover:bg-[color:var(--background)]"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showStaleSessionModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="retro-panel max-w-md w-full p-8 space-y-4 animate-expand">
            <h2 className="retro-heading text-lg">Session Expired</h2>
            <p className="retro-text-muted text-sm leading-relaxed">
              Your authentication session is no longer valid. This can happen after security
              changes or when you log in from another device.
            </p>
            <p className="retro-text-muted text-xs uppercase tracking-[0.16em]">
              Please sign in again to continue.
            </p>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="retro-button w-full"
            >
              Log Out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isMessagesPage = pathname === "/dashboard/messages";

  return (
    <SessionProvider>
      <div className={`${isMessagesPage ? "h-screen overflow-hidden" : "min-h-screen"} retro-app flex flex-col`}>
        <DashboardNav />
        <main className={`${isMessagesPage ? "flex-1 overflow-hidden" : "flex-1 overflow-auto"}`}>
          <div className={`retro-container px-4 sm:px-6 lg:px-8 ${isMessagesPage ? "h-full py-6" : "py-10"}`}>
            {children}
          </div>
        </main>
      </div>
    </SessionProvider>
  );
}
