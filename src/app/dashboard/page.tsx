"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useHabitReminders } from "@/hooks/useHabitReminders";
import AlarmModal from "@/components/AlarmModal";
import EditHabitModal from "@/components/EditHabitModal";
import TimetableBuilder from "@/components/TimetableBuilder";
import TimetableHabitCarousel from "@/components/TimetableHabitCarousel";
import ShareHabitModal from "@/components/ShareHabitModal";
import EnhancedHabitCard from "@/components/EnhancedHabitCard";
import BulkActionsToolbar from "@/components/BulkActionsToolbar";
import CreateCollectionModal from "@/components/CreateCollectionModal";

type Habit = {
  id: string;
  title: string;
  description: string | null;
  frequency: "DAILY" | "WEEKLY" | "MONTHLY";
  reminderTime: string | null;
  reminderEnabled: boolean;
  alarmDuration: number | null;
  collectionId: string | null;
  sortOrder: number;
  archived: boolean;
  completions: Array<{
    id: string;
    completedAt: string;
    userId: string;
  }>;
  collection: {
    id: string;
    name: string;
    color: string;
    icon: string | null;
  } | null;
};

type HabitCollection = {
  id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string | null;
  dayOfWeek: string | null;
  habits: Habit[];
  _count: {
    habits: number;
  };
};

type Partner = {
  id: string;
  name: string | null;
  email: string;
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [collections, setCollections] = useState<HabitCollection[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showTimetable, setShowTimetable] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [deletingHabitId, setDeletingHabitId] = useState<string | null>(null);
  const [sharingHabit, setSharingHabit] = useState<{ id: string; title: string } | null>(null);
  
  // New state for enhanced features
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedHabits, setSelectedHabits] = useState<Set<string>>(new Set());
  const [showCreateCollection, setShowCreateCollection] = useState(false);
  const [filterCollection, setFilterCollection] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"title" | "frequency" | "streak" | "completions">("title");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showArchived, setShowArchived] = useState(false);
  const [habitsExpanded, setHabitsExpanded] = useState(true);
  
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

  const fetchCollections = useCallback(async () => {
    try {
      const res = await fetch("/api/collections");
      if (res.ok) {
        const data = await res.json();
        setCollections(data);
      }
    } catch (error) {
      console.error("Error fetching collections:", error);
    }
  }, []);

  useEffect(() => {
    if (session?.user?.id) {
      fetchHabits();
      fetchPartners();
      fetchCollections();
    }
  }, [session?.user?.id, fetchHabits, fetchPartners, fetchCollections]);

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

  // Selection handlers
  const handleSelectHabit = (habitId: string) => {
    const newSelection = new Set(selectedHabits);
    if (newSelection.has(habitId)) {
      newSelection.delete(habitId);
    } else {
      newSelection.add(habitId);
    }
    setSelectedHabits(newSelection);
  };

  const handleSelectAll = () => {
    const visibleHabits = getFilteredAndSortedHabits();
    setSelectedHabits(new Set(visibleHabits.map(h => h.id)));
  };

  const handleDeselectAll = () => {
    setSelectedHabits(new Set());
  };

  // Bulk operations
  const handleBulkDelete = async () => {
    if (selectedHabits.size === 0) return;
    if (!confirm(`Delete ${selectedHabits.size} habit(s)? This cannot be undone.`)) return;

    try {
      const res = await fetch("/api/habits/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete",
          habitIds: Array.from(selectedHabits),
        }),
      });

      if (res.ok) {
        fetchHabits();
        setSelectedHabits(new Set());
        setSelectionMode(false);
      }
    } catch (error) {
      console.error("Error deleting habits:", error);
    }
  };

  const handleBulkArchive = async () => {
    if (selectedHabits.size === 0) return;

    try {
      const res = await fetch("/api/habits/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "archive",
          habitIds: Array.from(selectedHabits),
        }),
      });

      if (res.ok) {
        fetchHabits();
        setSelectedHabits(new Set());
        setSelectionMode(false);
      }
    } catch (error) {
      console.error("Error archiving habits:", error);
    }
  };

  const handleBulkComplete = async () => {
    if (selectedHabits.size === 0) return;

    try {
      const res = await fetch("/api/habits/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "complete",
          habitIds: Array.from(selectedHabits),
        }),
      });

      if (res.ok) {
        fetchHabits();
        setSelectedHabits(new Set());
      }
    } catch (error) {
      console.error("Error completing habits:", error);
    }
  };

  const handleCreateCollection = () => {
    if (selectedHabits.size === 0) {
      alert("Please select at least one habit to create a collection.");
      return;
    }
    setShowCreateCollection(true);
  };

  const handleSubmitCollection = async (collectionData: any) => {
    try {
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...collectionData,
          habitIds: Array.from(selectedHabits),
        }),
      });

      if (res.ok) {
        fetchHabits();
        fetchCollections();
        setSelectedHabits(new Set());
        setShowCreateCollection(false);
        setSelectionMode(false);
      }
    } catch (error) {
      console.error("Error creating collection:", error);
    }
  };

  const handleArchiveHabit = async (habitId: string) => {
    try {
      const habit = habits.find(h => h.id === habitId);
      if (!habit) return;

      const res = await fetch("/api/habits/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: habit.archived ? "unarchive" : "archive",
          habitIds: [habitId],
        }),
      });

      if (res.ok) {
        fetchHabits();
      }
    } catch (error) {
      console.error("Error archiving habit:", error);
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

  // Utility functions
  const isCompletedToday = (completions: Habit["completions"]) => {
    const today = new Date().toDateString();
    return completions.some((c) => new Date(c.completedAt).toDateString() === today);
  };

  const getStreak = (completions: Habit["completions"]) => {
    if (completions.length === 0) return 0;

    const sortedCompletions = [...completions]
      .map((c) => new Date(c.completedAt))
      .sort((a, b) => b.getTime() - a.getTime());

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const completionDate of sortedCompletions) {
      completionDate.setHours(0, 0, 0, 0);
      if (completionDate.getTime() === currentDate.getTime()) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (completionDate.getTime() < currentDate.getTime()) {
        break;
      }
    }

    return streak;
  };

  const getFilteredAndSortedHabits = () => {
    let filtered = habits.filter(h => showArchived ? h.archived : !h.archived);

    if (filterCollection) {
      filtered = filtered.filter(h => h.collectionId === filterCollection);
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "frequency":
          return a.frequency.localeCompare(b.frequency);
        case "streak":
          return getStreak(b.completions) - getStreak(a.completions);
        case "completions":
          return b.completions.length - a.completions.length;
        default:
          return a.title.localeCompare(b.title);
      }
    });
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

      {habits.length === 0 && !showArchived ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            No habits yet. Create your first habit to get started!
          </p>
        </div>
      ) : (
        <>
          {/* Timetable Carousel - Only show active habits with reminder times */}
          {!showArchived && (
            <TimetableHabitCarousel
              habits={habits.filter(h => !h.archived)}
              onComplete={handleCompleteHabit}
              onEdit={handleEditHabit}
              onDelete={handleDeleteHabit}
            />
          )}

          {/* Enhanced Toolbar */}
          <div className="bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-md p-4 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Left Side - Title & Stats with Collapse Button */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setHabitsExpanded(!habitsExpanded)}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-all"
                  title={habitsExpanded ? "Collapse habits" : "Expand habits"}
                >
                  <svg
                    className={`w-6 h-6 text-gray-700 dark:text-gray-300 transition-transform duration-300 ${
                      habitsExpanded ? "rotate-0" : "-rotate-90"
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                    {showArchived ? "📦 Archived Habits" : "🎯 Your Habits"}
                    <span className="text-base font-normal text-gray-500 dark:text-gray-400">
                      ({getFilteredAndSortedHabits().length})
                    </span>
                  </h2>
                  {collections.length > 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {collections.length} collection{collections.length !== 1 ? "s" : ""}
                    </p>
                  )}
                </div>
              </div>

              {/* Right Side - Actions */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Selection Mode Toggle */}
                <button
                  onClick={() => {
                    setSelectionMode(!selectionMode);
                    if (selectionMode) {
                      setSelectedHabits(new Set());
                    }
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    selectionMode
                      ? "bg-indigo-600 text-white"
                      : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                  }`}
                >
                  {selectionMode ? "✓ Done Selecting" : "☑️ Select"}
                </button>

                {/* View Mode Toggle */}
                <button
                  onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
                  className="px-4 py-2 rounded-lg font-medium bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-all"
                  title="Toggle view mode"
                >
                  {viewMode === "grid" ? "☰" : "▦"}
                </button>

                {/* Sort Dropdown */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-4 py-2 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="title">Sort: A-Z</option>
                  <option value="frequency">Sort: Frequency</option>
                  <option value="streak">Sort: Streak</option>
                  <option value="completions">Sort: Completions</option>
                </select>

                {/* Collection Filter */}
                {collections.length > 0 && (
                  <select
                    value={filterCollection || ""}
                    onChange={(e) => setFilterCollection(e.target.value || null)}
                    className="px-4 py-2 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">All Collections</option>
                    {collections.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.icon} {c.name}
                      </option>
                    ))}
                  </select>
                )}

                {/* Archive Toggle */}
                <button
                  onClick={() => setShowArchived(!showArchived)}
                  className="px-4 py-2 rounded-lg font-medium bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-all"
                  title={showArchived ? "Show active habits" : "Show archived habits"}
                >
                  {showArchived ? "📂 Active" : "📦 Archive"}
                </button>
              </div>
            </div>
          </div>

          {/* Habits Display - Collapsible */}
          <div
            className={`transition-all duration-300 overflow-hidden ${
              habitsExpanded ? "max-h-[10000px] opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <div className={
              viewMode === "grid"
                ? "grid gap-6 md:grid-cols-2 lg:grid-cols-3"
                : "space-y-4"
            }>
              {getFilteredAndSortedHabits().map((habit) => (
                <EnhancedHabitCard
                  key={habit.id}
                  habit={habit}
                  isSelected={selectedHabits.has(habit.id)}
                  onSelect={handleSelectHabit}
                  onComplete={handleCompleteHabit}
                  onEdit={handleEditHabit}
                  onDelete={handleDeleteHabit}
                  onArchive={handleArchiveHabit}
                  onShare={(id, title) => setSharingHabit({ id, title })}
                  streak={getStreak(habit.completions)}
                  completedToday={isCompletedToday(habit.completions)}
                  selectionMode={selectionMode}
                />
              ))}
            </div>

            {getFilteredAndSortedHabits().length === 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
                <p className="text-gray-600 dark:text-gray-400">
                  {showArchived ? "No archived habits" : "No habits match your filters"}
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Bulk Actions Toolbar */}
      <BulkActionsToolbar
        selectedCount={selectedHabits.size}
        totalCount={getFilteredAndSortedHabits().length}
        onSelectAll={handleSelectAll}
        onDeselectAll={handleDeselectAll}
        onDelete={handleBulkDelete}
        onArchive={handleBulkArchive}
        onCreateCollection={handleCreateCollection}
        onAddToCollection={() => {}}
        onComplete={handleBulkComplete}
        collections={collections.map(c => ({ id: c.id, name: c.name, color: c.color }))}
      />

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

      {/* Create Collection Modal */}
      {showCreateCollection && (
        <CreateCollectionModal
          selectedHabitIds={Array.from(selectedHabits)}
          onClose={() => setShowCreateCollection(false)}
          onSubmit={handleSubmitCollection}
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
