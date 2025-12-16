"use client";

import { useEffect, useState } from "react";
import { FireIcon, RefreshIcon } from "@/components/Icons";

interface Habit {
  id: string;
  title: string;
  frequency: string;
  description: string | null;
  archived: boolean;
  createdAt: string;
  _count: {
    completions: number;
  };
  user: {
    id: string;
    username: string;
  };
}

export default function AdminHabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "archived">("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchHabits();
  }, []);

  const fetchHabits = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/habits");
      if (!res.ok) throw new Error("Failed to fetch habits");
      const data = await res.json();
      setHabits(data.habits);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const deleteHabit = async (habitId: string, habitName: string) => {
    if (!confirm(`Are you sure you want to delete "${habitName}"? This will also delete all completions.`)) {
      return;
    }

    setActionLoading(habitId);
    try {
      const res = await fetch(`/api/admin/habits/${habitId}`, {
        method: "DELETE",
      });
      
      if (!res.ok) throw new Error("Failed to delete habit");
      
      setHabits(habits.filter(h => h.id !== habitId));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setActionLoading(null);
    }
  };

  const toggleArchive = async (habitId: string, archived: boolean) => {
    setActionLoading(habitId);
    try {
      const res = await fetch(`/api/admin/habits/${habitId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: !archived }),
      });
      
      if (!res.ok) throw new Error("Failed to update habit");
      
      setHabits(habits.map(h => 
        h.id === habitId ? { ...h, archived: !archived } : h
      ));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredHabits = habits.filter(habit => {
    const matchesSearch = 
      habit.title.toLowerCase().includes(search.toLowerCase()) ||
      habit.user.username.toLowerCase().includes(search.toLowerCase());
    
    const matchesFilter = 
      filter === "all" ||
      (filter === "active" && !habit.archived) ||
      (filter === "archived" && habit.archived);
    
    return matchesSearch && matchesFilter;
  });

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
          onClick={fetchHabits}
          className="mt-4 px-4 py-2 rounded-lg border transition-colors"
          style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text)' }}>
            <FireIcon className="w-6 h-6" />
            Habit Management
          </h1>
          <p style={{ color: 'var(--muted)' }}>
            {habits.length} total habits
          </p>
        </div>
        <button
          onClick={fetchHabits}
          className="p-2 rounded-lg border transition-colors"
          style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
        >
          <RefreshIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder="Search habits or users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
          style={{ 
            borderColor: 'var(--border)', 
            background: 'var(--surface)', 
            color: 'var(--text)',
          }}
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as typeof filter)}
          className="px-4 py-2 rounded-lg border focus:outline-none"
          style={{ 
            borderColor: 'var(--border)', 
            background: 'var(--surface)', 
            color: 'var(--text)',
          }}
        >
          <option value="all">All Habits</option>
          <option value="active">Active Only</option>
          <option value="archived">Archived Only</option>
        </select>
      </div>

      {/* Habits Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredHabits.map((habit) => (
          <div
            key={habit.id}
            className="rounded-lg border p-4"
            style={{ 
              borderColor: 'var(--border)', 
              background: 'var(--surface)',
              opacity: habit.archived ? 0.6 : 1
            }}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-medium" style={{ color: 'var(--text)' }}>
                  {habit.title}
                </h3>
                <p className="text-sm" style={{ color: 'var(--muted)' }}>
                  by @{habit.user.username}
                </p>
              </div>
              {habit.archived && (
                <span 
                  className="px-2 py-0.5 rounded text-xs"
                  style={{ background: 'var(--border)', color: 'var(--muted)' }}
                >
                  Archived
                </span>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2 mb-4 text-xs" style={{ color: 'var(--muted)' }}>
              <span className="px-2 py-1 rounded capitalize" style={{ background: 'var(--background)' }}>
                {habit.frequency}
              </span>
              {habit.description && (
                <span className="px-2 py-1 rounded" style={{ background: 'var(--background)' }}>
                  {habit.description.substring(0, 30)}{habit.description.length > 30 ? '...' : ''}
                </span>
              )}
              <span className="px-2 py-1 rounded" style={{ background: 'var(--background)' }}>
                {habit._count.completions} completions
              </span>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => toggleArchive(habit.id, habit.archived)}
                disabled={actionLoading === habit.id}
                className="flex-1 px-3 py-1.5 text-sm rounded-lg border transition-colors disabled:opacity-50"
                style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
              >
                {habit.archived ? "Unarchive" : "Archive"}
              </button>
              <button
                onClick={() => deleteHabit(habit.id, habit.title)}
                disabled={actionLoading === habit.id}
                className="px-3 py-1.5 text-sm rounded-lg border transition-colors disabled:opacity-50"
                style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredHabits.length === 0 && (
        <div 
          className="p-8 text-center rounded-lg border"
          style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
        >
          No habits found
        </div>
      )}
    </div>
  );
}
