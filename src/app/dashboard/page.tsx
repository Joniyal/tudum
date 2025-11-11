"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useHabitReminders } from "@/hooks/useHabitReminders";
import AlarmModal from "@/components/AlarmModal";
import HabitMenu from "@/components/HabitMenu";
import EditHabitModal from "@/components/EditHabitModal";
import TimetableBuilder from "@/components/TimetableBuilder";
import TimetableHabitCarousel from "@/components/TimetableHabitCarousel";
import ShareHabitModal from "@/components/ShareHabitModal";

type Habit = {
  id: string;
  title: string;
  description: string | null;
  frequency: "DAILY" | "WEEKLY" | "MONTHLY";
  reminderTime: string | null;
  reminderEnabled: boolean;
  alarmDuration: number | null;
  completions: Array<{
    id: string;
    completedAt: string;
    userId: string;
  }>;
};

type Partner = {
  id: string;
  name: string | null;
  email: string;
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showTimetable, setShowTimetable] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [deletingHabitId, setDeletingHabitId] = useState<string | null>(null);
  const [sharingHabit, setSharingHabit] = useState<{ id: string; title: string } | null>(null);
  const { activeAlarms, handleDismiss, handleSnooze, handleComplete } = useHabitReminders();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    frequency: "DAILY" as "DAILY" | "WEEKLY" | "MONTHLY",
    reminderTime: "",
    reminderPeriod: "AM" as "AM" | "PM",
    reminderEnabled: false,
    alarmDuration: 5,
    sharedWith: [] as string[],
  });

  const fetchPartners = useCallback(async () => {
    try {
      const res = await fetch("/api/connections");
      if (res.ok) {
        const connections = await res.json();
        const acceptedConnections = connections.filter((c: any) => c.status === "ACCEPTED");
        const partnersList = acceptedConnections
          .map((c: any) => {
            const currentUserId = session?.user?.id;
            const partner = c.fromUser.id === currentUserId ? c.toUser : c.fromUser;
            return partner;
          })
          .filter((partner: any) => partner.id !== session?.user?.id); // Exclude current user
        setPartners(partnersList);
      }
    } catch (error) {
      console.error("Error fetching partners:", error);
    }
  }, [session?.user?.id]);

  const fetchHabits = useCallback(async () => {
    try {
      const res = await fetch("/api/habits");
      if (res.ok) {
        const data = await res.json();
        setHabits(data);
      }
    } catch (error) {
      console.error("Error fetching habits:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session?.user?.id) {
      fetchHabits();
      fetchPartners();
    }
  }, [session?.user?.id, fetchHabits, fetchPartners]);

  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Get timezone offset in minutes
      const timezoneOffset = new Date().getTimezoneOffset();
      
      const res = await fetch("/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          timezoneOffset, // Send timezone offset to server
        }),
      });

      if (res.ok) {
        setFormData({ 
          title: "", 
          description: "",
          alarmDuration: 5, 
          frequency: "DAILY", 
          reminderTime: "",
          reminderPeriod: "AM",
          reminderEnabled: false,
          sharedWith: [] 
        });
        setShowForm(false);
        fetchHabits();
      }
    } catch (error) {
      console.error("Error creating habit:", error);
    }
  };

  const handleCompleteHabit = async (habitId: string) => {
    try {
      const res = await fetch(`/api/habits/${habitId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (res.ok) {
        fetchHabits();
      }
    } catch (error) {
      console.error("Error completing habit:", error);
    }
  };

  const handleDeleteHabit = async (habitId: string) => {
    setDeletingHabitId(habitId);
  };

  const confirmDelete = async () => {
    if (!deletingHabitId) return;

    try {
      const res = await fetch(`/api/habits/${deletingHabitId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchHabits();
        setDeletingHabitId(null);
      }
    } catch (error) {
      console.error("Error deleting habit:", error);
    }
  };

  const handleEditHabit = (habit: Habit) => {
    setEditingHabit(habit);
  };

  const handleSaveHabit = async (updatedData: Partial<Habit>) => {
    if (!editingHabit) return;

    try {
      // Get timezone offset
      const timezoneOffset = -new Date().getTimezoneOffset();

      const res = await fetch(`/api/habits/${editingHabit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...updatedData,
          timezoneOffset,
        }),
      });

      if (res.ok) {
        fetchHabits();
        setEditingHabit(null);
      } else {
        const error = await res.json();
        alert(error.error || "Failed to update habit");
      }
    } catch (error) {
      console.error("Error updating habit:", error);
      alert("Failed to update habit");
    }
  };

  const handleSaveTimetable = async (slots: any[]) => {
    try {
      const timezoneOffset = -new Date().getTimezoneOffset();

      // Create habits for each time slot
      const promises = slots.map(slot =>
        fetch("/api/habits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: slot.title,
            description: `Part of daily routine - ${slot.duration} minutes`,
            frequency: "DAILY",
            reminderEnabled: true,
            reminderTime: slot.time,
            alarmDuration: Math.min(slot.duration, 60), // Cap at 60 minutes
            timezoneOffset,
            sharedWith: [],
          }),
        })
      );

      await Promise.all(promises);
      fetchHabits();
      alert(`Successfully created ${slots.length} habits from your timetable!`);
    } catch (error) {
      console.error("Error creating timetable habits:", error);
      alert("Failed to create some habits");
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
            My Habits
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track your daily, weekly, and monthly goals
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowTimetable(true)}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg transition shadow-lg hover:shadow-xl flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>📅 Build Timetable</span>
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition"
          >
            {showForm ? "Cancel" : "+ New Habit"}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Create New Habit
          </h2>
          <form onSubmit={handleCreateHabit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Title
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                placeholder="e.g., Morning Exercise"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description (optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                placeholder="Add more details..."
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Frequency
              </label>
              <select
                value={formData.frequency}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    frequency: e.target.value as "DAILY" | "WEEKLY" | "MONTHLY",
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
              </select>
            </div>

            {/* Reminder Settings */}
            <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700/50">
              <div className="flex items-center justify-between mb-3">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.reminderEnabled}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        reminderEnabled: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    🔔 Set Reminder
                  </span>
                </label>
              </div>
              
              {formData.reminderEnabled && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Reminder Time
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={formData.reminderTime.split(':')[0] || "09"}
                        onChange={(e) => {
                          const minutes = formData.reminderTime.split(':')[1] || "00";
                          setFormData({
                            ...formData,
                            reminderTime: `${e.target.value}:${minutes}`,
                          })
                        }}
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                          <option key={h} value={String(h).padStart(2, "0")}>
                            {String(h).padStart(2, "0")}
                          </option>
                        ))}
                      </select>
                      
                      <select
                        value={formData.reminderTime.split(':')[1] || "00"}
                        onChange={(e) => {
                          const hours = formData.reminderTime.split(':')[0] || "09";
                          setFormData({
                            ...formData,
                            reminderTime: `${hours}:${e.target.value}`,
                          })
                        }}
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        {Array.from({ length: 60 }, (_, i) => i).map((m) => (
                          <option key={m} value={String(m).padStart(2, "0")}>
                            {String(m).padStart(2, "0")}
                          </option>
                        ))}
                      </select>

                      <select
                        value={formData.reminderPeriod}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            reminderPeriod: e.target.value as "AM" | "PM",
                          })
                        }
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    </div>
                    {formData.reminderTime && (
                      <p className="text-sm text-indigo-600 dark:text-indigo-400 mt-2">
                        ✓ Reminder set for {formData.reminderTime} {formData.reminderPeriod}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      You&apos;ll receive a browser notification at this time
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      ⏰ Alarm Duration
                    </label>
                    <select
                      value={formData.alarmDuration || 5}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          alarmDuration: Number(e.target.value),
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="1">1 minute</option>
                      <option value="2">2 minutes</option>
                      <option value="5">5 minutes</option>
                      <option value="10">10 minutes</option>
                      <option value="15">15 minutes</option>
                      <option value="30">30 minutes</option>
                      <option value="60">1 hour</option>
                      <option value="-1">Until completed</option>
                    </select>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      How long should the alarm play? You can snooze or mark complete to stop it.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {partners.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Share with partners (optional)
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-white dark:bg-gray-700">
                  {partners.map((partner) => (
                    <label key={partner.id} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.sharedWith.includes(partner.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              sharedWith: [...formData.sharedWith, partner.id],
                            });
                          } else {
                            setFormData({
                              ...formData,
                              sharedWith: formData.sharedWith.filter((id) => id !== partner.id),
                            });
                          }
                        }}
                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-900 dark:text-white">
                        {partner.name || partner.email}
                      </span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Selected partners will also be able to track this habit
                </p>
              </div>
            )}

            <button
              type="submit"
              className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition"
            >
              Create Habit
            </button>
          </form>
        </div>
      )}

      {habits.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            No habits yet. Create your first habit to get started!
          </p>
        </div>
      ) : (
        <>
          {/* Timetable Carousel - Only show if there are habits with reminder times */}
          <TimetableHabitCarousel
            habits={habits}
            onComplete={handleCompleteHabit}
            onEdit={handleEditHabit}
            onDelete={handleDeleteHabit}
          />

          {/* Regular Habits Grid */}
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              All Habits
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {habits.map((habit) => {
              const completedToday = isCompletedToday(habit.completions);
              const streak = getStreak(habit.completions);

              return (
                <div
                  key={habit.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {habit.title}
                        </h3>
                        {habit.reminderTime && (
                          <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                            {(() => {
                              const [h, m] = habit.reminderTime.split(":").map(Number);
                              const hour = h % 12 || 12;
                              const period = h < 12 ? "AM" : "PM";
                              return `${hour}:${m.toString().padStart(2, "0")} ${period}`;
                            })()}
                          </span>
                        )}
                      </div>
                      <span className="inline-block px-2 py-1 text-xs font-medium bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded">
                        {habit.frequency}
                      </span>
                    </div>
                    <HabitMenu
                      habitId={habit.id}
                      onEdit={() => handleEditHabit(habit)}
                      onDelete={() => handleDeleteHabit(habit.id)}
                    />
                  </div>

                  {habit.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {habit.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Streak: </span>
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                        {streak} days 🔥
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {habit.completions.length} completions
                    </div>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={() => handleCompleteHabit(habit.id)}
                      disabled={completedToday}
                      className={`w-full py-3 px-4 rounded-lg font-semibold transition ${
                        completedToday
                          ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 cursor-not-allowed"
                          : "bg-indigo-600 hover:bg-indigo-700 text-white"
                      }`}
                    >
                      {completedToday ? "✓ Completed Today" : "Mark Complete"}
                    </button>
                    
                    {partners.length > 0 && (
                      <button
                        onClick={() => setSharingHabit({ id: habit.id, title: habit.title })}
                        className="w-full py-2 px-4 rounded-lg font-medium transition bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-800"
                      >
                        🤝 Share with Partner
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Alarm Modals */}
      {activeAlarms.map((alarm) => (
        <AlarmModal
          key={alarm.habit.id}
          habit={alarm.habit}
          triggeredAt={alarm.triggeredAt}
          onDismiss={() => handleDismiss(alarm.habit.id)}
          onSnooze={(minutes) => handleSnooze(alarm.habit.id, minutes)}
          onComplete={async () => {
            await handleComplete(alarm.habit.id);
            // Refresh habits list
            fetchHabits();
          }}
        />
      ))}

      {/* Timetable Builder */}
      {showTimetable && (
        <TimetableBuilder
          onClose={() => setShowTimetable(false)}
          onSave={handleSaveTimetable}
        />
      )}

      {/* Edit Habit Modal */}
      {editingHabit && (
        <EditHabitModal
          habit={editingHabit}
          onClose={() => setEditingHabit(null)}
          onSave={handleSaveHabit}
        />
      )}

      {/* Share Habit Modal */}
      {sharingHabit && (
        <ShareHabitModal
          habitId={sharingHabit.id}
          habitTitle={sharingHabit.title}
          onClose={() => setSharingHabit(null)}
          onSuccess={() => {
            fetchHabits();
            setSharingHabit(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingHabitId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Delete Habit</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Are you sure you want to delete this habit? All completion history will be permanently removed.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setDeletingHabitId(null)}
                className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
