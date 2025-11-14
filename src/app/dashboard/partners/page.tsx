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
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);

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

  const handleSendReminder = async (partnerId: string, habitTitle: string) => {
    setSendingReminder(partnerId);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toUserId: partnerId,
          content: `🔔 Reminder: Don't forget to complete "${habitTitle}" today!`,
        }),
      });

      if (res.ok) {
        alert("Reminder sent successfully!");
      }
    } catch (error) {
      console.error("Error sending reminder:", error);
      alert("Failed to send reminder");
    } finally {
      setSendingReminder(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="retro-text-muted">LOADING...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="retro-heading text-2xl">
            👥 PARTNERS&apos; PROGRESS
          </h1>
          <p className="retro-text-muted text-xs uppercase tracking-wider mt-2">
            See how your accountability partners are doing
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchPartners()}
            className="retro-button text-xs hover-lift"
          >
            🔄 REFRESH
          </button>
          <label className="flex items-center gap-2 text-xs uppercase tracking-wider font-bold">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-4 h-4 border-2 border-[color:var(--border)]"
            />
            AUTO-REFRESH
          </label>
        </div>
      </div>

      {partners.length === 0 ? (
        <div className="retro-panel p-12 text-center">
          <p className="retro-text-muted uppercase tracking-wider">
            No partners yet. Connect with others in the Connections tab to see their progress!
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {partners.map((partnerData) => (
            <div
              key={partnerData.partner.id}
              className="retro-panel p-6 hover-lift"
            >
              <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-[color:var(--border)]">
                <div>
                  <h2 className="retro-heading text-lg">
                    {partnerData.partner.name || "Partner"}
                  </h2>
                  <p className="retro-text-muted text-xs uppercase tracking-wider">
                    {partnerData.partner.email}
                  </p>
                </div>
                <div className="text-right">
                  <p className="retro-text-muted text-xs uppercase tracking-wider">
                    TOTAL HABITS
                  </p>
                  <p className="text-3xl font-black">
                    {partnerData.habits.length}
                  </p>
                </div>
              </div>

              {partnerData.habits.length === 0 ? (
                <p className="retro-text-muted uppercase tracking-wider text-center py-8">
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
                        className={`retro-panel-flat border-2 p-4 transition hover-lift ${
                          completedToday
                            ? "border-[color:var(--text)]"
                            : "border-[color:var(--border)]"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-bold">
                            {habit.title}
                          </h3>
                          {completedToday && (
                            <span className="text-xl">
                              ✓
                            </span>
                          )}
                        </div>

                        <div className="space-y-2">
                          <span className="retro-tag text-[0.65rem]">
                            {habit.frequency}
                          </span>

                          {habit.description && (
                            <p className="retro-text-muted text-xs uppercase tracking-wide">
                              {habit.description}
                            </p>
                          )}

                          <div className="flex items-center justify-between pt-2 border-t border-[color:var(--border)]">
                            <div className="text-xs">
                              <span className="retro-text-muted uppercase tracking-wider">
                                STREAK:{" "}
                              </span>
                              <span className="font-black">
                                {streak} 🔥
                              </span>
                            </div>
                            <div className="retro-text-muted text-[0.6rem] uppercase tracking-wider">
                              {habit.completions.length} TOTAL
                            </div>
                          </div>

                          {completedToday ? (
                            <p className="retro-tag text-[0.65rem] mt-2">
                              ✨ DONE TODAY
                            </p>
                          ) : (
                            <button
                              onClick={() => handleSendReminder(partnerData.partner.id, habit.title)}
                              disabled={sendingReminder === partnerData.partner.id}
                              className="w-full mt-2 retro-button-outline text-xs hover-lift disabled:opacity-50"
                            >
                              {sendingReminder === partnerData.partner.id ? "⏳ SENDING..." : "🔔 REMIND"}
                            </button>
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
