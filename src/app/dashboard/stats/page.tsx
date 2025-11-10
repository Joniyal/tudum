"use client";

import { useEffect, useState, Suspense } from "react";
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

  useEffect(() => {
    fetchPartners();
  }, []);

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
  }, [selectedUserId]);

  const fetchPartners = async () => {
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
  };

  const fetchStats = async () => {
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
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600 dark:text-gray-400">No stats available</div>
      </div>
    );
  }

  const maxCount = Math.max(...stats.completionsByDate.map((d) => d.count), 1);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
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
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            Total Habits
          </h3>
          <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
            {stats.totalHabits}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            Total Completions
          </h3>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">
            {stats.totalCompletions}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            Avg. Per Day (30d)
          </h3>
          <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
            {stats.averageCompletionsPerDay}
          </p>
        </div>
      </div>

      {/* Activity Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Activity (Last 30 Days)
        </h2>
        <div className="flex items-end justify-between gap-1 h-48">
          {stats.completionsByDate.map((day) => {
            const height = (day.count / maxCount) * 100;
            return (
              <div
                key={day.date}
                className="flex-1 flex flex-col items-center group"
              >
                <div
                  className="w-full bg-indigo-600 dark:bg-indigo-500 rounded-t transition-all hover:bg-indigo-700"
                  style={{ height: `${height}%`, minHeight: day.count > 0 ? "4px" : "0" }}
                  title={`${day.date}: ${day.count} completions`}
                />
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-2 hidden group-hover:block">
                  {new Date(day.date).getDate()}
                </span>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-2">
          <span>30 days ago</span>
          <span>Today</span>
        </div>
      </div>

      {/* Habits Breakdown */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Habits Breakdown
        </h2>
        {stats.habitsWithStreaks.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">No habits yet</p>
        ) : (
          <div className="space-y-4">
            {stats.habitsWithStreaks.map((habit) => (
              <div
                key={habit.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {habit.title}
                    </h3>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {habit.frequency}
                    </span>
                  </div>
                  <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-sm font-medium rounded">
                    {habit.totalCompletions} completions
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Current Streak
                    </p>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {habit.currentStreak} 🔥
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Longest Streak
                    </p>
                    <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
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
