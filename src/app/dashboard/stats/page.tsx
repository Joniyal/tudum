"use client";

import { useEffect, useState, Suspense, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";

type Stats = {
  totalHabits: number;
  totalCompletions: number;
  completionsByDate: Array<{ date: string; count: number }>;
  habitsWithStreaks: Array<{
    id: string;
    title: string;
    frequency: string;
    totalCompletions: number;
    currentStreak: number;
    longestStreak: number;
  }>;
  averageCompletionsPerDay: string;
};

type Partner = {
  id: string;
  name: string | null;
  email: string;
};

function StatsContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [stats, setStats] = useState<Stats | null>(null);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState("My");
  const [loading, setLoading] = useState(true);

  const fetchPartners = useCallback(async () => {
    try {
      const res = await fetch("/api/connections");
      if (res.ok) {
        const connections = await res.json();
        const acceptedConnections = connections.filter((c: any) => c.status === "ACCEPTED");
        const partnersList = acceptedConnections.map((c: any) => {
          const currentUserId = session?.user?.id;
          return c.fromUser.id === currentUserId ? c.toUser : c.fromUser;
        });
        setPartners(partnersList);
      }
    } catch (error) {
      console.error("Error fetching partners:", error);
    }
  }, [session?.user?.id]);

  const fetchStats = useCallback(async () => {
    try {
      const url = selectedUserId
        ? `/api/stats?userId=${selectedUserId}`
        : "/api/stats";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedUserId]);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  useEffect(() => {
    const userId = searchParams.get("userId");
    if (userId) {
      setSelectedUserId(userId);
      const partner = partners.find((p) => p.id === userId);
      if (partner) {
        setSelectedUserName(partner.name || partner.email);
      }
    } else {
      setSelectedUserId(null);
      setSelectedUserName("My");
    }
  }, [searchParams, partners]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="retro-text-muted uppercase tracking-widest animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="retro-text-muted uppercase tracking-widest">No stats available</div>
      </div>
    );
  }

  const maxCount = Math.max(...stats.completionsByDate.map((d) => d.count), 1);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="retro-heading text-2xl">
          {selectedUserName} Statistics
        </h1>
        {partners.length > 0 && (
          <select
            value={selectedUserId || ""}
            onChange={(e) => {
              const value = e.target.value;
              if (value) {
                window.location.href = `/dashboard/stats?userId=${value}`;
              } else {
                window.location.href = "/dashboard/stats";
              }
            }}
            className="retro-input px-4 py-2 text-xs w-auto"
          >
            <option value="">My Stats</option>
            {partners.map((partner) => (
              <option key={partner.id} value={partner.id}>
                {partner.name || partner.email}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="retro-panel p-6 hover-lift">
          <h3 className="retro-subheading text-xs mb-3">
            Total Habits
          </h3>
          <p className="text-4xl font-black">
            {stats.totalHabits}
          </p>
        </div>

        <div className="retro-panel p-6 hover-lift">
          <h3 className="retro-subheading text-xs mb-3">
            Total Completions
          </h3>
          <p className="text-4xl font-black">
            {stats.totalCompletions}
          </p>
        </div>

        <div className="retro-panel p-6 hover-lift">
          <h3 className="retro-subheading text-xs mb-3">
            Avg. Per Day (30d)
          </h3>
          <p className="text-4xl font-black">
            {stats.averageCompletionsPerDay}
          </p>
        </div>
      </div>

      {/* Activity Chart */}
      <div className="retro-panel p-6 mb-8">
        <h2 className="retro-subheading text-base mb-6">
          Activity (Last 30 Days)
        </h2>
        <div className="flex items-end justify-between gap-1 h-48 border-b-2 border-[color:var(--border)]">
          {stats.completionsByDate.map((day) => {
            const height = (day.count / maxCount) * 100;
            return (
              <div
                key={day.date}
                className="flex-1 flex flex-col items-center group"
              >
                <div
                  className="w-full bg-[color:var(--text)] border-2 border-[color:var(--border)] transition-all hover:opacity-80"
                  style={{ height: `${height}%`, minHeight: day.count > 0 ? "8px" : "0" }}
                  title={`${day.date}: ${day.count} completions`}
                />
                <span className="text-[0.6rem] retro-text-muted mt-2 hidden group-hover:block uppercase font-black">
                  {new Date(day.date).getDate()}
                </span>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-xs retro-text-muted uppercase tracking-widest mt-3">
          <span>30 days ago</span>
          <span>Today</span>
        </div>
      </div>

      {/* Habits Breakdown */}
      <div className="retro-panel p-6">
        <h2 className="retro-subheading text-base mb-6">
          Habits Breakdown
        </h2>
        {stats.habitsWithStreaks.length === 0 ? (
          <p className="retro-text-muted uppercase tracking-wider text-center py-8">No habits yet</p>
        ) : (
          <div className="space-y-4">
            {stats.habitsWithStreaks.map((habit) => (
              <div
                key={habit.id}
                className="retro-panel-flat p-5 hover-lift"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-black uppercase tracking-wide">
                      {habit.title}
                    </h3>
                    <span className="retro-text-muted text-xs uppercase tracking-wider mt-1 inline-block">
                      {habit.frequency}
                    </span>
                  </div>
                  <span className="retro-tag text-xs">
                    {habit.totalCompletions} completions
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t-2 border-[color:var(--border)]">
                  <div>
                    <p className="retro-text-muted text-xs uppercase tracking-wider mb-2">
                      Current Streak
                    </p>
                    <p className="text-3xl font-black">
                      {habit.currentStreak} 🔥
                    </p>
                  </div>
                  <div>
                    <p className="retro-text-muted text-xs uppercase tracking-wider mb-2">
                      Longest Streak
                    </p>
                    <p className="text-3xl font-black">
                      {habit.longestStreak} ⭐
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


export default function StatsPage() {
  return (
    <Suspense fallback={<div className='flex items-center justify-center h-64'><div className='text-gray-600 dark:text-gray-400'>Loading...</div></div>}>
      <StatsContent />
    </Suspense>
  );
}
