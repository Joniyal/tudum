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
    // Fetch pending requests count
    const fetchPendingCount = async () => {
      try {
        const res = await fetch("/api/connections");
        if (res.ok) {
          const connections = await res.json();
          const pending = connections.filter(
            (c: any) =>
              c.status === "PENDING" && c.toUserId === session?.user?.id
          );
          setPendingCount(pending.length);
        }
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
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    localStorage.setItem('theme', newIsDark ? 'dark' : 'light');
    
    if (newIsDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const navItems = [
    { href: "/dashboard", label: "My Habits" },
    { href: "/dashboard/discover", label: "Discover" },
    { href: "/dashboard/requests", label: "Requests" },
    { href: "/dashboard/partners", label: "Partners" },
    { href: "/dashboard/messages", label: "Messages" },
    { href: "/dashboard/stats", label: "Stats" },
  ];

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="text-2xl font-bold text-indigo-600">
              Tudum
            </Link>
            <div className="hidden md:flex space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative px-3 py-2 rounded-md text-sm font-medium transition ${
                    pathname === item.href
                      ? "bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  {item.label}
                  {item.href === "/dashboard/requests" && pendingCount > 0 && (
                    <span className="absolute -top-1 -right-2 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
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
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300"
              aria-label="Toggle theme"
            >
              {isDark ? (
                <svg className="w-5 h-5 text-yellow-500 transition-transform duration-300 rotate-0 hover:rotate-180" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-gray-700 transition-transform duration-300 rotate-0 hover:-rotate-12" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {(session?.user?.name || session?.user?.email)?.[0]?.toUpperCase()}
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:inline">
                  {session?.user?.name || session?.user?.email}
                </span>
                <svg
                  className={`w-4 h-4 text-gray-700 dark:text-gray-300 transition-transform ${
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
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-50">
                  <Link
                    href="/dashboard/profile"
                    onClick={() => setShowProfileMenu(false)}
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 first:rounded-t-lg"
                  >
                    👤 View Profile
                  </Link>
                  <Link
                    href="/dashboard/profile"
                    onClick={() => setShowProfileMenu(false)}
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    ✏️ Edit Profile
                  </Link>
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 last:rounded-b-lg"
                  >
                    🚪 Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stale Session Modal */}
      {showStaleSessionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md shadow-lg">
            <h2 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2">
              ⚠️ Session Expired
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Your session has expired. This can happen after a database update or if you logged in from another device.
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Please log out and log back in to continue.
            </p>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition"
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
      <div className={`${isMessagesPage ? "h-screen overflow-hidden" : "min-h-screen"} bg-gray-50 dark:bg-gray-900 flex flex-col`}>
        <DashboardNav />
        <main className={`${isMessagesPage ? "flex-1 overflow-hidden" : "flex-1 overflow-auto"} max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 ${isMessagesPage ? "py-8" : "py-8"}`}>
          {children}
        </main>
      </div>
    </SessionProvider>
  );
}
