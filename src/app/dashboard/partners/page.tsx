"use client";

import { useEffect, useState } from "react";

type Partner = {
  partner: {
    id: string;
    name: string | null;
    email: string;
  };
  habits: Array<{
    id: string;
    title: string;
    description: string | null;
    frequency: "DAILY" | "WEEKLY" | "MONTHLY";
    completions: Array<{
      id: string;
      completedAt: string;
    }>;
  }>;
};

export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchPartners();

    // Auto-refresh every 30 seconds for real-time updates
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchPartners();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const fetchPartners = async () => {
    try {
      const res = await fetch("/api/partners");
      if (res.ok) {
        const data = await res.json();
        setPartners(data);
      }
    } catch (error) {
      console.error("Error fetching partners:", error);
    } finally {
      setLoading(false);
    }
  };

  const isCompletedToday = (completions: Array<{ completedAt: string }>) => {
    const today = new Date().toDateString();
    return completions.some(
      (c) => new Date(c.completedAt).toDateString() === today
    );
  };

  const getStreak = (completions: Array<{ completedAt: string }>) => {
    if (completions.length === 0) return 0;

    const dates = completions
      .map((c) => new Date(c.completedAt).toDateString())
      .filter((date, index, self) => self.indexOf(date) === index)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    let streak = 0;
    let currentDate = new Date();

    for (const date of dates) {
      const completionDate = new Date(date);
      const diffDays = Math.floor(
        (currentDate.getTime() - completionDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays === streak) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Partners&apos; Progress
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            See how your accountability partners are doing
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchPartners()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition"
          >
            🔄 Refresh
          </button>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            Auto-refresh
          </label>
        </div>
      </div>

      {partners.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            No partners yet. Connect with others in the Connections tab to see their progress!
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {partners.map((partnerData) => (
            <div
              key={partnerData.partner.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
            >
              <div className="flex items-center justify-between mb-6 pb-4 border-b dark:border-gray-700">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {partnerData.partner.name || "Partner"}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {partnerData.partner.email}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Total Habits
                  </p>
                  <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                    {partnerData.habits.length}
                  </p>
                </div>
              </div>

              {partnerData.habits.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                  No habits created yet
                </p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {partnerData.habits.map((habit) => {
                    const completedToday = isCompletedToday(habit.completions);
                    const streak = getStreak(habit.completions);

                    return (
                      <div
                        key={habit.id}
                        className={`border-2 rounded-lg p-4 transition ${
                          completedToday
                            ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                            : "border-gray-200 dark:border-gray-700"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {habit.title}
                          </h3>
                          {completedToday && (
                            <span className="text-green-600 dark:text-green-400 text-xl">
                              ✓
                            </span>
                          )}
                        </div>

                        <div className="space-y-2">
                          <span className="inline-block px-2 py-1 text-xs font-medium bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded">
                            {habit.frequency}
                          </span>

                          {habit.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {habit.description}
                            </p>
                          )}

                          <div className="flex items-center justify-between pt-2">
                            <div className="text-sm">
                              <span className="text-gray-600 dark:text-gray-400">
                                Streak:{" "}
                              </span>
                              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                                {streak} days 🔥
                              </span>
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              {habit.completions.length} total
                            </div>
                          </div>

                          {completedToday && (
                            <p className="text-xs text-green-600 dark:text-green-400 font-medium pt-2">
                              ✨ Completed today!
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
