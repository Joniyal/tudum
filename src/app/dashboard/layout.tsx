"use client";

import { SessionProvider } from "next-auth/react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useHabitReminders } from "@/hooks/useHabitReminders";
import { useServiceWorker } from "@/hooks/useServiceWorker";

function DashboardNav() {
  // Enable habit reminders
  useHabitReminders();
  // Register service worker for background notifications
  useServiceWorker();
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isDark, setIsDark] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [showStaleSessionModal, setShowStaleSessionModal] = useState(false);

  useEffect(() => {
    // Check system preference on mount
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const stored = localStorage.getItem('theme');
    const shouldBeDark = stored === 'dark' || (!stored && isDarkMode);
    setIsDark(shouldBeDark);
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

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
    // Theme is always retro black/white, but button provides visual feedback
    // This is kept for UI consistency - the actual theme is fixed
    const elem = document.activeElement as HTMLElement;
    if (elem) elem.blur();
  };

  const navItems = [
    { href: "/dashboard", label: "My Habits" },
    { href: "/dashboard/social", label: "Social" },
    { href: "/dashboard/messages", label: "Messages" },
    { href: "/dashboard/stats", label: "Stats" },
  ];

  return (
    <nav className="bg-black border-b-4 border-white font-mono">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="text-2xl font-black text-white uppercase tracking-widest" style={{textShadow: '2px 2px 0px rgba(255,255,255,0.5)'}}>
              Tudum
            </Link>
            <div className="hidden md:flex space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative px-4 py-2 text-sm font-black uppercase tracking-wider transition-all duration-200 border-2 ${
                    pathname === item.href
                      ? "bg-white text-black border-white"
                      : "text-white border-white hover:bg-white hover:text-black"
                  }`}
                >
                  {item.label}
                  {item.href === "/dashboard/social" && pendingCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-white text-black text-xs font-black w-5 h-5 flex items-center justify-center border-2 border-white">
                      {pendingCount}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="p-2 border-2 border-white text-white font-black uppercase text-xs hover:bg-white hover:text-black transition-all duration-200 hover:scale-110 active:scale-95"
              aria-label="Theme button"
              title="Retro mode activated"
            >
              <span className="inline-block transition-transform duration-300 hover:rotate-12">RETRO</span>
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center space-x-2 px-4 py-2 border-2 border-white text-white font-black uppercase tracking-wider hover:bg-white hover:text-black transition-all duration-200"
              >
                <div className="w-8 h-8 bg-white text-black border-2 border-white rounded-none flex items-center justify-center font-black text-sm">
                  {(session?.user?.name || session?.user?.email)?.[0]?.toUpperCase()}
                </div>
                <span className="text-sm font-black hidden sm:inline">
                  {session?.user?.name || session?.user?.email}
                </span>
                <svg
                  className={`w-4 h-4 transition-transform ${
                    showProfileMenu ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-black border-2 border-white z-50" style={{boxShadow: '4px 4px 0px rgba(255,255,255,0.3)'}}>
                  <Link
                    href="/dashboard/profile"
                    onClick={() => setShowProfileMenu(false)}
                    className="block px-4 py-2 text-sm text-white font-black uppercase tracking-wide hover:bg-white hover:text-black transition-all border-b-2 border-white"
                  >
                    VIEW PROFILE
                  </Link>
                  <Link
                    href="/dashboard/profile"
                    onClick={() => setShowProfileMenu(false)}
                    className="block px-4 py-2 text-sm text-white font-black uppercase tracking-wide hover:bg-white hover:text-black transition-all border-b-2 border-white"
                  >
                    EDIT PROFILE
                  </Link>
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="w-full text-left px-4 py-2 text-sm text-white font-black uppercase tracking-wide hover:bg-white hover:text-black transition-all"
                  >
                    SIGN OUT
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stale Session Modal */}
      {showStaleSessionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 font-mono">
          <div className="bg-black border-4 border-white p-6 max-w-md" style={{boxShadow: '8px 8px 0px rgba(255,255,255,0.3)'}}>
            <h2 className="text-lg font-black text-white mb-2 uppercase tracking-wider">
              SESSION EXPIRED
            </h2>
            <p className="text-white font-bold mb-4 uppercase tracking-wide opacity-90">
              Your session has expired. This can happen after a database update or if you logged in from another device.
            </p>
            <p className="text-sm text-white font-bold mb-4 uppercase opacity-75">
              Please log out and log back in to continue.
            </p>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="w-full bg-white text-black font-black py-2 px-4 uppercase tracking-wider hover:bg-black hover:text-white hover:border-2 hover:border-white transition-all border-2 border-white"
            >
              LOG OUT
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
      <div className={`${isMessagesPage ? "h-screen overflow-hidden" : "min-h-screen"} bg-black flex flex-col font-mono`}>
        <DashboardNav />
        <main className={`${isMessagesPage ? "flex-1 overflow-hidden" : "flex-1 overflow-auto"} max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 ${isMessagesPage ? "py-8" : "py-8"}`}>
          {children}
        </main>
      </div>
    </SessionProvider>
  );
}
