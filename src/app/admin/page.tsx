"use client";

import { useEffect, useState } from "react";
import { UsersIcon, FireIcon, HeartIcon, ClockIcon } from "@/components/Icons";

interface Stats {
  totalUsers: number;
  totalHabits: number;
  totalConnections: number;
  totalCompletions: number;
  recentUsers: Array<{
    id: string;
    username: string;
    email: string;
    createdAt: string;
    _count: { habits: number };
  }>;
  topHabits: Array<{
    id: string;
    title: string;
    frequency: string;
    _count: { completions: number };
    user: { username: string };
  }>;
  userGrowth: Array<{ date: string; count: number }>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/stats");
      if (!res.ok) throw new Error("Failed to fetch stats");
      const data = await res.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div 
          className="w-8 h-8 border-2 rounded-full animate-spin"
          style={{ borderColor: 'var(--border)', borderTopColor: 'var(--text)' }}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className="p-4 rounded-lg border text-center"
        style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
      >
        <p style={{ color: 'var(--muted)' }}>{error}</p>
        <button 
          onClick={fetchStats}
          className="mt-4 px-4 py-2 rounded-lg border transition-colors"
          style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
          Admin Dashboard
        </h1>
        <p style={{ color: 'var(--muted)' }}>
          Overview of your application metrics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<UsersIcon className="w-6 h-6" />}
          label="Total Users"
          value={stats?.totalUsers || 0}
        />
        <StatCard
          icon={<FireIcon className="w-6 h-6" />}
          label="Total Habits"
          value={stats?.totalHabits || 0}
        />
        <StatCard
          icon={<HeartIcon className="w-6 h-6" />}
          label="Connections"
          value={stats?.totalConnections || 0}
        />
        <StatCard
          icon={<ClockIcon className="w-6 h-6" />}
          label="Completions"
          value={stats?.totalCompletions || 0}
        />
      </div>

      {/* Recent Users & Top Habits */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div 
          className="rounded-lg border p-6"
          style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
        >
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>
            Recent Users
          </h2>
          <div className="space-y-3">
            {stats?.recentUsers?.length === 0 ? (
              <p style={{ color: 'var(--muted)' }}>No users yet</p>
            ) : (
              stats?.recentUsers?.map((user) => (
                <div 
                  key={user.id}
                  className="flex items-center justify-between p-3 rounded-lg"
                  style={{ background: 'var(--background)' }}
                >
                  <div>
                    <p className="font-medium" style={{ color: 'var(--text)' }}>
                      @{user.username}
                    </p>
                    <p className="text-sm" style={{ color: 'var(--muted)' }}>
                      {user.email}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                      {user._count.habits} habits
                    </p>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Habits */}
        <div 
          className="rounded-lg border p-6"
          style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
        >
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>
            Most Active Habits
          </h2>
          <div className="space-y-3">
            {stats?.topHabits?.length === 0 ? (
              <p style={{ color: 'var(--muted)' }}>No habits yet</p>
            ) : (
              stats?.topHabits?.map((habit) => (
                <div 
                  key={habit.id}
                  className="flex items-center justify-between p-3 rounded-lg"
                  style={{ background: 'var(--background)' }}
                >
                  <div>
                    <p className="font-medium" style={{ color: 'var(--text)' }}>
                      {habit.title}
                    </p>
                    <p className="text-sm" style={{ color: 'var(--muted)' }}>
                      by @{habit.user.username}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                      {habit._count.completions} completions
                    </p>
                    <p className="text-xs capitalize" style={{ color: 'var(--muted)' }}>
                      {habit.frequency}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* User Growth Chart */}
      <div 
        className="rounded-lg border p-6"
        style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
      >
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>
          User Growth (Last 30 Days)
        </h2>
        <div className="flex items-end gap-1 h-40">
          {stats?.userGrowth?.map((day, i) => {
            const maxCount = Math.max(...(stats?.userGrowth?.map(d => d.count) || [1]));
            const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
            return (
              <div 
                key={i} 
                className="flex-1 rounded-t transition-all group relative"
                style={{ 
                  height: `${Math.max(height, 4)}%`,
                  background: 'var(--text)',
                  opacity: 0.7
                }}
                title={`${day.date}: ${day.count} users`}
              >
                <div 
                  className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
                  style={{ background: 'var(--text)', color: 'var(--background)' }}
                >
                  {day.count}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-2 text-xs" style={{ color: 'var(--muted)' }}>
          <span>30 days ago</span>
          <span>Today</span>
        </div>
      </div>
    </div>
  );
}

function StatCard({ 
  icon, 
  label, 
  value 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: number;
}) {
  return (
    <div 
      className="rounded-lg border p-6"
      style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
    >
      <div className="flex items-center gap-3">
        <div 
          className="p-2 rounded-lg"
          style={{ background: 'var(--background)', color: 'var(--text)' }}
        >
          {icon}
        </div>
        <div>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>{label}</p>
          <p className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
            {value.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
