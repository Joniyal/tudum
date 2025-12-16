"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session?.user?.isAdmin) {
      router.push("/dashboard");
      return;
    }
    
    setIsAuthorized(true);
  }, [session, status, router]);

  if (status === "loading" || !isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="text-center">
          <div 
            className="w-8 h-8 border-2 rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: 'var(--border)', borderTopColor: 'var(--text)' }}
          />
          <p style={{ color: 'var(--muted)' }}>Verifying access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Admin Header */}
      <header 
        className="border-b sticky top-0 z-50"
        style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-6">
              <Link href="/admin" className="flex items-center gap-2">
                <svg 
                  viewBox="0 0 24 24" 
                  className="w-7 h-7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ color: 'var(--text)' }}
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <path d="M9 12l2 2 4-4"/>
                </svg>
                <span className="font-bold text-lg" style={{ color: 'var(--text)' }}>
                  Admin Panel
                </span>
              </Link>
              
              <nav className="hidden md:flex items-center gap-4">
                <Link 
                  href="/admin"
                  className="px-3 py-2 text-sm font-medium rounded-md transition-colors hover:bg-opacity-10"
                  style={{ color: 'var(--muted)' }}
                >
                  Dashboard
                </Link>
                <Link 
                  href="/admin/users"
                  className="px-3 py-2 text-sm font-medium rounded-md transition-colors hover:bg-opacity-10"
                  style={{ color: 'var(--muted)' }}
                >
                  Users
                </Link>
                <Link 
                  href="/admin/habits"
                  className="px-3 py-2 text-sm font-medium rounded-md transition-colors hover:bg-opacity-10"
                  style={{ color: 'var(--muted)' }}
                >
                  Habits
                </Link>
                <Link 
                  href="/admin/connections"
                  className="px-3 py-2 text-sm font-medium rounded-md transition-colors hover:bg-opacity-10"
                  style={{ color: 'var(--muted)' }}
                >
                  Connections
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-4">
              <Link 
                href="/dashboard"
                className="px-3 py-2 text-sm font-medium rounded-md border transition-colors"
                style={{ color: 'var(--muted)', borderColor: 'var(--border)' }}
              >
                ← Back to App
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <nav 
        className="md:hidden border-b px-4 py-2 flex gap-2 overflow-x-auto"
        style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
      >
        <Link 
          href="/admin"
          className="px-3 py-1.5 text-sm font-medium rounded-md whitespace-nowrap"
          style={{ color: 'var(--muted)' }}
        >
          Dashboard
        </Link>
        <Link 
          href="/admin/users"
          className="px-3 py-1.5 text-sm font-medium rounded-md whitespace-nowrap"
          style={{ color: 'var(--muted)' }}
        >
          Users
        </Link>
        <Link 
          href="/admin/habits"
          className="px-3 py-1.5 text-sm font-medium rounded-md whitespace-nowrap"
          style={{ color: 'var(--muted)' }}
        >
          Habits
        </Link>
        <Link 
          href="/admin/connections"
          className="px-3 py-1.5 text-sm font-medium rounded-md whitespace-nowrap"
          style={{ color: 'var(--muted)' }}
        >
          Connections
        </Link>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
